const API_SETS_URL = '/api/public/sets';
const MAX_HOME_SHOWCASE_ITEMS = 12;
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
    const items = [];

    sets.forEach((set) => {
        const type = set.type === 'corporate' ? 'corporate' : 'cosplay';
        const paths = Array.isArray(set.featuredImages) && set.featuredImages.length
            ? set.featuredImages
            : (Array.isArray(set.images) ? set.images : []);

        paths.forEach((imgPath) => {
            const full = `/media/${imgPath}`;
            items.push({
                title: set.title || toTitleCase(set.slug),
                description: type === 'corporate' ? 'Corporate' : 'Cosplay',
                thumbnail: full.replace('/full/', '/thumbnails/'),
                full,
                label: type === 'corporate' ? 'Corporate' : 'Cosplay',
                type
            });
        });
    });

    return items;
}

function interleaveTypes(items) {
    const cosplay = items.filter((item) => item.type !== 'corporate');
    const corporate = items.filter((item) => item.type === 'corporate');
    const mixed = [];
    const max = Math.max(cosplay.length, corporate.length);
    for (let i = 0; i < max; i += 1) {
        if (cosplay[i]) mixed.push(cosplay[i]);
        if (corporate[i]) mixed.push(corporate[i]);
    }
    return mixed.slice(0, MAX_HOME_SHOWCASE_ITEMS);
}

async function loadHomeGalleryItems() {
    const allSets = await fetchFeaturedSets();
    const featuredItems = interleaveTypes(buildGalleryItemsFromSets(allSets));

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
        return '/set-gallery/';
    }

    const encodedSlug = encodeURIComponent(slug);
    const encodedType = encodeURIComponent(type || 'cosplay');
    return `/set-gallery/?set=${encodedSlug}&type=${encodedType}`;
}

async function hydrateHomeGallery() {
    const container = document.querySelector('#home-gallery');
    if (!container) return;

    container.innerHTML = `
        <div class="gallery-loading">
            <strong data-i18n="gallery.loadingPhotos">${window.AleregoI18n ? window.AleregoI18n.t("gallery.loadingPhotos") : "Loading photos"}</strong>
            <p data-i18n="gallery.loadingPhotosHint">${window.AleregoI18n ? window.AleregoI18n.t("gallery.loadingPhotosHint") : "Reading published sets."}</p>
        </div>
    `;

    const galleryImages = await loadHomeGalleryItems();

    initGallery(galleryImages, {
        container,
        emptyTitleKey: "gallery.emptyHomeTitle",
        emptyBodyKey: "gallery.emptyHomeBody"
    });
}

hydrateHomeGallery();
