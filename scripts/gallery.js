let currentImageIndex = 0;
let images = [];

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
    const ratio = ORIENTATION_RATIOS[orientation] || ORIENTATION_RATIOS.landscape;

    figure.dataset.orientation = orientation;
    figure.style.aspectRatio = ratio;

    imageEl.dataset.orientation = orientation;
    imageEl.style.aspectRatio = ratio;
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
    images = imageConfig;
    const gallery = resolveGalleryContainer(options);

    if (!gallery) {
        console.warn('Alerego.dev gallery: container not found');
        return;
    }

    const emptyPrompt = options.emptyPrompt || gallery.dataset.emptyPrompt || 'config.js';

    if (!images.length) {
        gallery.innerHTML = `
            <div class="col-span-full rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/70">
                <p class="mb-4 text-base font-semibold text-white">Gallery coming soon</p>
                <p>Head over to <span class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">scripts/${emptyPrompt}</span> and add your first entries. Use optimized thumbnails for peak performance.</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = '';
    gallery.dataset.count = images.length;

    gallery.classList.remove(
        'grid',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4'
    );

    gallery.classList.add(
        'columns-1',
        'sm:columns-2',
        'lg:columns-2',
        'xl:columns-3',
        '[column-fill:balance]'
    );
    gallery.style.columnGap = '1.5rem';

    images.forEach((image, index) => {
        const figure = document.createElement('figure');
        const hasHref = typeof image.href === 'string' && image.href.length > 0;

        const rawType = (image.type || '').toString().toLowerCase();
        const resolvedType = rawType === 'corporate' ? 'corporate' : 'cosplay';

        const baseFigureClass = 'group relative mb-6 overflow-hidden rounded-3xl border shadow-xl shadow-black/40 transition-all duration-500 hover:-translate-y-2 break-inside-avoid focus:outline-none focus:ring-2 focus:ring-white/50';
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

        const defaultRatio = ORIENTATION_RATIOS.landscape;
        figure.style.aspectRatio = defaultRatio;

        const coverImage = document.createElement('img');
        coverImage.src = image.thumbnail;
        coverImage.alt = image.title || 'Portfolio thumbnail';
        coverImage.loading = 'lazy';
        coverImage.className = 'h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105';
        coverImage.style.aspectRatio = defaultRatio;
        coverImage.dataset.sectionType = resolvedType;

        const orientationHint = (image.orientation || '').toString().toLowerCase();
        const applyOrientation = () => applyOrientationStyles({ figure, imageEl: coverImage, hint: orientationHint });

        if (coverImage.complete && coverImage.naturalWidth) {
            applyOrientation();
        } else {
            coverImage.addEventListener('load', applyOrientation, { once: true });
            coverImage.addEventListener('error', () => applyOrientationStyles({ figure, imageEl: coverImage, hint: orientationHint }), { once: true });
        }

        const overlay = document.createElement('figcaption');
        const overlayGradient = resolvedType === 'corporate'
            ? 'from-sky-950/95 via-slate-950/40'
            : 'from-fuchsia-950/95 via-slate-950/35';
        overlay.className = `pointer-events-none absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t ${overlayGradient} to-transparent p-4`;

        const labelText = (image.label || 'featured set').toString();
        const accentBarClass = resolvedType === 'corporate' ? 'bg-sky-300/70' : 'bg-fuchsia-300/70';
        const labelColorClass = resolvedType === 'corporate' ? 'text-sky-100/80' : 'text-white/70';
        const titleColorClass = resolvedType === 'corporate' ? 'text-sky-50' : 'text-white';
        const descriptionColorClass = resolvedType === 'corporate' ? 'text-sky-100/80' : 'text-white/80';
        const descriptionText = image.description ? `<p class="text-xs ${descriptionColorClass}">${image.description}</p>` : '';

        overlay.innerHTML = `
            <div class="inline-flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.45em] ${labelColorClass}">
                <span class="inline-block h-1 w-5 rounded-full ${accentBarClass}"></span>
                ${labelText}
            </div>
            <h3 class="text-sm font-semibold ${titleColorClass} drop-shadow-lg">${image.title || 'Untitled capture'}</h3>
            ${descriptionText}
        `;

        figure.appendChild(coverImage);
        figure.appendChild(overlay);

        figure.addEventListener('click', () => {
            if (hasHref) {
                window.location.href = image.href;
                return;
            }
            openLightbox(index);
        });

        figure.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (hasHref) {
                    window.location.href = image.href;
                    return;
                }
                openLightbox(index);
            }
        });

        gallery.appendChild(figure);
    });
}

function openLightbox(index) {
    if (!images.length) return;
    currentImageIndex = index;

    const lightbox = document.querySelector(gallerySelectors.lightbox);
    const imageEl = document.querySelector(gallerySelectors.lightboxImage);
    const captionEl = document.querySelector(gallerySelectors.lightboxCaption);

    if (!lightbox || !imageEl || !captionEl) return;

    imageEl.src = images[index].full;
    imageEl.alt = images[index].title || 'Portfolio image';
    captionEl.textContent = images[index].title || '';

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
    if (!images.length) return;

    currentImageIndex = (currentImageIndex + direction + images.length) % images.length;

    const imageEl = document.querySelector(gallerySelectors.lightboxImage);
    const captionEl = document.querySelector(gallerySelectors.lightboxCaption);

    if (!imageEl || !captionEl) return;

    imageEl.src = images[currentImageIndex].full;
    imageEl.alt = images[currentImageIndex].title || 'Portfolio image';
    captionEl.textContent = images[currentImageIndex].title || '';
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
