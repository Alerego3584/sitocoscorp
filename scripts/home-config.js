const API_SETS_URL = '/api/public/sets';
const MAX_HOME_SHOWCASE_ITEMS = 6;
const FALLBACK_HOME_IMAGES = [];


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
    return []; // Disabilitato, diamo precedenza ai set dinamici
}

async function fetchFeaturedSets() {
    try {
        const response = await fetch(API_SETS_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load ${API_SETS_URL}`);
        }

        const data = await response.json();
        return Array.isArray(data?.sets) ? data.sets : [];
    } catch (error) {
        console.warn(`API unavailable.`, error);
        return [];
    }
}

function normaliseFeaturedSets(sets) {
    return sets
        .filter((set) => set && set.images && set.images.length > 0)
        .map((set) => {
            const firstImage = set.images[0];
            const imageUrl = `/media/${firstImage}`;
            const tUrl = imageUrl.replace('/full/', '/thumbnails/');
            
            const coverImage = { full: imageUrl, thumbnail: tUrl };
            
            // Ordiniamo per data finta usando l'order come fallback, o stamp timestamp
            const timestamp = Date.now() - ((set.order || 0) * 1000000); 

            return {
                slug: set.slug,
                title: set.title,
                description: set.description,
                category: set.type,
                coverImage: coverImage,
                isoDate: null,
                timestamp,
                type: set.type || 'cosplay'
            };
        });
}

function selectFeaturedSetsForHome(allSets) {
    const cosplaySets = allSets.filter(s => s.type === 'cosplay');
    const corporateSets = allSets.filter(s => s.type === 'corporate');
    
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
    const allSets = await fetchFeaturedSets();

    const featuredItems = buildGalleryItemsFromSets(
        selectFeaturedSetsForHome(allSets)
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
        <div class="col-span-full flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/[0.05] px-6 py-14 text-center text-sm text-white/70">
            <span class="inline-flex animate-pulse items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Curating featured sets</span>
            <p class="max-w-md text-base text-white/70">Pulling a blend of cosplay and corporate spotlights directly from the Cloudflare Database. Use the /admin panel to manage.</p>
        </div>
    `;

    const galleryImages = await loadHomeGalleryItems();

    initGallery(galleryImages, {
        container,
        emptyPrompt: 'run generate-gallery-manifests.js'
    });
}

hydrateHomeGallery();
