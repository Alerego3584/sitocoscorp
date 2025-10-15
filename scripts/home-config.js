const HOME_MANIFEST_URL = '/images/home/manifest.json';
const COSPLAY_FEATURED_MANIFEST_URL = '/images/cosplay/featured/manifest.json';
const CORPORATE_FEATURED_MANIFEST_URL = '/images/corporate/featured/manifest.json';
const MAX_HOME_SHOWCASE_ITEMS = 6;


function toTitleCase(value) {
    return (value || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();
}

function ensureIsoDate(value) {
    if (!value) return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString();
}

function formatDateLabel(isoDate) {
    if (!isoDate) return '';

    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
    });
}

async function fetchHomeManifest() {
    try {
        const response = await fetch(HOME_MANIFEST_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load ${HOME_MANIFEST_URL}`);
        }

        const manifest = await response.json();
        return Array.isArray(manifest?.images) ? manifest.images : [];
    } catch (error) {
        console.warn('Home gallery manifest unavailable, falling back to curated set.', error);
        return [];
    }
}

async function fetchFeaturedManifest(url, type) {
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load ${url}`);
        }

        const manifest = await response.json();
        const sets = Array.isArray(manifest?.sets) ? manifest.sets : [];
        return sets.map((set) => ({ ...set, __type: type }));
    } catch (error) {
        console.warn(`Home featured manifest unavailable for ${type}.`, error);
        return [];
    }
}

function normaliseFeaturedSets(sets) {
    return sets
        .filter((set) => set && (set.coverImage?.thumbnail || set.coverImage?.full))
        .map((set) => {
            const isoDate = ensureIsoDate(set.date);
            const timestamp = isoDate ? new Date(isoDate).getTime() : 0;
            const type = set.__type || set.type || 'cosplay';

            return {
                slug: set.slug,
                title: set.title,
                description: set.description,
                category: set.category,
                coverImage: set.coverImage,
                isoDate,
                timestamp,
                type
            };
        });
}

function selectFeaturedSetsForHome(cosplaySets, corporateSets) {
    const cosplay = normaliseFeaturedSets(cosplaySets);
    const corporate = normaliseFeaturedSets(corporateSets);

    if (!cosplay.length && !corporate.length) {
        return [];
    }

    const limit = MAX_HOME_SHOWCASE_ITEMS;
    const halfLimit = Math.max(1, Math.floor(limit / 2));

    const sortByRecency = (a, b) => {
        if (b.timestamp !== a.timestamp) {
            return b.timestamp - a.timestamp;
        }

        const leftTitle = a.title || a.slug || '';
        const rightTitle = b.title || b.slug || '';
        return leftTitle.localeCompare(rightTitle);
    };

    const topCosplay = [...cosplay].sort(sortByRecency).slice(0, halfLimit);
    const topCorporate = [...corporate].sort(sortByRecency).slice(0, halfLimit);

    const selection = [...topCosplay, ...topCorporate];
    const seen = new Set(selection.map((set) => `${set.type}::${set.slug}`));

    const refillPool = [...cosplay, ...corporate].sort(sortByRecency);
    for (const candidate of refillPool) {
        if (selection.length >= limit) break;
        const key = `${candidate.type}::${candidate.slug}`;
        if (seen.has(key)) continue;
        selection.push(candidate);
        seen.add(key);
    }

    return selection.sort(sortByRecency).slice(0, limit);
}

function buildGalleryItemsFromSets(sets) {
    return sets.map((set) => {
        const thumbnail = set.coverImage?.thumbnail || set.coverImage?.full;
        const full = set.coverImage?.full || set.coverImage?.thumbnail;

        if (!thumbnail || !full) {
            return null;
        }

        const prettyCategory = set.category?.trim() || (set.type === 'corporate' ? 'Corporate' : 'Cosplay');
        const dateLabel = formatDateLabel(set.isoDate);
        const descriptor = [prettyCategory, dateLabel].filter(Boolean).join(' · ');
        const label = set.type === 'corporate' ? 'Corporate event' : 'Cosplay set';

        return {
            title: set.title || toTitleCase(set.slug),
            description: descriptor,
            thumbnail,
            full,
            href: buildSetGalleryUrl(set.slug, set.type),
            label,
            date: set.isoDate,
            type: set.type || 'cosplay'
        };
    }).filter(Boolean);
}

async function loadHomeGalleryItems() {
    const [cosplaySets, corporateSets] = await Promise.all([
        fetchFeaturedManifest(COSPLAY_FEATURED_MANIFEST_URL, 'cosplay'),
        fetchFeaturedManifest(CORPORATE_FEATURED_MANIFEST_URL, 'corporate')
    ]);

    const featuredItems = buildGalleryItemsFromSets(
        selectFeaturedSetsForHome(cosplaySets, corporateSets)
    );

    if (featuredItems.length) {
        return featuredItems;
    }

    const manifestImages = await fetchHomeManifest();
    if (manifestImages.length) {
        return manifestImages;
    }

    return FALLBACK_HOME_IMAGES;
}

function buildSetGalleryUrl(slug, type) {
    if (!slug) {
        return '/set-gallery';
    }

    const encodedSlug = encodeURIComponent(slug);
    const encodedType = encodeURIComponent(type || 'cosplay');
    return `${window.location.origin}/set-gallery?set=${encodedSlug}&type=${encodedType}`;
}

async function hydrateHomeGallery() {
    const container = document.querySelector('#home-gallery');
    if (!container) return;

    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-14 text-center text-sm text-white/70">
            <span class="inline-flex animate-pulse items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Curating featured sets</span>
            <p class="max-w-md text-base text-white/70">Pulling a blend of cosplay and corporate spotlights. Update your folders under <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">images/*/featured/</code> to refresh.</p>
        </div>
    `;

    const galleryImages = await loadHomeGalleryItems();

    initGallery(galleryImages, {
        container,
        emptyPrompt: 'run generate-gallery-manifests.js'
    });
}

hydrateHomeGallery();
