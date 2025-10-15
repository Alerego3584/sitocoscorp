#!/usr/bin/env node

/**
 * Gallery Manifest Generator
 *
 * Scans each gallery directory in /images/<category>/(thumbnails|full) and
 * emits a manifest.json file with metadata for the front-end gallery loader.
 *
 * Usage:
 *   node scripts/generate-gallery-manifests.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function safeReadJson(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function toTitleCase(slug) {
    return slug
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();
}

// AI-powered event name generator
function generateEventTitle(filename, category) {
    const name = path.parse(filename).name.toLowerCase();

    // Define event patterns and their translations
    const eventPatterns = {
        // Corporate events
        'jabergamo': 'JA Finals 2025',
        'mday': 'Marconi\'s Day',
        'microsoft': 'Microsoft Event',
        'salone': 'Salone Aziendale',
        'techtint': 'Tech Tint Event',
        'aziendale': 'Corporate Event',
        'hq': 'Headquarters Session',
        'lhq': 'Low Quality Session',
        'cbg': 'Comic Book Galaxy Convention',
        'sgt': 'Salone del Giocattolo',
        'gardacon': 'GardaCon Convention',

        // Cosplay events and people
        'comofun': 'ComoFun Convention',
        'akiraflame': 'Akira Flame Cosplay Session',
        'brandy': 'Brandy Cosplay Portfolio',
        'celine': 'Celine Cosplay Session',
        'isa': 'Isa Character Study',
        'nibbo': 'Nibbo Cosplay Collection',
        'br4ndy': 'Brandy Cosplay Series',
        'cos': 'Cosplay Photography'
    };

    // Extract date if present (YYYYMMDD format)
    const dateMatch = name.match(/^(\d{4})(\d{2})(\d{2})/);
    let dateStr = '';
    if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
            dateStr = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    // Extract time if present (HHMMSS format)
    const timeMatch = name.match(/(\d{2})(\d{2})(\d{2})/);
    let timeStr = '';
    if (timeMatch && !dateStr) { // Only if not already part of date
        const [, hour, minute] = timeMatch;
        timeStr = `${hour}:${minute}`;
    }

    // Find event keywords in filename - prioritize more specific patterns
    const foundEvents = [];
    const sortedPatterns = Object.keys(eventPatterns).sort((a, b) => b.length - a.length); // Longer patterns first

    for (const pattern of sortedPatterns) {
        if (name.includes(pattern)) {
            foundEvents.push(eventPatterns[pattern]);
            break; // Take the first (most specific) match
        }
    }

    // Generate title based on found patterns
    let title = '';

    if (foundEvents.length > 0) {
        // Use the most specific event name found
        title = foundEvents[0];

        // Add date if available
        if (dateStr) {
            title += ` - ${dateStr}`;
        }

        // Add time if available and no date
        if (timeStr && !dateStr) {
            title += ` at ${timeStr}`;
        }

        // Add sequence number if present (but not if it's a year that's already in the title)
        const seqMatch = name.match(/-(\d+)$/);
        if (seqMatch) {
            const seqNum = seqMatch[1];
            // Don't add year numbers if they're already part of the event name
            if (!(seqNum.length === 4 && title.includes(seqNum))) {
                title += ` ${seqNum}`;
            }
        }

    } else {
        // Fallback to smart title casing with some improvements
        let smartName = name
            .replace(/^(\d{8})-(\d{6})-/, '') // Remove date-time prefix
            .replace(/-lhq|-hq|-lhq$|-hq$/, '') // Remove quality suffixes
            .replace(/-(\d{4})$/, '') // Remove year suffix
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase())
            .trim();

        // For cosplay, try to extract meaningful parts
        if (category === 'cosplay' && smartName) {
            const parts = smartName.split(' ');
            if (parts.length >= 2) {
                // Look for convention names or person names
                const conventionMatch = parts.find(part => part.match(/con|galaxy|salone/i));
                if (conventionMatch) {
                    smartName = `${conventionMatch} Convention - ${parts.slice(1).join(' ')}`;
                } else {
                    // Assume first part is person/cosplayer name
                    smartName = `${parts[0]} Cosplay - ${parts.slice(1).join(' ')}`;
                }
            }
        }

        if (smartName) {
            title = smartName;
            if (dateStr) {
                title = `${smartName} - ${dateStr}`;
            }
        } else {
            // Ultimate fallback
            title = toTitleCase(name);
        }
    }

    return title || 'Untitled Event';
}

function readDirSafe(dirPath) {
    try {
        return fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (error) {
        return [];
    }
}

function buildManifestForCategory(category) {
    const categoryDir = path.join(IMAGES_DIR, category);
    const fullDir = path.join(categoryDir, 'full');
    const thumbDir = path.join(categoryDir, 'thumbnails');

    const fullImages = readDirSafe(fullDir)
        .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()));

    const thumbImages = readDirSafe(thumbDir)
        .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()));

    const thumbMap = new Map(
        thumbImages.map((entry) => [path.parse(entry.name).name.toLowerCase(), entry.name])
    );

    const images = fullImages.map((entry) => {
        const { name, ext } = path.parse(entry.name);
        const thumbnailName = thumbMap.get(name.toLowerCase());

        return {
            slug: name,
            title: generateEventTitle(entry.name, category),
            description: '',
            thumbnail: thumbnailName
                ? `/images/${category}/thumbnails/${thumbnailName}`
                : `/images/${category}/full/${entry.name}`,
            full: `/images/${category}/full/${entry.name}`
        };
    });

    return {
        category,
        generatedAt: new Date().toISOString(),
        count: images.length,
        images
    };
}

function writeManifest(category, manifest) {
    const manifestPath = path.join(IMAGES_DIR, category, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    return manifestPath;
}

function buildFeaturedSetManifest(category) {
    const featuredDir = path.join(IMAGES_DIR, category, 'featured');
    const setEntries = readDirSafe(featuredDir).filter((entry) => entry.isDirectory());

    const sets = setEntries.map((entry) => {
        const setSlug = entry.name;
        const setDir = path.join(featuredDir, setSlug);
        const fullDir = path.join(setDir, 'full');
        const thumbDir = path.join(setDir, 'thumbnails');

        const fullImages = readDirSafe(fullDir)
            .filter((file) => file.isFile() && IMAGE_EXTENSIONS.has(path.extname(file.name).toLowerCase()));

        if (!fullImages.length) {
            return null;
        }

        let newestTimestamp = 0;
        fullImages.forEach((file) => {
            try {
                const stats = fs.statSync(path.join(fullDir, file.name));
                newestTimestamp = Math.max(newestTimestamp, stats.mtimeMs, stats.ctimeMs);
            } catch (error) {
                // ignore stat errors and continue
            }
        });

        const thumbImages = readDirSafe(thumbDir)
            .filter((file) => file.isFile() && IMAGE_EXTENSIONS.has(path.extname(file.name).toLowerCase()));

        const thumbMap = new Map(
            thumbImages.map((file) => [path.parse(file.name).name.toLowerCase(), file.name])
        );

        const metaPath = path.join(setDir, 'meta.json');
        const meta = safeReadJson(metaPath) || {};

        const metaDate = meta.date ? new Date(meta.date) : null;
        const resolvedDate = metaDate && !Number.isNaN(metaDate.getTime())
            ? metaDate.toISOString()
            : (newestTimestamp ? new Date(newestTimestamp).toISOString() : null);

        const images = fullImages
            .map((file) => {
                const parsed = path.parse(file.name);
                const slug = parsed.name;
                const thumbnailName = thumbMap.get(slug.toLowerCase()) || file.name;

                return {
                    slug,
                    title: generateEventTitle(file.name, category), // Always use AI-generated event names
                    thumbnail: path.join('/images', category, 'featured', setSlug, 'thumbnails', thumbnailName).replace(/\\/g, '/'),
                    full: path.join('/images', category, 'featured', setSlug, 'full', file.name).replace(/\\/g, '/')
                };
            })
            .sort((a, b) => a.slug.localeCompare(b.slug));

        const coverImage = images[0] || null;

        return {
            slug: setSlug,
            title: meta.title || generateEventTitle(setSlug, category),
            description: meta.description || '',
            category: meta.category || '',
            date: resolvedDate,
            count: images.length,
            coverImage,
            images
        };
    }).filter(Boolean);

    return {
        category,
        generatedAt: new Date().toISOString(),
        count: sets.length,
        sets
    };
}

function writeFeaturedManifest(category, manifest) {
    const manifestDir = path.join(IMAGES_DIR, category, 'featured');
    if (!fs.existsSync(manifestDir)) {
        fs.mkdirSync(manifestDir, { recursive: true });
    }

    const manifestPath = path.join(manifestDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    return manifestPath;
}

function main() {
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error('Images directory not found:', IMAGES_DIR);
        process.exit(1);
    }

    const categories = readDirSafe(IMAGES_DIR)
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

    if (!categories.length) {
        console.warn('No gallery categories found in', IMAGES_DIR);
        return;
    }

    categories.forEach((category) => {
        const manifest = buildManifestForCategory(category);
        const manifestPath = writeManifest(category, manifest);
        console.log(`✓ Generated ${manifest.count} entries for ${category} → ${path.relative(ROOT, manifestPath)}`);

        const featuredManifest = buildFeaturedSetManifest(category);
        const featuredPath = writeFeaturedManifest(category, featuredManifest);
        console.log(`✓ Generated ${featuredManifest.count} featured sets for ${category} → ${path.relative(ROOT, featuredPath)}`);
    });
}

main();
