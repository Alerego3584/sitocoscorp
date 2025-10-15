const COSPLAY_MANIFEST_URL = '/images/cosplay/manifest.json';
const COSPLAY_FEATURED_MANIFEST_URL = '/images/cosplay/featured/manifest.json';
const FALLBACK_COSPLAY_IMAGES = [
    {
        title: 'Chromatic Pulse / Neon District',
        description: 'Night shoot with vibrant LED backdrops and reflective surfaces.',
        thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
        full: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1800&q=80'
    },
    {
        title: 'Galactic Vanguard / Skyline Ops',
        description: 'High-rise takeover with smoked gels and starfield projections.',
        thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80',
        full: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=1800&q=80'
    },
    {
        title: 'Celestial Oracle / Luminous Grove',
        description: 'Golden-hour portraits with hand-made armor and fiber optics.',
        thumbnail: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80',
        full: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1800&q=80'
    },
    {
        title: 'Voltage Valkyrie / Thunder Run',
        description: 'Dynamic action frames captured at 1/2000s with cinematic lighting.',
        thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
        full: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1800&q=80'
    }
];

function applyFigureOrientation(figure, imageEl, hint) {
    if (!figure || !imageEl) return;

    const resolveOrientation = window.resolveImageOrientation
        || ((width, height) => (width >= height ? 'landscape' : 'portrait'));
    const ratioMap = window.__ALEREGO_ORIENTATION_RATIOS__
        || { landscape: '16 / 10', portrait: '3 / 4', square: '1 / 1' };

    const orientation = hint || resolveOrientation(imageEl.naturalWidth, imageEl.naturalHeight);
    const ratio = ratioMap[orientation] || ratioMap.landscape;

    figure.dataset.orientation = orientation;
    figure.style.aspectRatio = ratio;

    imageEl.dataset.orientation = orientation;
    imageEl.style.aspectRatio = ratio;
    imageEl.style.width = '100%';
    imageEl.style.height = '100%';
}

async function fetchCosplayManifest() {
    try {
        const response = await fetch(COSPLAY_MANIFEST_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load ${COSPLAY_MANIFEST_URL}`);
        }

        const manifest = await response.json();
        return Array.isArray(manifest?.images) ? manifest.images : [];
    } catch (error) {
        console.warn('Cosplay gallery manifest unavailable, falling back to curated set.', error);
        return [];
    }
}

async function hydrateCosplayGallery() {
    const container = document.querySelector('#gallery');
    if (!container) return;

    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-14 text-center text-sm text-white/70">
            <span class="inline-flex animate-pulse items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Loading gallery</span>
            <p class="max-w-md text-base text-white/70">Preparing the latest cosplay drops straight from <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">images/cosplay/</code>.</p>
        </div>
    `;

    const manifestImages = await fetchCosplayManifest();
    const galleryImages = manifestImages.length ? manifestImages : FALLBACK_COSPLAY_IMAGES;

    initGallery(galleryImages, {
        container,
        emptyPrompt: 'run generate-gallery-manifests.js'
    });
}

hydrateCosplayGallery();

const FALLBACK_COSPLAY_FEATURED_SETS = [
    {
        slug: 'neon-dreams',
        title: 'Neon Dreams Collection',
        description: 'Cyberpunk cosplay series',
        coverImage: {
            thumbnail: '/images/cosplay/thumbnails/akiraflame-LHQ-03.jpg',
            full: '/images/cosplay/full/akiraflame-LHQ-03.jpg'
        }
    },
    {
        slug: 'convention-chronicles',
        title: 'Convention Chronicles',
        description: 'Best moments from CBG25',
        coverImage: {
            thumbnail: '/images/cosplay/thumbnails/CBG25-brandy1-LHQ-01.jpg',
            full: '/images/cosplay/full/CBG25-brandy1-LHQ-01.jpg'
        }
    }
];

async function fetchCosplayFeaturedSets() {
    try {
        const response = await fetch(COSPLAY_FEATURED_MANIFEST_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load ${COSPLAY_FEATURED_MANIFEST_URL}`);
        }

        const manifest = await response.json();
        return Array.isArray(manifest?.sets) ? manifest.sets : [];
    } catch (error) {
        console.warn('Cosplay featured manifest unavailable, falling back to defaults.', error);
        return [];
    }
}

async function initCosplayFeaturedSets() {
    const container = document.querySelector('#cosplay-featured-sets');
    if (!container) {
        console.error('Featured sets container not found!');
        return;
    }

    console.log('Initializing cosplay featured sets...');

    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-14 text-center text-sm text-white/70">
            <span class="inline-flex animate-pulse items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Loading featured sets</span>
            <p class="max-w-md text-base text-white/70">Gathering hero collections from <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">images/cosplay/featured/</code>.</p>
        </div>
    `;

    const manifestSets = await fetchCosplayFeaturedSets();
    const featuredSets = manifestSets.length ? manifestSets : FALLBACK_COSPLAY_FEATURED_SETS;

    if (!featuredSets.length) {
        container.innerHTML = `
            <div class="col-span-full rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-16 text-center text-sm text-white/70">
                <p class="text-base font-semibold text-white">No featured sets yet</p>
                <p>Add folders under <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">images/cosplay/featured/</code> and rerun <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">node scripts/generate-gallery-manifests.js</code>.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    console.log('Featured cosplay sets loaded:', featuredSets.map(s => ({ slug: s.slug, title: s.title })));

    featuredSets.forEach((set) => {
        const figure = document.createElement('figure');
        figure.setAttribute('role', 'button');
        figure.setAttribute('tabindex', '0');
        figure.setAttribute('aria-label', `${set.title || 'Featured set'} — open gallery`);

        const img = document.createElement('img');
        img.src = set.coverImage?.thumbnail || set.coverImage?.full || FALLBACK_COSPLAY_FEATURED_SETS[0]?.coverImage?.thumbnail;
        img.alt = set.title || 'Featured set';
        img.loading = 'lazy';

        const ratioMap = window.__ALEREGO_ORIENTATION_RATIOS__
            || { landscape: '16 / 10', portrait: '3 / 4', square: '1 / 1' };
        const defaultRatio = ratioMap.landscape || '16 / 10';
        figure.style.aspectRatio = defaultRatio;
        img.style.aspectRatio = defaultRatio;

        const orientationHint = (set.coverImage?.orientation || set.orientation || '').toString().toLowerCase();
        const hydrateOrientation = () => applyFigureOrientation(figure, img, orientationHint);

        if (img.complete && img.naturalWidth) {
            hydrateOrientation();
        } else {
            img.addEventListener('load', hydrateOrientation, { once: true });
            img.addEventListener('error', hydrateOrientation, { once: true });
        }

        const caption = document.createElement('figcaption');
        caption.innerHTML = `
            <h3 class="text-lg font-semibold text-white mb-1">${set.title || 'Untitled set'}</h3>
            ${set.description ? `<p class="text-sm text-white/80">${set.description}</p>` : ''}
        `;

        figure.appendChild(img);
        figure.appendChild(caption);

        // Use the actual set slug, no fallback
        if (!set.slug) {
            console.warn('Featured set missing slug:', set);
            return;
        }

        const targetUrl = buildSetGalleryUrl(set.slug, 'cosplay');

        console.log(`Building link for "${set.title}":`, {
            slug: set.slug,
            url: targetUrl
        });

        figure.dataset.href = targetUrl;
        figure.dataset.setSlug = set.slug;

        figure.addEventListener('click', (e) => {
            console.log('Featured set clicked:', {
                slug: set.slug,
                title: set.title,
                targetUrl,
                clickTarget: e.target.tagName,
                currentLocation: window.location.href
            });
            console.log('Navigating to:', targetUrl);
            
            // Use location.assign to preserve query parameters
            window.location.assign(targetUrl);
            
            console.log('Navigation initiated');
        });

        figure.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                console.log('Featured set keypressed:', set.slug);
                window.location.href = targetUrl;
            }
        });

        container.appendChild(figure);
    });
}

// Initialize featured sets after DOM loads
document.addEventListener('DOMContentLoaded', initCosplayFeaturedSets);

function buildSetGalleryUrl(slug, type) {
    if (!slug) {
        console.error('buildSetGalleryUrl called with empty slug');
        return '/set-gallery';
    }
    
    const encodedSlug = encodeURIComponent(slug);
    const encodedType = encodeURIComponent(type || 'cosplay');
    const queryString = `?set=${encodedSlug}&type=${encodedType}`;
    
    // Use full URL with origin, no .html extension for clean URLs
    const fullUrl = `${window.location.origin}/set-gallery${queryString}`;
    
    console.log('Built URL:', { slug, type, encodedSlug, queryString, fullUrl });
    
    return fullUrl;
}
