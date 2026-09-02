const API_SETS_URL = '/api/public/sets';
const CATEGORY = 'cosplay';

function toTitleCase(value) {
    return (value || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
        .trim();
}

async function fetchCosplaySets() {
    try {
        const response = await fetch(API_SETS_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error("Failed to load sets from API");
        }

        const data = await response.json();
        const sets = Array.isArray(data?.sets) ? data.sets : [];
        return sets.filter(s => s.type === CATEGORY).sort((a,b) => (a.order||0) - (b.order||0));
    } catch (error) {
        return [];
    }
}

function buildGalleryItemsFromSets(sets) {
    return sets.map(set => {
        if (!set.images || set.images.length === 0) return null;
        
        let coverImageFull = "/media/" + set.images[0];
        let coverImageThumb = coverImageFull.replace('/full/', '/thumbnails/');

        return {
            title: set.title || toTitleCase(set.slug),
            description: set.description || 'A curated collection.',
            thumbnail: coverImageThumb,
            full: coverImageFull,
            href: "/set-gallery?set=" + encodeURIComponent(set.slug) + "&type=cosplay",
            category: CATEGORY,
            slug: set.slug,
            label: 'Cosplay',
            type: CATEGORY
        };
    }).filter(Boolean);
}

function extractFeaturedImagesFromSets(sets) {
    const featuredList = [];
    sets.forEach(set => {
        const starred = Array.isArray(set.featuredImages) && set.featuredImages.length
            ? set.featuredImages
            : [];
        const paths = starred.length ? starred : (Array.isArray(set.images) ? set.images : []);
        paths.forEach(imgPath => {
            const fullUrl = "/media/" + imgPath;
            const thumbUrl = fullUrl.replace('/full/', '/thumbnails/');
            featuredList.push({
                title: set.title || 'Featured Photo',
                description: set.category || 'Cosplay Highlights',
                thumbnail: thumbUrl,
                full: fullUrl,
                label: 'Featured Photo',
                type: CATEGORY
            });
        });
    });
    return featuredList;
}

async function hydrateCosplayGallery() {
    const setsContainer = document.querySelector('#cosplay-featured-sets');
    const highlightsContainer = document.querySelector('#gallery');

    if (!setsContainer || !highlightsContainer) return;

    highlightsContainer.innerHTML = `
        <div class="gallery-loading">
            <strong data-i18n="gallery.loadingHighlights"></strong>
            <p data-i18n="gallery.loadingHighlightsCosplay"></p>
        </div>
    `;
    window.AleregoI18n?.apply(highlightsContainer);

    setsContainer.innerHTML = `
        <div class="gallery-loading">
            <p data-i18n="gallery.loadingSets"></p>
        </div>
    `;
    window.AleregoI18n?.apply(setsContainer);

    const rawSets = await fetchCosplaySets();

    const setGalleryItems = buildGalleryItemsFromSets(rawSets);
    const standaloneFeaturedItems = extractFeaturedImagesFromSets(rawSets);

    initGallery(standaloneFeaturedItems, {
        container: highlightsContainer,
        emptyTitleKey: "gallery.emptyPhotosTitle",
        emptyBodyKey: "gallery.emptyPhotosBody"
    });

    initGallery(setGalleryItems, {
        container: setsContainer,
        emptyTitleKey: "gallery.emptySetsTitle",
        emptyBodyKey: "gallery.emptySetsBody"
    });
}

hydrateCosplayGallery();
