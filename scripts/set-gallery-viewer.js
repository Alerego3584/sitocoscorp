const ORIENTATION_RATIOS = {
    landscape: '16 / 10',
    portrait: '3 / 4',
    square: '1 / 1'
};

function resolveOrientationFromDimensions(width, height, fallback = 'landscape') {
    if (!width || !height) {
        return fallback;
    }

    const delta = Math.abs(width - height);
    const maxSide = Math.max(width, height);

    if (maxSide && delta / maxSide < 0.08) {
        return 'square';
    }

    return width >= height ? 'landscape' : 'portrait';
}

// Set Gallery Viewer - Handles paginated gallery views for featured sets/events
class SetGalleryViewer {
    constructor() {
        this.images = [];
        this.currentPage = 1;
        this.imagesPerPage = 8;
        this.currentImageIndex = 0;
        this.setData = null;
        this.referrerType = null;
        this.FALLBACK_SETS = this.buildFallbackSets();
        this.orientationRatios = ORIENTATION_RATIOS;
        
        this.init();
    }

    init() {
        this.loadSetFromURL();
        this.setupEventListeners();
    }

    applyBackgroundGradient() {
        const gradientDiv = document.querySelector('.fixed.inset-0.-z-10.bg-gradient-to-br');
        if (!gradientDiv) return;

        if (this.referrerType === 'corporate') {
            // Corporate: sky blue gradient
            gradientDiv.className = 'fixed inset-0 -z-10 bg-gradient-to-br from-slate-900 via-sky-900 to-indigo-900';
        } else {
            // Cosplay: fuchsia/purple gradient (default)
            gradientDiv.className = 'fixed inset-0 -z-10 bg-gradient-to-br from-purple-600 via-fuchsia-500 to-orange-500';
        }
    }

    loadSetFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const setId = urlParams.get('set');
        const type = urlParams.get('type') || 'cosplay';

        this.referrerType = type;
        this.applyBackgroundGradient();
        this.loadSetData(setId, type);
    }

    async loadSetData(setId, type) {
        try {
            const manifestSets = await this.fetchFeaturedSets(type);
            const fallbackSets = this.FALLBACK_SETS[type] || [];
            const allSets = manifestSets.length ? manifestSets : fallbackSets;

            console.log('SET VIEWER DEBUG:', {
                requestedSlug: setId,
                type,
                totalSets: allSets.length,
                availableSlugs: allSets.map(s => s.slug || s.id)
            });

            if (!allSets.length) {
                this.showError('No featured sets available yet');
                return;
            }

            let set = setId ? allSets.find((s) => {
                const matches = (s.slug || s.id) === setId;
                console.log(`Comparing: "${s.slug || s.id}" === "${setId}" → ${matches}`);
                return matches;
            }) : null;

            if (!set) {
                console.warn(`Set not found for slug "${setId}", defaulting to first set`);
                const defaultSet = allSets[0];
                
                if (!defaultSet) {
                    this.showError('No sets available to display');
                    return;
                }
                
                const defaultSlug = defaultSet.slug || defaultSet.id;

                if (defaultSlug && setId !== defaultSlug) {
                    console.log(`Updating URL from "${setId}" to "${defaultSlug}"`);
                    this.updateUrlWithSet(defaultSlug, type);
                }

                set = defaultSet;
            } else {
                console.log(`✓ Found matching set:`, set.title);
            }

            if (!set) {
                this.showError('Failed to load gallery set');
                return;
            }

            this.setData = {
                slug: set.slug || set.id,
                title: set.title || 'Featured Collection',
                description: set.description || '',
                category: set.category || (type === 'cosplay' ? 'Cosplay Series' : 'Corporate Events')
            };

            this.images = Array.isArray(set.images) ? set.images : [];
            this.currentPage = 1;
            this.currentImageIndex = 0;
            this.updatePageInfo();
            this.renderPage();
            this.setupBackButton();
        } catch (error) {
            console.error('Error loading set data:', error);
            this.showError('Failed to load gallery set');
        }
    }

    buildFallbackSets() {
        return {
            cosplay: [
                {
                    slug: 'neon-dreams',
                    title: 'Neon Dreams Collection',
                    description: 'Cyberpunk cosplay series with LED lighting and futuristic aesthetics',
                    category: 'Cosplay Series',
                    images: [
                        { thumbnail: '/images/cosplay/thumbnails/akiraflame-LHQ-03.jpg', full: '/images/cosplay/full/akiraflame-LHQ-03.jpg', title: 'Cyberpunk Portrait 1' },
                        { thumbnail: '/images/cosplay/thumbnails/CBG25-brandy1-LHQ-01.jpg', full: '/images/cosplay/full/CBG25-brandy1-LHQ-01.jpg', title: 'Neon Glow Series' },
                        { thumbnail: '/images/cosplay/thumbnails/celine-isa-LHQ-03.jpg', full: '/images/cosplay/full/celine-isa-LHQ-03.jpg', title: 'LED Character Study' },
                        { thumbnail: '/images/cosplay/thumbnails/comofunII-LHQ-017.jpg', full: '/images/cosplay/full/comofunII-LHQ-017.jpg', title: 'Action Shot' }
                    ]
                },
                {
                    slug: 'convention-chronicles',
                    title: 'Convention Chronicles',
                    description: 'Best moments from CBG25 and other major conventions',
                    category: 'Event Coverage',
                    images: [
                        { thumbnail: '/images/cosplay/thumbnails/CBG25-brandy2-LHQ-19.jpg', full: '/images/cosplay/full/CBG25-brandy2-LHQ-19.jpg', title: 'CBG25 Highlight' },
                        { thumbnail: '/images/cosplay/thumbnails/CBG25-nibbo-LHQ-11.jpg', full: '/images/cosplay/full/CBG25-nibbo-LHQ-11.jpg', title: 'Character Showcase' },
                        { thumbnail: '/images/cosplay/thumbnails/gardaconII-LHQ-097.jpg', full: '/images/cosplay/full/gardaconII-LHQ-097.jpg', title: 'Gardacon Moment' },
                        { thumbnail: '/images/cosplay/thumbnails/SGT25-br4ndy.cos_-LHQ-02.jpg', full: '/images/cosplay/full/SGT25-br4ndy.cos_-LHQ-02.jpg', title: 'SGT25 Feature' }
                    ]
                }
            ],
            corporate: [
                {
                    slug: 'executive-summit',
                    title: 'Executive Summit 2024',
                    description: 'Leadership portraits, keynote speeches, and networking events',
                    category: 'Corporate Events',
                    images: [
                        { thumbnail: '/images/corporate/thumbnails/corporate-1005.jpg', full: '/images/corporate/full/corporate-1005.jpg', title: 'Executive Portrait' },
                        { thumbnail: '/images/corporate/thumbnails/corporate-1032.jpg', full: '/images/corporate/full/corporate-1032.jpg', title: 'Keynote Moment' },
                        { thumbnail: '/images/corporate/thumbnails/corporate-1035.jpg', full: '/images/corporate/full/corporate-1035.jpg', title: 'Panel Discussion' },
                        { thumbnail: '/images/corporate/thumbnails/corporate-1043.jpg', full: '/images/corporate/full/corporate-1043.jpg', title: 'Leadership Team' }
                    ]
                },
                {
                    slug: 'innovation-lab',
                    title: 'Innovation Lab Opening',
                    description: 'Grand opening event with product launches and demonstrations',
                    category: 'Product Launch',
                    images: [
                        { thumbnail: '/images/corporate/thumbnails/corporate-1032.jpg', full: '/images/corporate/full/corporate-1032.jpg', title: 'Lab Tour' },
                        { thumbnail: '/images/corporate/thumbnails/corporate-1035.jpg', full: '/images/corporate/full/corporate-1035.jpg', title: 'Product Demo' },
                        { thumbnail: '/images/corporate/thumbnails/corporate-1036.jpg', full: '/images/corporate/full/corporate-1036.jpg', title: 'Tech Showcase' },
                        { thumbnail: '/images/corporate/thumbnails/corporate-1049.jpg', full: '/images/corporate/full/corporate-1049.jpg', title: 'Innovation Awards' }
                    ]
                }
            ]
        };
    }

    async fetchFeaturedSets(type) {
        const url = type === 'corporate'
            ? '/images/corporate/featured/manifest.json'
            : '/images/cosplay/featured/manifest.json';

        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Failed to load ${url}`);
            }

            const manifest = await response.json();
            return Array.isArray(manifest?.sets) ? manifest.sets : [];
        } catch (error) {
            console.warn(`Featured manifest unavailable for ${type}, using fallback data.`, error);
            return [];
        }
    }

    updateUrlWithSet(slug, type) {
        if (!slug) return;

        try {
            const url = new URL(window.location.href);
            url.searchParams.set('set', slug);
            if (type) {
                url.searchParams.set('type', type);
            }
            window.history.replaceState({}, '', `${url.pathname}${url.search}`);
        } catch (error) {
            const encodedSlug = encodeURIComponent(slug);
            const encodedType = type ? `&type=${encodeURIComponent(type)}` : '';
            const query = `?set=${encodedSlug}${encodedType}`;
            const path = window.location.pathname || '/set-gallery.html';
            window.history.replaceState({}, '', `${path}${query}`);
        }
    }

    setupEventListeners() {
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        const lightboxClose = document.querySelector('[data-lightbox-close]');
        const lightboxPrev = document.querySelector('[data-lightbox-prev]');
        const lightboxNext = document.querySelector('[data-lightbox-next]');
        const lightbox = document.getElementById('lightbox');

        if (prevButton) {
            prevButton.addEventListener('click', () => this.previousPage());
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => this.nextPage());
        }

        if (lightboxClose) {
            lightboxClose.addEventListener('click', () => this.closeLightbox());
        }

        if (lightboxPrev) {
            lightboxPrev.addEventListener('click', () => this.previousImage());
        }

        if (lightboxNext) {
            lightboxNext.addEventListener('click', () => this.nextImage());
        }

        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    this.closeLightbox();
                }
            });
        }
    }

    applyOrientationStyles(figure, imageEl, hint) {
        if (!figure || !imageEl) return;

        const orientation = hint || resolveOrientationFromDimensions(imageEl.naturalWidth, imageEl.naturalHeight);
        const ratio = this.orientationRatios[orientation] || this.orientationRatios.landscape;

        figure.dataset.orientation = orientation;
        figure.style.aspectRatio = ratio;

        imageEl.dataset.orientation = orientation;
        imageEl.style.aspectRatio = ratio;
        imageEl.style.width = '100%';
        imageEl.style.height = '100%';
    }

    setupBackButton() {
        const backButton = document.getElementById('back-button');
        if (!backButton) return;

        backButton.onclick = () => {
            if (this.referrerType === 'cosplay') {
                window.location.href = '/cosplay/';
            } else if (this.referrerType === 'corporate') {
                window.location.href = '/corporate/';
            } else {
                window.location.href = '/';
            }
        };
    }

    updatePageInfo() {
        if (!this.setData) return;

        // Update page title and content
        document.getElementById('gallery-title').textContent = `${this.setData.title} · Alerego.dev`;
        document.getElementById('gallery-category').textContent = this.setData.category || 'Gallery Set';
        document.getElementById('gallery-main-title').textContent = this.setData.title;
        document.getElementById('gallery-description').textContent = this.setData.description;
        
        // Update pagination info
        const totalPages = Math.max(1, Math.ceil(this.images.length / this.imagesPerPage));
        document.getElementById('page-info').textContent = `Page ${Math.min(this.currentPage, totalPages)} of ${totalPages}`;
        document.getElementById('image-count').textContent = `${this.images.length} image${this.images.length === 1 ? '' : 's'}`;
        
        // Update pagination buttons
        document.getElementById('prev-page').disabled = this.currentPage === 1 || !this.images.length;
        document.getElementById('next-page').disabled = this.currentPage >= totalPages || !this.images.length;
    }

    renderPage() {
        const grid = document.getElementById('image-grid');

        if (!this.images.length) {
            grid.innerHTML = `
                <div class="col-span-full rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-16 text-center text-sm text-white/70">
                    <p class="text-base font-semibold text-white">No images in this set yet</p>
                    <p>Add matching files under the set directory and regenerate manifests.</p>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.imagesPerPage;
        const endIndex = Math.min(startIndex + this.imagesPerPage, this.images.length);
        const pageImages = this.images.slice(startIndex, endIndex);
        grid.innerHTML = '';
        
        pageImages.forEach((image, index) => {
            const globalIndex = startIndex + index;
            const figure = document.createElement('figure');
            figure.className = 'group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] shadow-xl shadow-black/40 transition-all duration-500 hover:-translate-y-2 hover:border-white/40 hover:shadow-2xl hover:shadow-purple-500/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50';
            figure.setAttribute('role', 'button');
            figure.setAttribute('tabindex', '0');

            const imageEl = document.createElement('img');
            imageEl.src = image.thumbnail || image.full;
            imageEl.alt = image.title || 'Gallery image';
            imageEl.loading = 'lazy';
            imageEl.className = 'h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105';

            const defaultRatio = this.orientationRatios.landscape;
            figure.style.aspectRatio = defaultRatio;
            imageEl.style.aspectRatio = defaultRatio;

            const orientationHint = (image.orientation || '').toString().toLowerCase();
            const applyOrientation = () => this.applyOrientationStyles(figure, imageEl, orientationHint);

            if (imageEl.complete && imageEl.naturalWidth) {
                applyOrientation();
            } else {
                imageEl.addEventListener('load', applyOrientation, { once: true });
                imageEl.addEventListener('error', applyOrientation, { once: true });
            }

            const caption = document.createElement('figcaption');
            caption.className = 'pointer-events-none absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent p-6';
            caption.innerHTML = `
                <h3 class="text-lg font-semibold text-white drop-shadow-lg">${image.title || 'Untitled image'}</h3>
            `;

            figure.addEventListener('click', () => this.openLightbox(globalIndex));
            figure.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.openLightbox(globalIndex);
                }
            });

            figure.appendChild(imageEl);
            figure.appendChild(caption);
            grid.appendChild(figure);
        });
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePageInfo();
            this.renderPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.images.length / this.imagesPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.updatePageInfo();
            this.renderPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    openLightbox(index) {
        this.currentImageIndex = index;
        const image = this.images[index];
        if (!image) return;
        const source = image.full || image.thumbnail;
        if (!source) return;
        
        const lightbox = document.getElementById('lightbox');
        const img = document.getElementById('lightbox-img');
        const caption = document.getElementById('caption');
        
    img.src = source;
    img.alt = image.title || 'Gallery image';
    caption.textContent = image.title || '';
        
        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('flex');
        lightbox.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }

    previousImage() {
        if (!this.images.length) return;
        if (this.currentImageIndex > 0) {
            this.openLightbox(this.currentImageIndex - 1);
        } else {
            this.openLightbox(this.images.length - 1);
        }
    }

    nextImage() {
        if (!this.images.length) return;
        if (this.currentImageIndex < this.images.length - 1) {
            this.openLightbox(this.currentImageIndex + 1);
        } else {
            this.openLightbox(0);
        }
    }

    handleKeyPress(e) {
        const lightbox = document.getElementById('lightbox');
        const isLightboxVisible = !lightbox.classList.contains('hidden');
        
        if (isLightboxVisible) {
            switch (e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.previousImage();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    break;
            }
        } else {
            switch (e.key) {
                case 'ArrowLeft':
                    this.previousPage();
                    break;
                case 'ArrowRight':
                    this.nextPage();
                    break;
            }
        }
    }

    showError(message) {
        const grid = document.getElementById('image-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center gap-4 rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-20 text-center">
                    <p class="text-xl font-semibold text-red-400">${message}</p>
                    <button onclick="history.back()" class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-slate-950">
                        Go Back
                    </button>
                </div>
            `;
        }

        const titleEl = document.getElementById('gallery-main-title');
        const descEl = document.getElementById('gallery-description');
        const categoryEl = document.getElementById('gallery-category');
        const pageInfoEl = document.getElementById('page-info');
        const imageCountEl = document.getElementById('image-count');
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');

        if (titleEl) {
            titleEl.textContent = message;
        }

        if (descEl) {
            descEl.textContent = 'Select a featured collection from the cosplay or corporate page to continue.';
        }

        if (categoryEl) {
            categoryEl.textContent = this.referrerType === 'corporate' ? 'Corporate feature' : 'Cosplay feature';
        }

        if (pageInfoEl) {
            pageInfoEl.textContent = 'Page 0 of 0';
        }

        if (imageCountEl) {
            imageCountEl.textContent = '0 images';
        }

        if (prevButton) {
            prevButton.disabled = true;
        }

        if (nextButton) {
            nextButton.disabled = true;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SetGalleryViewer();
});