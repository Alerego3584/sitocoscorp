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
        if (window.AleregoGridLayouts?.resetOrderedLayout) {
            window.AleregoGridLayouts.resetOrderedLayout(container);
        }

        container.innerHTML = `
            <div class="gallery-empty">
                <p><strong data-i18n="gallery.emptySetsTitle"></strong></p>
                <p data-i18n="gallery.emptySetsBody"></p>
            </div>
        `;
        window.AleregoI18n?.apply(container);
        return;
    }

    const normalizedImages = images.map((image) => ({
        ...image,
        type: image.type || 'cosplay'
    }));

    initGallery(normalizedImages, {
        container,
        emptyTitleKey: "gallery.emptySetsTitle",
        emptyBodyKey: "gallery.emptySetsBody"
    });
}

// Initialize the dynamic grid
async function loadFeaturedSets() {
    try {
        const response = await fetch('/api/public/sets', { cache: 'no-store' });
        if (!response.ok) throw new Error('unavailable');
        const data = await response.json();
        const sets = Array.isArray(data?.sets) ? data.sets : [];
        return sets
            .filter((set) => set && set.images && set.images.length)
            .map((set) => {
                const full = `/media/${set.images[0]}`;
                return {
                    title: set.title,
                    description: set.description,
                    thumbnail: full.replace('/full/', '/thumbnails/'),
                    full,
                    href: `/set-gallery/?set=${encodeURIComponent(set.slug)}&type=${encodeURIComponent(set.type || 'cosplay')}`,
                    type: set.type || 'cosplay'
                };
            });
    } catch {
        return [];
    }
}

loadFeaturedSets().then(initDynamicGrid);
