let currentImageIndex = 0;
let currentLightboxImages = [];

const gallerySelectors = {
    grid: '[data-gallery-grid]',
    lightbox: '#lightbox',
    lightboxImage: '#lightbox-img',
    lightboxCaption: '#caption',
    close: '[data-lightbox-close]',
    prev: '[data-lightbox-prev]',
    next: '[data-lightbox-next]'
};

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

function applyOrientationStyles({ figure, imageEl, hint }) {
    if (!figure || !imageEl) return;

    const orientation = hint || resolveOrientationFromDimensions(imageEl.naturalWidth, imageEl.naturalHeight);

    figure.dataset.orientation = orientation;
    figure.style.gridColumn = '';
    
    // Le verticali occupano due slot verticali, orizzontali e quadrate 1
    if (orientation === 'portrait') {
        figure.classList.add('row-span-2');
        figure.classList.remove('row-span-1');
    } else {
        figure.classList.add('row-span-1');
        figure.classList.remove('row-span-2');
    }

    imageEl.dataset.orientation = orientation;
    imageEl.style.width = '100%';
    imageEl.style.height = '100%';
}

if (typeof window !== 'undefined') {
    window.resolveImageOrientation = resolveOrientationFromDimensions;
    window.__ALEREGO_ORIENTATION_RATIOS__ = ORIENTATION_RATIOS;
}

function resolveGalleryContainer(options = {}) {
    const { container } = options;

    if (container instanceof HTMLElement) {
        return container;
    }

    if (typeof container === 'string') {
        return document.querySelector(container);
    }

    return document.querySelector(gallerySelectors.grid);
}

function initGallery(imageConfig = [], options = {}) {
    const gallery = resolveGalleryContainer(options);

    if (!gallery) {
        console.warn('Alerego.dev gallery: container not found');
        return;
    }

    const emptyPrompt = options.emptyPrompt || gallery.dataset.emptyPrompt || 'config.js';
    const orderedLayoutOptions = options.orderedLayout || {};

    if (!imageConfig.length) {
        resetOrderedGridLayout(gallery);
        gallery.innerHTML = `
            <div class="col-span-full rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/70">
                <p class="mb-4 text-base font-semibold text-white">Gallery coming soon</p>
                <p>Head over to <span class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">scripts/${emptyPrompt}</span> and add your first entries. Use optimized thumbnails for peak performance.</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = '';
    gallery.dataset.count = imageConfig.length;

    gallery.classList.remove(
        'grid',
        'grid-cols-2',
        'sm:grid-cols-2',
        'sm:grid-cols-3',
        'lg:grid-cols-3',
        'lg:grid-cols-4',
        'xl:grid-cols-4',
        'xl:grid-cols-5',
        '2xl:grid-cols-6',
        'gap-3',
        'gap-4',
        'auto-rows-auto',
        'columns-1',
        'sm:columns-2',
        'lg:columns-3',
        'xl:columns-4',
        '2xl:columns-5',
        '[column-fill:balance]'
    );

    gallery.classList.add(
        'grid',
        'grid-cols-2',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4',
        'gap-4',
        'auto-rows-[160px]',
        'sm:auto-rows-[200px]',
        'lg:auto-rows-[240px]',
        'grid-flow-row-dense'
    );
    gallery.style.columnGap = '';

    imageConfig.forEach((image, index) => {
        const figure = document.createElement('figure');
        const hasHref = typeof image.href === 'string' && image.href.length > 0;

        const rawType = (image.type || '').toString().toLowerCase();
        const resolvedType = rawType === 'corporate' ? 'corporate' : 'cosplay';

        const baseFigureClass = 'group relative overflow-hidden rounded-md border shadow-xl shadow-black/40 transition-all duration-500 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white/50';
        const typeFigureClass = resolvedType === 'corporate'
            ? 'border-sky-400/20 bg-sky-500/10 hover:border-sky-300/40 hover:shadow-2xl hover:shadow-sky-500/40'
            : 'border-fuchsia-400/30 bg-fuchsia-500/10 hover:border-fuchsia-300/50 hover:shadow-2xl hover:shadow-purple-500/40';

        figure.className = `${baseFigureClass} ${typeFigureClass}`;
        figure.setAttribute('role', 'button');
        figure.setAttribute('tabindex', '0');
        figure.setAttribute('aria-label', `${image.title || 'Portfolio image'} — ${hasHref ? 'open collection' : 'view full size'}`);
        figure.dataset.sectionType = resolvedType;
        if (hasHref) {
            figure.dataset.href = image.href;
        }

        const coverImage = document.createElement('img');
        coverImage.src = image.thumbnail;
        coverImage.alt = image.title || 'Portfolio thumbnail';
        coverImage.loading = 'lazy';
        coverImage.className = 'h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105';
        coverImage.dataset.sectionType = resolvedType;

        const orientationHint = (image.orientation || '').toString().toLowerCase();
        const applyOrientation = () => applyOrientationStyles({ figure, imageEl: coverImage, hint: orientationHint });

        if (coverImage.complete && coverImage.naturalWidth) {
            applyOrientation();
        } else {
            coverImage.addEventListener('load', applyOrientation, { once: true });
            coverImage.addEventListener('error', () => applyOrientationStyles({ figure, imageEl: coverImage, hint: orientationHint }), { once: true });
        }

        figure.appendChild(coverImage);

        figure.addEventListener('click', () => {
            if (hasHref) {
                window.location.href = image.href;
                return;
            }
            openLightbox(imageConfig, index);
        });

        figure.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (hasHref) {
                    window.location.href = image.href;
                    return;
                }
                openLightbox(imageConfig, index);
            }
        });

        gallery.appendChild(figure);
    });

    const defaultLayout = gallery.id === 'home-gallery'
        ? { targetRowHeight: 230, maxRowHeight: 320, gap: 14 }
        : { targetRowHeight: 260, maxRowHeight: 360, gap: 12 };

    applyOrderedGridLayout(gallery, {
        ...defaultLayout,
        ...orderedLayoutOptions
    });
}

function openLightbox(imageArray, index) {
    if (!imageArray || !imageArray.length) return;
    currentLightboxImages = imageArray;
    currentImageIndex = index;

    const lightbox = document.querySelector(gallerySelectors.lightbox);
    const imageEl = document.querySelector(gallerySelectors.lightboxImage);
    const captionEl = document.querySelector(gallerySelectors.lightboxCaption);

    if (!lightbox || !imageEl || !captionEl) return;

    imageEl.src = currentLightboxImages[index].full;
    imageEl.alt = currentLightboxImages[index].title || 'Portfolio image';
    captionEl.textContent = '';

    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.classList.add('overflow-hidden');
}

function closeLightbox() {
    const lightbox = document.querySelector(gallerySelectors.lightbox);
    if (!lightbox) return;

    lightbox.classList.remove('flex');
    lightbox.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

function changeImage(direction) {
    if (!currentLightboxImages.length) return;

    currentImageIndex = (currentImageIndex + direction + currentLightboxImages.length) % currentLightboxImages.length;

    const imageEl = document.querySelector(gallerySelectors.lightboxImage);
    const captionEl = document.querySelector(gallerySelectors.lightboxCaption);

    if (!imageEl || !captionEl) return;

    imageEl.src = currentLightboxImages[currentImageIndex].full;
    imageEl.alt = currentLightboxImages[currentImageIndex].title || 'Portfolio image';
    captionEl.textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.querySelector(gallerySelectors.close);
    const prevBtn = document.querySelector(gallerySelectors.prev);
    const nextBtn = document.querySelector(gallerySelectors.next);
    const lightbox = document.querySelector(gallerySelectors.lightbox);

    closeBtn?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', () => changeImage(-1));
    nextBtn?.addEventListener('click', () => changeImage(1));

    lightbox?.addEventListener('click', (event) => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (event) => {
        const isLightboxVisible = !lightbox?.classList.contains('hidden');
        if (!isLightboxVisible) return;

        switch (event.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                changeImage(-1);
                break;
            case 'ArrowRight':
                changeImage(1);
                break;
        }
    });
});
