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
        console.warn('API unavailable, returning empty.', error);
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
            href: "/set-gallery?set=" + encodeURIComponent(set.slug) + "&type=corporate",
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
        if (set.featuredImages && Array.isArray(set.featuredImages)) {
            set.featuredImages.forEach(imgPath => {
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
        }
    });
    return featuredList;
}

async function hydrateCorporateGallery() {
    const setsContainer = document.querySelector('#corporate-featured-events');
    const highlightsContainer = document.querySelector('#gallery');

    if (!setsContainer || !highlightsContainer) return;

    highlightsContainer.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/[0.05] px-6 py-14 text-center text-sm text-white/70">
            <span class="inline-flex animate-pulse items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Loading highlights</span>
            <p class="max-w-md text-base text-white/70">Fetching starred event photos via Cloudflare KV index...</p>
        </div>
    `;

    setsContainer.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center gap-4 bg-slate-900/50 px-6 py-8 text-center text-sm text-slate-400 rounded-xl border border-white/5">
            Loading signature event collections...
        </div>
    `;

    const rawSets = await fetchCorporateSets();

    // Check if there is a custom hero image assigned in the admin for this category
    const heroSet = rawSets.find(s => s.categoryHeroImage);
    if (heroSet && heroSet.categoryHeroImage) {
        const heroImg = document.getElementById('category-hero-img');
        if (heroImg) {
            heroImg.src = "/media/" + heroSet.categoryHeroImage;
        }
    }

    const setGalleryItems = buildGalleryItemsFromSets(rawSets);
    const standaloneFeaturedItems = extractFeaturedImagesFromSets(rawSets);

    initGallery(standaloneFeaturedItems, {
        container: highlightsContainer,
        emptyPrompt: 'Star some photos in the /admin portal'
    });

    initGallery(setGalleryItems, {
        container: setsContainer,
        emptyPrompt: 'Create a new set via /admin and add photos'
    });
}

hydrateCorporateGallery();
