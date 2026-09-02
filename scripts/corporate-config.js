const API_SETS_URL = '/api/public/sets';
const CATEGORY = 'corporate';

function toTitleCase(value) {
    return (value || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
        .trim();
}

async function fetchCorporateSets() {
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
            href: "/set-gallery/?set=" + encodeURIComponent(set.slug) + "&type=corporate",
            category: CATEGORY,
            slug: set.slug,
            label: 'Event Coverage',
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
                title: set.title || 'Featured Event Photo',
                description: set.category || 'Event Highlights',
                thumbnail: thumbUrl,
                full: fullUrl,
                label: 'Featured Event',
                type: CATEGORY
            });
        });
    });
    return featuredList;
}

async function hydrateCorporateGallery() {
    const setsContainer = document.querySelector('#corporate-featured-events');
    const highlightsContainer = document.querySelector('#gallery');

    if (!setsContainer || !highlightsContainer) return;

    highlightsContainer.innerHTML = `
        <div class="gallery-loading">
            <strong data-i18n="gallery.loadingHighlights"></strong>
            <p data-i18n="gallery.loadingHighlightsCorporate"></p>
        </div>
    `;
    window.AleregoI18n?.apply(highlightsContainer);

    setsContainer.innerHTML = `
        <div class="gallery-loading">
            <p data-i18n="gallery.loadingSets"></p>
        </div>
    `;
    window.AleregoI18n?.apply(setsContainer);

    const rawSets = await fetchCorporateSets();

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

hydrateCorporateGallery();
