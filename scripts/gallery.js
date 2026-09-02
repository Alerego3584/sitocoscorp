function t(key, vars) {
    return window.AleregoI18n ? window.AleregoI18n.t(key, vars) : key;
}

function applyI18n(root) {
    if (window.AleregoI18n) window.AleregoI18n.apply(root);
}

function galleryLabel(title, hasHref) {
    return `${title || t('gallery.photo')} - ${hasHref ? t('gallery.openSet') : t('gallery.viewFull')}`;
}

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
        return;
    }

    const orderedLayoutOptions = options.orderedLayout || {};

    if (!imageConfig.length) {
        resetOrderedGridLayout(gallery);
        const titleKey = options.emptyTitleKey || 'gallery.emptyTitle';
        const bodyKey = options.emptyBodyKey || 'gallery.emptyBody';
        gallery.innerHTML = `
            <div class="gallery-empty">
                <p><strong data-i18n="${titleKey}">${t(titleKey)}</strong></p>
                <p data-i18n="${bodyKey}">${t(bodyKey)}</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = '';
    gallery.dataset.count = imageConfig.length;

    gallery.classList.add('gallery-grid');
    gallery.style.columnGap = '';

    imageConfig.forEach((image, index) => {
        const figure = document.createElement('figure');
        const hasHref = typeof image.href === 'string' && image.href.length > 0;

        const rawType = (image.type || '').toString().toLowerCase();
        const resolvedType = rawType === 'corporate' ? 'corporate' : 'cosplay';

        figure.className = `gallery-card gallery-card--${resolvedType}`;
        figure.setAttribute('role', 'button');
        figure.setAttribute('tabindex', '0');
        figure.setAttribute('aria-label', galleryLabel(image.title, hasHref));
        figure.dataset.sectionType = resolvedType;
        figure.dataset.title = image.title || '';
        if (hasHref) {
            figure.dataset.href = image.href;
        }

        const coverImage = document.createElement('img');
        coverImage.src = image.thumbnail;
        coverImage.alt = image.title || t('gallery.photo');
        coverImage.loading = 'lazy';
        coverImage.className = 'gallery-card__image';
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
            if (hasHref && gallery.id !== 'home-gallery') {
                window.location.href = image.href;
                return;
            }
            openLightbox(imageConfig, index);
        });

        figure.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (hasHref && gallery.id !== 'home-gallery') {
                    window.location.href = image.href;
                    return;
                }
                openLightbox(imageConfig, index);
            }
        });

        gallery.appendChild(figure);
    });

    const defaultLayout = gallery.id === 'home-gallery'
        ? { targetRowHeight: 230, maxRowHeight: 320, gap: 10, layoutStyle: 'justified' }
        : { targetRowHeight: 260, maxRowHeight: 380, gap: 10, layoutStyle: 'justified' };

    const runLayout = () => applyOrderedGridLayout(gallery, {
        ...defaultLayout,
        ...orderedLayoutOptions
    });

    const pending = Array.from(gallery.querySelectorAll('img')).filter((img) => !img.complete || !img.naturalWidth);
    if (!pending.length) {
        runLayout();
        return;
    }

    Promise.all(pending.map((img) => (img.decode ? img.decode().catch(() => {}) : new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
    })))).then(runLayout);
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

    lightbox.classList.add('is-open');
    document.body.classList.add('is-locked');
}

function closeLightbox() {
    const lightbox = document.querySelector(gallerySelectors.lightbox);
    if (!lightbox) return;

    lightbox.classList.remove('is-open');
    document.body.classList.remove('is-locked');
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
        const isLightboxVisible = lightbox?.classList.contains('is-open');
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

window.addEventListener('alerego:lang', () => {
    document.querySelectorAll('figure.gallery-card').forEach((figure) => {
        const hasHref = Boolean(figure.dataset.href);
        figure.setAttribute('aria-label', galleryLabel(figure.dataset.title, hasHref));
        const img = figure.querySelector('img');
        if (img && !figure.dataset.title) img.alt = t('gallery.photo');
    });
});
