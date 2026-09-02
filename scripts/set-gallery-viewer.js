const ORIENTATION_RATIOS = {
    landscape: '16 / 10',
    portrait: '3 / 4',
    square: '1 / 1'
};

const ORIENTATION_RATIO_VALUES = {
    landscape: 16 / 10,
    portrait: 3 / 4,
    square: 1
};

function t(key, vars) {
    return window.AleregoI18n ? window.AleregoI18n.t(key, vars) : key;
}

function ratioToNumber(ratio) {
    if (typeof ratio === 'number' && Number.isFinite(ratio) && ratio > 0) {
        return ratio;
    }

    if (typeof ratio !== 'string') {
        return null;
    }

    const normalized = ratio.trim();
    if (!normalized) {
        return null;
    }

    if (normalized.includes('/')) {
        const [leftRaw, rightRaw] = normalized.split('/').map((part) => Number(part.trim()));
        if (Number.isFinite(leftRaw) && Number.isFinite(rightRaw) && rightRaw > 0) {
            return leftRaw / rightRaw;
        }
    }

    const numericValue = Number(normalized);
    if (Number.isFinite(numericValue) && numericValue > 0) {
        return numericValue;
    }

    return null;
}

function applyOrderedGridLayout(container, options = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        return;
    }

    if (window.AleregoGridLayouts?.applyOrderedLayout) {
        window.AleregoGridLayouts.applyOrderedLayout(container, options);
    }
}

function resetOrderedGridLayout(container) {
    if (!container || !(container instanceof HTMLElement)) {
        return;
    }

    if (window.AleregoGridLayouts?.resetOrderedLayout) {
        window.AleregoGridLayouts.resetOrderedLayout(container);
    }
}

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
        this.imagesPerPage = 12;
        this.currentImageIndex = 0;
        this.setData = null;
        this.referrerType = null;
        this.orientationRatios = ORIENTATION_RATIOS;
        
        this.init();
    }

    init() {
        this.loadSetFromURL();
        this.setupEventListeners();
    }

    applyBackgroundGradient() {
        const gradientDiv = document.querySelector('#gallery-bg');
        if (!gradientDiv) return;

        if (this.referrerType === 'corporate') {
            // Corporate: sky blue gradient
            gradientDiv.className = 'fixed inset-0 -z-10 bg-slate-900';
        } else {
            // Cosplay: fuchsia/purple gradient (default)
            gradientDiv.className = 'fixed inset-0 -z-10 bg-slate-950';
        }
    }

    loadSetFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const setId = urlParams.get('set');
        const type = urlParams.get('type') || 'cosplay';
        document.documentElement.dataset.theme = type === 'corporate' ? 'corporate' : 'cosplay';

        this.referrerType = type;
        this.applyBackgroundGradient();
        this.loadSetData(setId, type);
    }

    async loadSetData(setId, type) {
        try {
            const manifestSets = await this.fetchFeaturedSets(type);
            const allSets = (manifestSets.length ? manifestSets : [])
                .filter((item) => !type || item.type === type || !item.type);

            if (!allSets.length) {
                this.showError(t('set.missing'));
                return;
            }

            const wanted = (setId || '').toLowerCase();
            let set = wanted
                ? allSets.find((item) => String(item.slug || item.id || '').toLowerCase() === wanted)
                : allSets[0];

            if (!set) {
                this.showError(t('set.missing'));
                return;
            }

            if (set.slug && set.slug !== setId) {
                this.updateUrlWithSet(set.slug, type);
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
            this.showError(t('set.missing'));
        }
    }

    async fetchFeaturedSets(type) {
        try {
            const response = await fetch('/api/public/sets', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Failed to load API sets`);
            }

            const data = await response.json();
            const sets = Array.isArray(data?.sets) ? data.sets : [];
            return sets.map(s => {
                if(!s.images || !s.images.length) return null;

                const processedImages = s.images.map(imgPath => {
                    const full = `/media/${imgPath}`;
                    const thumbnail = full.replace('/full/', '/thumbnails/');
                    return { full, thumbnail, title: s.title };
                });

                const coverFull = `/media/${s.images[0]}`;
                const coverThumb = coverFull.replace('/full/', '/thumbnails/');
                
                return {
                    id: s.slug || s.id,
                    slug: s.slug,
                    title: s.title,
                    description: s.description,
                    type: s.type,
                    coverImage: { full: coverFull, thumbnail: coverThumb },
                    images: processedImages
                }
            }).filter(Boolean);
        } catch (error) {
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
        figure.dataset.orientation = orientation;
        imageEl.dataset.orientation = orientation;
        figure.style.aspectRatio = 'auto';
        imageEl.style.aspectRatio = 'auto';
        imageEl.style.width = '100%';
        imageEl.style.height = '100%';

        if (imageEl.naturalWidth && imageEl.naturalHeight) {
            const ratio = imageEl.naturalWidth / imageEl.naturalHeight;
            figure.dataset.aspectRatio = ratio.toFixed(6);
            imageEl.dataset.aspectRatio = ratio.toFixed(6);
        }
    }

    setupBackButton() {
        const backButton = document.getElementById('back-button');
        if (!backButton) return;

        if (this.referrerType === 'cosplay') {
            backButton.setAttribute('href', '/cosplay/');
        } else if (this.referrerType === 'corporate') {
            backButton.setAttribute('href', '/corporate/');
        } else {
            backButton.setAttribute('href', '/');
        }
    }

    updatePageInfo() {
        if (!this.setData) return;

        // Update page title and content
        document.getElementById('gallery-title').textContent = `${this.setData.title} · Alerego`;
        document.getElementById('gallery-category').textContent = this.setData.category || t('set.category');
        document.getElementById('gallery-main-title').textContent = this.setData.title;
        document.getElementById('gallery-description').textContent = this.setData.description;
        
        const totalPages = Math.max(1, Math.ceil(this.images.length / this.imagesPerPage));
        document.getElementById('page-info').textContent = t('set.page', {
            current: Math.min(this.currentPage, totalPages),
            total: totalPages
        });
        const countKey = this.images.length === 1 ? 'set.countOne' : 'set.count';
        document.getElementById('image-count').textContent = t(countKey, { n: this.images.length });
        
        // Update pagination buttons
        document.getElementById('prev-page').disabled = this.currentPage === 1 || !this.images.length;
        document.getElementById('next-page').disabled = this.currentPage >= totalPages || !this.images.length;
    }

    renderPage() {
        const grid = document.getElementById('image-grid');

        if (!this.images.length) {
            resetOrderedGridLayout(grid);
            grid.innerHTML = `
                <div class="gallery-empty">
                    <p><strong>${t('set.emptyTitle')}</strong></p>
                    <p>${t('set.emptyBody')}</p>
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
            figure.className = 'gallery-card';
            figure.setAttribute('role', 'button');
            figure.setAttribute('tabindex', '0');

            const imageEl = document.createElement('img');
            imageEl.src = image.thumbnail || image.full;
            imageEl.alt = image.title || 'Gallery image';
            imageEl.loading = 'eager';
            imageEl.className = 'gallery-card__image';

            const orientationHint = (image.orientation || '').toString().toLowerCase();
            const applyOrientation = () => this.applyOrientationStyles(figure, imageEl, orientationHint);

            if (imageEl.complete && imageEl.naturalWidth) {
                applyOrientation();
            } else {
                imageEl.addEventListener('load', applyOrientation, { once: true });
                imageEl.addEventListener('error', applyOrientation, { once: true });
            }

            figure.addEventListener('click', () => this.openLightbox(globalIndex));
            figure.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.openLightbox(globalIndex);
                }
            });

            figure.appendChild(imageEl);
            grid.appendChild(figure);
        });

        const layout = () => applyOrderedGridLayout(grid, {
            targetRowHeight: 280,
            maxRowHeight: 420,
            gap: 10,
            layoutStyle: 'justified'
        });

        const pending = Array.from(grid.querySelectorAll('img')).filter((img) => !img.complete || !img.naturalWidth);
        if (!pending.length) {
            layout();
            return;
        }

        Promise.all(pending.map((img) => img.decode ? img.decode().catch(() => {}) : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        }))).then(layout);
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
    caption.textContent = '';
        
        lightbox.classList.add('is-open');
        document.body.classList.add('is-locked');
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('is-open');
        document.body.classList.remove('is-locked');
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
        const isLightboxVisible = lightbox.classList.contains('is-open');
        
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
            resetOrderedGridLayout(grid);
            grid.innerHTML = `
                <div class="gallery-error">
                    <p><strong>${message}</strong></p>
                    <button type="button" class="btn btn--ghost" id="gallery-error-back">${t('set.goBack')}</button>
                </div>
            `;
            document.getElementById('gallery-error-back')?.addEventListener('click', () => history.back());
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
            descEl.textContent = t('set.missingBody');
        }

        if (categoryEl) {
            categoryEl.textContent = this.referrerType === 'corporate' ? t('set.feature.corporate') : t('set.feature.cosplay');
        }

        if (pageInfoEl) {
            pageInfoEl.textContent = t('set.page', { current: 0, total: 0 });
        }

        if (imageCountEl) {
            imageCountEl.textContent = t('set.count', { n: 0 });
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
    const viewer = new SetGalleryViewer();
    window.addEventListener('alerego:lang', () => {
        if (viewer.setData) viewer.updatePageInfo();
        else viewer.showError(t('set.missing'));
    });
});
