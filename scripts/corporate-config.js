// Corporate Portfolio Images Configuration
// To add/edit images, simply modify this array

const CORPORATE_MANIFEST_URL = '/images/corporate/manifest.json';
const CORPORATE_FEATURED_MANIFEST_URL = '/images/corporate/featured/manifest.json';
const FALLBACK_CORPORATE_IMAGES = [
    {
        title: 'Summit Keynote / Skyline Center',
        description: 'Stage design and speaker coverage for the annual product launch.',
        thumbnail: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=720&q=80',
        full: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1920&q=80'
    },
    {
        title: 'Executive Portraits / Northwind HQ',
        description: 'Natural-light portrait system designed for leadership brand refresh.',
        thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=720&q=80',
        full: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1920&q=80'
    },
    {
        title: 'Innovation Roundtable / Axis Labs',
        description: 'Documentary style coverage with ambient lighting and candid frames.',
        thumbnail: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=720&q=80',
        full: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1920&q=80'
    },
    {
        title: 'Brand Lab / Immersion Workshop',
        description: 'Dynamic detail shots and testimonials from a live design sprint.',
        thumbnail: 'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=720&q=80',
        full: 'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1920&q=80'
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

async function fetchCorporateManifest() {
    try {
        const response = await fetch(CORPORATE_MANIFEST_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load ${CORPORATE_MANIFEST_URL}`);
        }

        const manifest = await response.json();
        return Array.isArray(manifest?.images) ? manifest.images : [];
    } catch (error) {
        console.warn('Corporate gallery manifest unavailable, falling back to curated set.', error);
        return [];
    }
}

async function hydrateCorporateGallery() {
    const container = document.querySelector('#gallery');
    if (!container) return;

    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-14 text-center text-sm text-white/70">
            <span class="inline-flex animate-pulse items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Loading portfolio</span>
            <p class="max-w-md text-base text-white/70">Syncing the most recent corporate campaigns from <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">images/corporate/</code>.</p>
        </div>
    `;

    const manifestImages = await fetchCorporateManifest();
    const galleryImages = manifestImages.length ? manifestImages : FALLBACK_CORPORATE_IMAGES;
    
    // Add type property to all images for proper styling
    const typedGalleryImages = galleryImages.map(image => ({
        ...image,
        type: 'corporate'
    }));

    initGallery(typedGalleryImages, {
        container,
        emptyPrompt: 'run generate-gallery-manifests.js'
    });
}

hydrateCorporateGallery();

const FALLBACK_CORPORATE_FEATURED_EVENTS = [
    {
        slug: 'executive-summit',
        title: 'Executive Summit 2024',
        description: 'Leadership portraits & keynotes',
        coverImage: {
            thumbnail: '/images/corporate/thumbnails/corporate-1005.jpg',
            full: '/images/corporate/full/corporate-1005.jpg'
        }
    },
    {
        slug: 'innovation-lab',
        title: 'Innovation Lab Opening',
        description: 'Corporate event coverage',
        coverImage: {
            thumbnail: '/images/corporate/thumbnails/corporate-1032.jpg',
            full: '/images/corporate/full/corporate-1032.jpg'
        }
    }
];

async function fetchCorporateFeaturedEvents() {
    try {
        const response = await fetch(CORPORATE_FEATURED_MANIFEST_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load ${CORPORATE_FEATURED_MANIFEST_URL}`);
        }

        const manifest = await response.json();
        return Array.isArray(manifest?.sets) ? manifest.sets : [];
    } catch (error) {
        console.warn('Corporate featured manifest unavailable, falling back to defaults.', error);
        return [];
    }
}

async function initCorporateFeaturedEvents() {
    const container = document.querySelector('#corporate-featured-events');
    if (!container) return;

    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-14 text-center text-sm text-white/70">
            <span class="inline-flex animate-pulse items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Loading featured events</span>
            <p class="max-w-md text-base text-white/70">Collecting signature events from <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">images/corporate/featured/</code>.</p>
        </div>
    `;

    const manifestEvents = await fetchCorporateFeaturedEvents();
    const featuredEvents = manifestEvents.length ? manifestEvents : FALLBACK_CORPORATE_FEATURED_EVENTS;

    if (!featuredEvents.length) {
        container.innerHTML = `
            <div class="col-span-full rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-16 text-center text-sm text-white/70">
                <p class="text-base font-semibold text-white">No featured events yet</p>
                <p>Add folders under <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">images/corporate/featured/</code> and rerun <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">node scripts/generate-gallery-manifests.js</code>.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    console.log('Featured corporate events loaded:', featuredEvents.map(e => ({ slug: e.slug, title: e.title })));

    featuredEvents.forEach((event) => {
        const figure = document.createElement('figure');
        figure.setAttribute('role', 'button');
        figure.setAttribute('tabindex', '0');
        figure.setAttribute('aria-label', `${event.title || 'Featured event'} — open gallery`);

        const img = document.createElement('img');
        img.src = event.coverImage?.thumbnail || event.coverImage?.full || FALLBACK_CORPORATE_FEATURED_EVENTS[0]?.coverImage?.thumbnail;
        img.alt = event.title || 'Featured event';
        img.loading = 'lazy';
        const ratioMap = window.__ALEREGO_ORIENTATION_RATIOS__
            || { landscape: '16 / 10', portrait: '3 / 4', square: '1 / 1' };
        const defaultRatio = ratioMap.landscape || '16 / 10';
        figure.style.aspectRatio = defaultRatio;
        img.style.aspectRatio = defaultRatio;
        
            const orientationHint = (event.coverImage?.orientation || event.orientation || '').toString().toLowerCase();
            const hydrateOrientation = () => applyFigureOrientation(figure, img, orientationHint);
        
            if (img.complete && img.naturalWidth) {
                hydrateOrientation();
            } else {
                img.addEventListener('load', hydrateOrientation, { once: true });
                img.addEventListener('error', hydrateOrientation, { once: true });
            }

        const caption = document.createElement('figcaption');
        caption.innerHTML = `
            <h3 class="text-lg font-semibold text-white mb-1">${event.title || 'Untitled event'}</h3>
            ${event.description ? `<p class="text-sm text-white/80">${event.description}</p>` : ''}
        `;

        figure.appendChild(img);
        figure.appendChild(caption);

        // Use the actual event slug, no fallback
        if (!event.slug) {
            console.warn('Featured event missing slug:', event);
            return;
        }

        const targetUrl = buildSetGalleryUrl(event.slug, 'corporate');

        figure.dataset.href = targetUrl;
        figure.dataset.setSlug = event.slug;

        figure.addEventListener('click', (e) => {
            console.log('Featured event clicked:', {
                slug: event.slug,
                title: event.title,
                targetUrl,
                clickTarget: e.target.tagName
            });
            window.location.href = targetUrl;
        });

        figure.addEventListener('keypress', (eventObj) => {
            if (eventObj.key === 'Enter' || eventObj.key === ' ') {
                eventObj.preventDefault();
                console.log('Featured event keypressed:', event.slug);
                window.location.href = targetUrl;
            }
        });

        container.appendChild(figure);
    });
}

// Initialize featured events after DOM loads
document.addEventListener('DOMContentLoaded', initCorporateFeaturedEvents);

function buildSetGalleryUrl(slug, type) {
    if (!slug) {
        console.error('buildSetGalleryUrl called with empty slug');
        return '/set-gallery';
    }
    
    const encodedSlug = encodeURIComponent(slug);
    const encodedType = encodeURIComponent(type || 'corporate');
    const queryString = `?set=${encodedSlug}&type=${encodedType}`;
    
    // Use full URL with origin, no .html extension for clean URLs
    const fullUrl = `${window.location.origin}/set-gallery${queryString}`;
    
    console.log('Built URL:', { slug, type, encodedSlug, queryString, fullUrl });
    
    return fullUrl;
}
