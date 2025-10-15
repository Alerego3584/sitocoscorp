#!/usr/bin/env node

/**
 * Featured Set Processor
 *
 * Normalises each featured set directory by ensuring a `full/` and `thumbnails/`
 * subfolder exist, moves loose images into `full/`, generates fresh thumbnails,
 * and scaffolds a `meta.json` file with sensible defaults.
 *
 * Additionally ensures top-level gallery folders (e.g. images/corporate/) have
 * matching thumbnails generated for any images placed under their `full/`
 * directory so the main gallery pages stay in sync.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const TARGET_EDGE = 1100;

function toTitleCase(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

async function ensureDirectory(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function listDir(dirPath) {
  try {
    return await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    return [];
  }
}

async function moveLooseImages(setDir, fullDir) {
  const entries = await listDir(setDir);
  const moves = entries
    .filter((entry) =>
      entry.isFile() &&
      IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
    )
    .map(async (entry) => {
      const from = path.join(setDir, entry.name);
      const to = path.join(fullDir, entry.name);
      await fs.promises.rename(from, to);
      return entry.name;
    });

  return Promise.all(moves);
}

async function generateThumbnails(fullDir, thumbDir) {
  const fullImages = await listDir(fullDir);
  const results = [];

  for (const entry of fullImages) {
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const fullPath = path.join(fullDir, entry.name);
    const thumbPath = path.join(thumbDir, entry.name);

    await sharp(fullPath)
      .rotate()
      .resize(TARGET_EDGE, TARGET_EDGE, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(thumbPath);

    results.push(entry.name);
  }

  return results;
}

async function readMeta(metaPath) {
  try {
    const raw = await fs.promises.readFile(metaPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function resolveIsoDate(input) {
  if (!input) {
    return new Date().toISOString();
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

async function writeMeta(metaPath, meta) {
  const sortedCaptions = Object.keys(meta.captions || {})
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = meta.captions[key];
      return acc;
    }, {});

  const payload = {
    title: meta.title,
    description: meta.description || '',
    category: meta.category || '',
    date: resolveIsoDate(meta.date),
    captions: sortedCaptions
  };

  await fs.promises.writeFile(metaPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function ensureMeta({ setDir, setSlug, category, imageNames }) {
  const metaPath = path.join(setDir, 'meta.json');
  const existing = await readMeta(metaPath);

  const baseTitle = existing?.title || toTitleCase(setSlug);
  const defaultCategory = existing?.category || toTitleCase(category);

  const captions = { ...(existing?.captions || {}) };
  imageNames.forEach((name) => {
    const slug = path.parse(name).name;
    if (!captions[slug]) {
      captions[slug] = toTitleCase(slug);
    }
  });

  const meta = {
    title: baseTitle,
    description: existing?.description || '',
    category: defaultCategory,
    date: resolveIsoDate(existing?.date),
    captions
  };

  await writeMeta(metaPath, meta);
}

async function processCategoryRoot(category) {
  const categoryDir = path.join(IMAGES_DIR, category);
  const fullDir = path.join(categoryDir, 'full');
  const thumbDir = path.join(categoryDir, 'thumbnails');

  await ensureDirectory(fullDir);
  await ensureDirectory(thumbDir);

  const moved = await moveLooseImages(categoryDir, fullDir);
  const generatedThumbs = await generateThumbnails(fullDir, thumbDir);

  const fullEntries = await listDir(fullDir);
  const imageCount = fullEntries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .length;

  if (!imageCount && !generatedThumbs.length && !moved.length) {
    return null;
  }

  console.log(`✓ ${category}: ${generatedThumbs.length} gallery thumbnails refreshed${moved.length ? `, ${moved.length} files reorganised` : ''}`);

  return {
    category,
    generatedThumbs: generatedThumbs.length,
    moved
  };
}

async function processSet(category, setSlug) {
  const setDir = path.join(IMAGES_DIR, category, 'featured', setSlug);
  const fullDir = path.join(setDir, 'full');
  const thumbDir = path.join(setDir, 'thumbnails');

  await ensureDirectory(fullDir);
  await ensureDirectory(thumbDir);

  const moved = await moveLooseImages(setDir, fullDir);
  const generatedThumbs = await generateThumbnails(fullDir, thumbDir);

  const fullEntries = await listDir(fullDir);
  const imageNames = fullEntries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  await ensureMeta({ setDir, setSlug, category, imageNames });

  return {
    setSlug,
    moved,
    generatedThumbs: generatedThumbs.length
  };
}

async function processCategory(category) {
  const featuredDir = path.join(IMAGES_DIR, category, 'featured');
  const entries = await listDir(featuredDir);

  const sets = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const results = [];
  for (const setSlug of sets) {
    const result = await processSet(category, setSlug);
    results.push(result);
    console.log(`✓ ${category}/${setSlug}: ${result.generatedThumbs} thumbnails refreshed${result.moved.length ? `, ${result.moved.length} files reorganised` : ''}`);
  }

  return results;
}

async function main() {
  const categories = await listDir(IMAGES_DIR)
    .then((entries) => entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name))
    .catch(() => []);

  if (!categories.length) {
    console.error('No image categories found under', IMAGES_DIR);
    process.exit(1);
  }

  for (const category of categories) {
    await processCategoryRoot(category);
    await processCategory(category);
  }

  console.log('\nAll featured sets processed.');
}

main().catch((error) => {
  console.error('Featured set processing failed:', error);
  process.exit(1);
});
