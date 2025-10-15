// Featured Sets Configuration
// This file controls the screen-wide dynamic grid gallery

// You can either use images from your existing galleries or create dedicated set images
const FEATURED_SETS = [
    // Example: Mix from cosplay gallery
    {
        title: 'Neon Dreams Collection',
        description: 'Cyberpunk cosplay series with LED lighting',
        thumbnail: '/images/cosplay/thumbnails/akiraflame-LHQ-03.jpg',
        full: '/images/cosplay/full/akiraflame-LHQ-03.jpg'
    },
    {
        title: 'Convention Chronicles',
        description: 'Best moments from CBG25',
        thumbnail: '/images/cosplay/thumbnails/CBG25-brandy1-LHQ-01.jpg',
        full: '/images/cosplay/full/CBG25-brandy1-LHQ-01.jpg'
    },
    {
        title: 'Character Study',
        description: 'Portrait focus with dramatic lighting',
        thumbnail: '/images/cosplay/thumbnails/celine-isa-LHQ-03.jpg',
        full: '/images/cosplay/full/celine-isa-LHQ-03.jpg'
    },
    {
        title: 'Dynamic Action',
        description: 'Motion capture at Como Fun',
        thumbnail: '/images/cosplay/thumbnails/comofunII-LHQ-017.jpg',
        full: '/images/cosplay/full/comofunII-LHQ-017.jpg'
    },
    {
        title: 'Studio Magic',
        description: 'Controlled environment artistry',
        thumbnail: '/images/cosplay/thumbnails/genshintrio-LHQ-04.jpg',
        full: '/images/cosplay/full/genshintrio-LHQ-04.jpg'
    },
    {
        title: 'Environmental Storytelling',
        description: 'Location-based narrative photography',
        thumbnail: '/images/cosplay/thumbnails/Gardacon-LHQ-84.jpg',
        full: '/images/cosplay/full/Gardacon-LHQ-84.jpg'
    },
    {
        title: 'Color Harmony',
        description: 'Aesthetic focus on color grading',
        thumbnail: '/images/cosplay/thumbnails/haisaura-LHQ-20.jpg',
        full: '/images/cosplay/full/haisaura-LHQ-20.jpg'
    },
    {
        title: 'Editorial Excellence',
        description: 'Magazine-quality compositions',
        thumbnail: '/images/cosplay/thumbnails/lore9s-LHQ-15.jpg',
        full: '/images/cosplay/full/lore9s-LHQ-15.jpg'
    },
    {
        title: 'Corporate Elegance',
        description: 'Professional portraiture',
        thumbnail: '/images/corporate/thumbnails/corporate-1005.jpg',
        full: '/images/corporate/full/corporate-1005.jpg'
    },
    {
        title: 'Business Dynamics',
        description: 'Modern workplace photography',
        thumbnail: '/images/corporate/thumbnails/corporate-1032.jpg',
        full: '/images/corporate/full/corporate-1032.jpg'
    },
    {
        title: 'Innovation Spaces',
        description: 'Contemporary office environments',
        thumbnail: '/images/corporate/thumbnails/corporate-1035.jpg',
        full: '/images/corporate/full/corporate-1035.jpg'
    },
    {
        title: 'Team Synergy',
        description: 'Collaborative workplace moments',
        thumbnail: '/images/corporate/thumbnails/corporate-1043.jpg',
        full: '/images/corporate/full/corporate-1043.jpg'
    }
];

// Custom gallery initialization for dynamic grid
function initDynamicGrid(images) {
    const container = document.querySelector('#sets-grid');
    if (!container) return;

    if (!images.length) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-20 text-center text-sm text-white/70 m-8">
                <p class="mb-4 text-xl font-semibold text-white">Featured Sets Coming Soon</p>
                <p class="max-w-md text-base text-white/70">Add your featured sets in <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">scripts/sets-config.js</code></p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    images.forEach((image, index) => {
        const figure = document.createElement('figure');
        figure.setAttribute('role', 'button');
        figure.setAttribute('tabindex', '0');
        figure.setAttribute('aria-label', `${image.title || 'Set image'} — view full size`);

        const img = document.createElement('img');
        img.src = image.thumbnail;
        img.alt = image.title || 'Featured set';
        img.loading = 'lazy';

        const caption = document.createElement('figcaption');
        caption.innerHTML = `
            <h3 class="text-lg font-semibold text-white mb-1">${image.title || 'Untitled Set'}</h3>
            <p class="text-sm text-white/80">${image.description || ''}</p>
        `;

        figure.appendChild(img);
        figure.appendChild(caption);

        figure.addEventListener('click', () => openLightbox(index));
        figure.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openLightbox(index);
            }
        });

        container.appendChild(figure);
    });

    // Store images globally for lightbox
    window.images = images;
}

// Initialize the dynamic grid
initDynamicGrid(FEATURED_SETS);