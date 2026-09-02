const ADMIN_API = '/api/admin';

// Simple token storage
const storage = {
    getToken: () => localStorage.getItem('admin_token'),
    setToken: (token) => localStorage.setItem('admin_token', token),
    removeToken: () => localStorage.removeItem('admin_token')
};

let currentSets = [];
let activeEditSetId = null;

// UI Elements
const els = {
    loginView: document.getElementById('login-view'),
    dashboardView: document.getElementById('dashboard-view'),
    loginForm: document.getElementById('login-form'),
    passwordInput: document.getElementById('password'),
    loginError: document.getElementById('login-error'),
    logoutBtn: document.getElementById('logout-btn'),
    saveAllBtn: document.getElementById('save-all-btn'),
    createSetBtn: document.getElementById('create-set-btn'),
    contentArea: document.getElementById('content-area'),
    // Modal
    editModal: document.getElementById('edit-modal'),
    modalClose: document.getElementById('close-modal'),
    modalSave: document.getElementById('modal-save-btn'),
    modalDelete: document.getElementById('modal-delete-btn'),
    modalHeading: document.getElementById('modal-heading'),
    newSetFields: document.getElementById('new-set-fields'),
    modalType: document.getElementById('modal-type'),
    modalSlug: document.getElementById('modal-slug'),
    modalTitle: document.getElementById('modal-title'),
    modalDesc: document.getElementById('modal-desc'),
    modalFile: document.getElementById('modal-file'),
    uploadSection: document.getElementById('upload-section'),
    uploadStatus: document.getElementById('upload-status'),
    saveFirstMessage: document.getElementById('save-first-message'),
    coverSelectionArea: document.getElementById('cover-selection-area'),
    coverGrid: document.getElementById('cover-grid'),
};

// Toggle Views
function showView(view) {
    if (view === 'login') {
        els.loginView.classList.remove('hidden-view');
        els.dashboardView.classList.add('hidden-view');
    } else {
        els.loginView.classList.add('hidden-view');
        els.dashboardView.classList.remove('hidden-view');
        loadDashboardData();
    }
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    const password = els.passwordInput.value;
    els.loginError.classList.add('hidden');

    try {
        const response = await fetch(`${ADMIN_API}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (!response.ok) throw new Error('Invalid password');

        const { token } = await response.json();
        storage.setToken(token);
        els.passwordInput.value = '';
        showView('dashboard');
    } catch (err) {
        els.loginError.textContent = err.message;
        els.loginError.classList.remove('hidden');
    }
}

// Data Fetching wrapper
async function apiFetch(endpoint, options = {}) {
    const token = storage.getToken();
    if (!token) throw new Error('No token');

    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const res = await fetch(`${ADMIN_API}${endpoint}`, { ...options, headers });
    
    if (res.status === 401 || res.status === 403) {
        handleLogout();
        throw new Error('Session expired');
    }
    
    return res;
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        els.contentArea.innerHTML = '<div class="col-span-full p-8 text-center text-slate-400">Loading your sets...</div>';
        
        const res = await apiFetch('/sets');
        if (!res.ok) throw new Error('Failed to load sets');
        
        const data = await res.json();
        currentSets = data.sets || [];
        // Sort by order asc
        currentSets.sort((a,b) => (a.order || 0) - (b.order || 0));
        renderSets(currentSets);
    } catch (err) {
        if (err.message !== 'Session expired') {
            els.contentArea.innerHTML = `<div class="col-span-full p-8 text-center text-red-400">Error: ${err.message}</div>`;
        }
    }
}

async function saveAllData() {
    els.saveAllBtn.textContent = 'Saving...';
    try {
        const res = await apiFetch('/sets', {
            method: 'POST',
            body: JSON.stringify({ sets: currentSets })
        });
        if (!res.ok) throw new Error('Save failed');
        els.saveAllBtn.textContent = 'Saved!';
        setTimeout(() => els.saveAllBtn.textContent = 'Save Changes', 2000);
    } catch (e) {
        alert(e.message);
        els.saveAllBtn.textContent = 'Save Error';
    }
}

// Render Sets with Drag and Drop hooks
function renderSets(sets) {
    if (!sets.length) {
        els.contentArea.innerHTML = '<div class="col-span-full p-8 text-center text-slate-400">No sets found yet.</div>';
        return;
    }

    els.contentArea.innerHTML = sets.map((set, i) => `
        <div draggable="true" data-id="${set.id}" class="set-card flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-900/50 p-5 shadow-lg relative hover:border-white/20 transition cursor-grab active:cursor-grabbing">
            <div class="pointer-events-none absolute right-4 top-4 text-slate-500 opacity-50"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10h10V8H7v2zm0 6h10v-2H7v2z"/></svg></div>
            <div class="flex-1 space-y-2 pointer-events-none">
                <div class="flex justify-between items-center text-xs">
                   <span class="uppercase tracking-widest text-brand">${set.type || 'Category'}</span>
                   <span class="text-slate-500">Order: ${i + 1}</span>
                </div>
                <h3 class="text-lg font-semibold text-white pointer-events-none">${set.title}</h3>
                <p class="text-sm text-slate-400 pointer-events-none line-clamp-2">${set.description || 'No description'}</p>
            </div>
            <div class="flex justify-between pt-4 border-t border-white/5">
                <span class="text-xs text-slate-500">${set.images?.length || 0} images</span>
                <button onclick="editSet('${set.id}')" class="text-xs font-semibold text-brand hover:text-white pointer-events-auto cursor-pointer relative z-10 px-2 py-1 -mr-2">Edit</button>
            </div>
        </div>
    `).join('');

    setupDragAndDrop();
}

function setupDragAndDrop() {
    let draggedItem = null;
    const cards = els.contentArea.querySelectorAll('.set-card');
    
    cards.forEach(card => {
        card.addEventListener('dragstart', function() {
            draggedItem = this;
            setTimeout(() => this.style.display = 'none', 0);
        });

        card.addEventListener('dragend', function() {
            draggedItem = null;
            this.style.display = 'flex';
            
            // Update order based on new DOM position
            const newCards = Array.from(els.contentArea.querySelectorAll('.set-card'));
            currentSets = newCards.map((c, i) => {
                const id = c.getAttribute('data-id');
                const set = currentSets.find(s => s.id === id);
                return { ...set, order: i + 1 };
            });
            renderSets(currentSets); // re-render to update the display order number
        });

        card.addEventListener('dragover', function(e) {
            e.preventDefault();
        });

        card.addEventListener('dragenter', function(e) {
            e.preventDefault();
            this.style.borderColor = '#38bdf8';
        });

        card.addEventListener('dragleave', function() {
            this.style.borderColor = '';
        });

        card.addEventListener('drop', function() {
            this.style.borderColor = '';
            els.contentArea.insertBefore(draggedItem, this);
        });
    });
}

function renderCoverSelection(set) {
    if (!set || !set.images || set.images.length === 0) {
        els.coverSelectionArea.classList.add('hidden');
        els.coverGrid.innerHTML = '';
        return;
    }
    
    set.featuredImages = set.featuredImages || [];
    
    els.coverSelectionArea.classList.remove('hidden');
    els.coverGrid.innerHTML = set.images.map((imgPath, index) => {
        const isCover = index === 0;
        const isFeatured = set.featuredImages.includes(imgPath);
        const isHero = set.categoryHeroImage === imgPath;
        
        return `
        <div class="relative group flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${isCover ? 'border-brand shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'border-transparent hover:border-white/30'}">
            <img src="/media/${imgPath.replace('/full/', '/thumbnails/')}" class="w-full h-full object-cover cursor-pointer" onclick="setCoverImage(event, '${imgPath}')">
            
            <!-- Cover Indicator -->
            ${isCover ? '<div class="absolute top-1 left-1 bg-brand/90 p-1 rounded backdrop-blur text-slate-900 pointer-events-none"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>' : ''}
            
            <!-- Featured Toggle -->
            <button onclick="toggleFeaturedImage(event, '${imgPath}')" class="absolute top-1 right-1 p-1 rounded-full backdrop-blur transition-all ${isFeatured ? 'bg-pink-500/90 text-white' : 'bg-slate-900/50 text-white/50 hover:bg-pink-500/50'}" title="Star photo">
                <svg class="w-4 h-4" ${isFeatured ? 'fill="currentColor"' : 'fill="none"'} viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </button>
            
            <!-- Hero Toggle -->
            <button onclick="toggleHeroImage(event, '${imgPath}')" class="absolute bottom-1 right-1 p-1 rounded-full backdrop-blur transition-all ${isHero ? 'bg-amber-500/90 text-white' : 'bg-slate-900/50 text-white/50 hover:bg-amber-500/50'}" title="Set as Main Page Cover">
                <svg class="w-4 h-4" ${isHero ? 'fill="currentColor"' : 'fill="none"'} viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-2a4 4 0 014-4h10a4 4 0 014 4v2m-3-10a4 4 0 11-8 0 4 4 0 018 0zM3 7l9-4 9 4M4 10h16v4H4z" /></svg>
            </button>
        </div>
        `;
    }).join('');
}

function setCoverImage(e, imgPath) {
    e.preventDefault();
    if (!activeEditSetId) return;
    const set = currentSets.find(s => s.id === activeEditSetId);
    if (!set || !set.images) return;

    const idx = set.images.indexOf(imgPath);
    if(idx > -1) {
        set.images.splice(idx, 1);
        set.images.unshift(imgPath);
    }
    
    renderCoverSelection(set);
}

function toggleFeaturedImage(e, imgPath) {
    e.preventDefault();
    if (!activeEditSetId) return;
    const set = currentSets.find(s => s.id === activeEditSetId);
    if (!set) return;

    set.featuredImages = set.featuredImages || [];
    const idx = set.featuredImages.indexOf(imgPath);
    if (idx > -1) {
        set.featuredImages.splice(idx, 1);
    } else {
        set.featuredImages.push(imgPath);
    }
    
    renderCoverSelection(set);
}

function toggleHeroImage(e, imgPath) {
    e.preventDefault();
    if (!activeEditSetId) return;
    const set = currentSets.find(s => s.id === activeEditSetId);
    if (!set) return;

    if (set.categoryHeroImage === imgPath) {
        set.categoryHeroImage = null;
    } else {
        // Clear hero from other sets in the same category
        currentSets.forEach(other => {
            if (other.type === set.type) {
                other.categoryHeroImage = null;
            }
        });
        set.categoryHeroImage = imgPath;
    }
    
    renderCoverSelection(set);
}

function editSet(id) {
    const set = currentSets.find(s => s.id === id);
    if (!set) return;
    
    activeEditSetId = id;
    els.modalHeading.textContent = 'Edit Set Properties';
    els.newSetFields.classList.add('hidden');
    els.modalDelete.classList.remove('hidden');
    if (els.uploadSection) els.uploadSection.classList.remove('hidden');
    if (els.saveFirstMessage) els.saveFirstMessage.classList.add('hidden');
    
    els.modalTitle.value = set.title || '';
    els.modalDesc.value = set.description || '';
    
    renderCoverSelection(set);

    els.editModal.classList.remove('hidden');
    els.editModal.classList.add('flex');
}

function createSet() {
    activeEditSetId = 'NEW';
    els.modalHeading.textContent = 'Create New Set';
    els.newSetFields.classList.remove('hidden');
    els.newSetFields.classList.add('flex');
    els.modalDelete.classList.add('hidden');
    if (els.uploadSection) els.uploadSection.classList.add('hidden');
    if (els.saveFirstMessage) els.saveFirstMessage.classList.remove('hidden');
    
    els.modalTitle.value = '';
    els.modalDesc.value = '';
    els.modalSlug.value = '';
    els.modalType.value = 'cosplay';
    
    renderCoverSelection(null);

    els.editModal.classList.remove('hidden');
    els.editModal.classList.add('flex');
}

function deleteSet() {
    if(!confirm('Are you sure you want to remove this set?')) return;
    currentSets = currentSets.filter(s => s.id !== activeEditSetId);
    closeModal();
    renderSets(currentSets);
    saveAllData(); // Autosave immediately
}

function closeModal() {
    els.editModal.classList.remove('flex');
    els.editModal.classList.add('hidden');
    activeEditSetId = null;
    els.uploadStatus.classList.add('hidden');
    els.modalFile.value = '';
}

function saveModalChanges() {
    if (!activeEditSetId) return;

    if (activeEditSetId === 'NEW') {
        const title = els.modalTitle.value;
        const slug = els.modalSlug.value || title.toLowerCase().replace(/\s+/g, '-');
        const type = els.modalType.value;
        if (!title || !slug) return alert('Title and Slug required');

        currentSets.push({
            id: Date.now().toString(),
            type,
            slug,
            title,
            description: els.modalDesc.value,
            order: currentSets.length + 1,
            images: []
        });
    } else {
        const targetSet = currentSets.find(s => s.id === activeEditSetId);
        if (!targetSet) return;
        targetSet.title = els.modalTitle.value;
        targetSet.description = els.modalDesc.value;
    }
    
    closeModal();
    renderSets(currentSets);
    saveAllData(); // Autosave immediately
}

// Upload Logic

// Helper function to resize images locally in the browser
function processImageLocally(file, maxSize, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            let { width, height } = img;
            
            // Calculate new dimensions preserving aspect ratio
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round(height * (maxSize / width));
                    width = maxSize;
                } else {
                    width = Math.round(width * (maxSize / height));
                    height = maxSize;
                }
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to WebP blob
            canvas.toBlob(blob => {
                if (blob) {
                    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    resolve(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
                } else {
                    reject(new Error('Canvas to Blob failed'));
                }
            }, 'image/webp', quality);
        };
        img.onerror = () => reject(new Error('Image load failed'));
    });
}

async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length || !activeEditSetId) return;

    const set = currentSets.find(s => s.id === activeEditSetId);
    if (!set) return;

    els.uploadStatus.classList.remove('hidden');
    
    set.images = set.images || [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        els.uploadStatus.textContent = `Processing image ${i + 1} of ${files.length} (${file.name})...`;

        try {
            // Compress and convert to WebP client-side
            const fullWebP = await processImageLocally(file, 2560, 0.85); // max 2560px, 85% quality
            const thumbWebP = await processImageLocally(file, 1200, 0.75); // max 1200px, 75% quality
            
            const baseFolder = set.type === 'corporate' ? 'corporate' : 'cosplay';
            const cleanName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/\s+/g, '-').toLowerCase() || file.name;
            const imgName = `${Date.now()}-${cleanName}.webp`;
            
            const fullPath = `${baseFolder}/featured/${set.slug}/full/${imgName}`;
            const thumbPath = `${baseFolder}/featured/${set.slug}/thumbnails/${imgName}`;

            els.uploadStatus.textContent = `Uploading ${i + 1} of ${files.length} to Cloudflare R2...`;

            // Upload Full version
            const fullFormData = new FormData();
            fullFormData.append('file', fullWebP);
            fullFormData.append('path', fullPath);
            await apiFetch('/upload', { method: 'POST', body: fullFormData });

            // Upload Thumbnail version
            const thumbFormData = new FormData();
            thumbFormData.append('file', thumbWebP);
            thumbFormData.append('path', thumbPath);
            await apiFetch('/upload', { method: 'POST', body: thumbFormData });

            // Only save the full path in the DB, the frontend script knows how to find thumbnails
            set.images.push(fullPath);
            
            // Re-render cover selection live if modal is still open
            renderCoverSelection(set);
            
        } catch (err) {
            console.error(err);
            els.uploadStatus.textContent = `Error on ${file.name}: ${err.message}`;
            await new Promise(r => setTimeout(r, 2000)); // wait a bit to show error
        }
    }
    
    els.uploadStatus.textContent = `Successfully processed and uploaded ${files.length} image(s)!`;
    setTimeout(() => els.uploadStatus.classList.add('hidden'), 3000);
}

function handleLogout() {
    storage.removeToken();
    showView('login');
}

// Initialization
function init() {
    els.loginForm.addEventListener('submit', handleLogin);
    els.logoutBtn.addEventListener('click', handleLogout);
    els.saveAllBtn.addEventListener('click', saveAllData);
    els.createSetBtn.addEventListener('click', createSet);
    
    els.modalClose.addEventListener('click', closeModal);
    els.modalSave.addEventListener('click', saveModalChanges);
    els.modalDelete.addEventListener('click', deleteSet);
    els.modalFile.addEventListener('change', handleFileUpload);
    
    // Close modal on background click
    els.editModal.addEventListener('click', (e) => {
        if(e.target === els.editModal) closeModal();
    });

    // Check existing session
    if (storage.getToken()) {
        showView('dashboard');
    } else {
        showView('login');
    }
}

// Avvia l'applicazione
init();