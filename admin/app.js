const ADMIN_API = '/api/admin';

function t(key, vars) {
    return window.AleregoI18n ? window.AleregoI18n.t(key, vars) : key;
}

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

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error === 'Unauthorized' ? t('admin.badPassword') : (data.error || `Login failed (${response.status})`));
        }

        storage.setToken(data.token);
        els.passwordInput.value = '';
        showView('dashboard');
    } catch (err) {
        const offline = err.message === 'Failed to fetch' || err.name === 'TypeError';
        els.loginError.textContent = offline
            ? t('admin.offline')
            : err.message;
        els.loginError.classList.remove('hidden');
    }
}

// Data Fetching wrapper
async function apiFetch(endpoint, options = {}) {
    const token = storage.getToken();
    if (!token) throw new Error('No token');

    const headers = {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
    };

    if (typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${ADMIN_API}${endpoint}`, { ...options, headers });

    if (res.status === 401 || res.status === 403) {
        handleLogout();
        throw new Error('Session expired');
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
    }

    return res;
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        els.contentArea.innerHTML = `<div class="col-span-full p-8 text-center text-slate-400">${t('admin.loading')}</div>`;
        
        const res = await apiFetch('/sets');
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
    els.saveAllBtn.textContent = t('admin.saving');
    try {
        await apiFetch('/sets', {
            method: 'POST',
            body: JSON.stringify({ sets: currentSets })
        });
        els.saveAllBtn.textContent = t('admin.saved');
        setTimeout(() => { els.saveAllBtn.textContent = t('admin.save'); }, 2000);
        return true;
    } catch (e) {
        alert(e.message);
        els.saveAllBtn.textContent = t('admin.saveError');
        return false;
    }
}

// Render Sets with Drag and Drop hooks
function renderSets(sets) {
    if (!sets.length) {
        els.contentArea.innerHTML = `<div class="col-span-full p-8 text-center text-slate-400">${t('admin.empty')}</div>`;
        return;
    }

    els.contentArea.innerHTML = sets.map((set, i) => `
        <div draggable="true" data-id="${set.id}" class="set-card flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-900/50 p-5 shadow-lg relative hover:border-white/20 transition cursor-grab active:cursor-grabbing">
            <div class="pointer-events-none absolute right-4 top-4 text-slate-500 opacity-50"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10h10V8H7v2zm0 6h10v-2H7v2z"/></svg></div>
            <div class="flex-1 space-y-2 pointer-events-none">
                <div class="flex justify-between items-center text-xs">
                   <span class="uppercase tracking-widest text-brand">${set.type || 'Category'}</span>
                   <span class="text-slate-500">${t('admin.order', { n: i + 1 })}</span>
                </div>
                <h3 class="text-lg font-semibold text-white pointer-events-none">${set.title}</h3>
                <p class="text-sm text-slate-400 pointer-events-none line-clamp-2">${set.description || t('admin.noDesc')}</p>
            </div>
            <div class="flex justify-between pt-4 border-t border-white/5">
                <span class="text-xs text-slate-500">${t('admin.images', { n: set.images?.length || 0 })}</span>
                <button onclick="editSet('${set.id}')" class="text-xs font-semibold text-brand hover:text-white pointer-events-auto cursor-pointer relative z-10 px-2 py-1 -mr-2">${t('admin.edit')}</button>
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

const MAX_HOME_SELECTOR = 1;
const MAX_PAGE_HERO = 4;

function attrPath(path) {
    return String(path).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function countKeyed(type, key) {
    const seen = new Set();
    currentSets.filter((item) => item.type === type).forEach((item) => {
        (Array.isArray(item[key]) ? item[key] : []).forEach((path) => seen.add(path));
        if (key === 'categoryHeroImages' && item.categoryHeroImage) {
            seen.add(item.categoryHeroImage);
        }
    });
    return seen.size;
}

function renderCoverSelection(set) {
    if (!set || !set.images || set.images.length === 0) {
        els.coverSelectionArea.classList.add('hidden');
        els.coverGrid.innerHTML = '';
        return;
    }

    set.featuredImages = set.featuredImages || [];
    set.homeSelectorImages = set.homeSelectorImages || [];
    set.categoryHeroImages = set.categoryHeroImages || (set.categoryHeroImage ? [set.categoryHeroImage] : []);

    els.coverSelectionArea.classList.remove('hidden');
    els.coverGrid.innerHTML = set.images.map((imgPath, index) => {
        const safe = attrPath(imgPath);
        const isCover = index === 0;
        const isFeatured = set.featuredImages.includes(imgPath);
        const isHome = set.homeSelectorImages.includes(imgPath);
        const thumb = `/media/${imgPath.replace('/full/', '/thumbnails/')}`;

        return `
        <div class="flex flex-col rounded-xl overflow-hidden border-2 bg-slate-950 ${isCover ? 'border-brand' : 'border-white/10'}">
            <button type="button" class="relative aspect-square" onclick="setCoverImage(event, '${safe}')" title="${t('admin.coverTitle')}">
                <img src="${thumb}" alt="" class="w-full h-full object-cover">
                ${isCover ? `<span class="absolute top-2 left-2 text-[10px] font-bold bg-brand text-slate-950 px-1.5 py-0.5 rounded">${t('admin.cover')}</span>` : ''}
            </button>
            <div class="flex flex-col gap-1 p-2">
                <button type="button" onclick="toggleFeaturedImage(event, '${safe}')" class="w-full py-2 text-xs rounded ${isFeatured ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-300'}" title="${t('admin.gridTitle')}">${t('admin.grid')}</button>
                <button type="button" data-home-path="${safe}" onclick="toggleHomeSelector(event, '${safe}')" class="w-full py-2 text-xs rounded ${isHome ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}" title="${t('admin.homeTitle')}">${t('admin.home')}</button>
            </div>
        </div>
        `;
    }).join('');

    els.coverGrid.querySelectorAll("[data-home-path]").forEach((btn) => {
        const path = btn.getAttribute("data-home-path");
        const probe = new Image();
        probe.onload = () => {
            if (probe.naturalWidth <= probe.naturalHeight) {
                btn.disabled = true;
                btn.classList.add("opacity-40", "cursor-not-allowed");
                btn.title = t('admin.homeNeedsLandscape');
            }
        };
        probe.src = `/media/${path}`;
    });
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
    saveAllData();
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
    saveAllData();
}

function toggleHeroImage(e, imgPath) {
    e.preventDefault();
    if (!activeEditSetId) return;
    const set = currentSets.find(s => s.id === activeEditSetId);
    if (!set) return;

    set.categoryHeroImages = set.categoryHeroImages || [];
    const idx = set.categoryHeroImages.indexOf(imgPath);
    if (idx > -1) {
        set.categoryHeroImages.splice(idx, 1);
    } else if (countKeyed(set.type, 'categoryHeroImages') >= MAX_PAGE_HERO) {
        alert(t('admin.heroLimit', { n: MAX_PAGE_HERO }));
        return;
    } else {
        set.categoryHeroImages.push(imgPath);
    }

    const first = set.categoryHeroImages[0] || null;
    currentSets.forEach((other) => {
        if (other.type === set.type && other.id !== set.id) {
            other.categoryHeroImage = other.categoryHeroImages?.[0] || null;
        }
    });
    set.categoryHeroImage = first;

    renderCoverSelection(set);
    saveAllData();
}

function toggleHomeSelector(e, imgPath) {
    e.preventDefault();
    if (!activeEditSetId) return;
    const set = currentSets.find(s => s.id === activeEditSetId);
    if (!set) return;

    set.homeSelectorImages = set.homeSelectorImages || [];
    const idx = set.homeSelectorImages.indexOf(imgPath);
    if (idx > -1) {
        set.homeSelectorImages.splice(idx, 1);
        renderCoverSelection(set);
        saveAllData();
        return;
    }

    const probe = new Image();
    probe.onload = () => {
        if (probe.naturalWidth <= probe.naturalHeight) {
            alert(t('admin.homeLandscape'));
            return;
        }
        currentSets.forEach((other) => {
            if (other.type === set.type) other.homeSelectorImages = [];
        });
        set.homeSelectorImages = [imgPath];
        renderCoverSelection(set);
        saveAllData();
    };
    probe.onerror = () => {
        alert(t('admin.readFail'));
    };
    probe.src = `/media/${imgPath}`;
}

function editSet(id) {
    const set = currentSets.find(s => s.id === id);
    if (!set) return;
    
    activeEditSetId = id;
    els.modalHeading.textContent = t('admin.editHeading');
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
    els.modalHeading.textContent = t('admin.createHeading');
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
    if(!confirm(t('admin.confirmDelete'))) return;
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

async function saveModalChanges() {
    if (!activeEditSetId) return;

    if (activeEditSetId === 'NEW') {
        const title = els.modalTitle.value;
        const slug = els.modalSlug.value || title.toLowerCase().replace(/\s+/g, '-');
        const type = els.modalType.value;
        if (!title || !slug) return alert(t('admin.needTitleSlug'));

        const created = {
            id: Date.now().toString(),
            type,
            slug,
            title,
            description: els.modalDesc.value,
            order: currentSets.length + 1,
            images: []
        };
        currentSets.push(created);
        renderSets(currentSets);
        const saved = await saveAllData();
        if (saved) {
            editSet(created.id);
        } else {
            closeModal();
        }
        return;
    }

    const targetSet = currentSets.find(s => s.id === activeEditSetId);
    if (!targetSet) return;
    targetSet.title = els.modalTitle.value;
    targetSet.description = els.modalDesc.value;

    closeModal();
    renderSets(currentSets);
    await saveAllData();
}

// Upload Logic

// Helper function to resize images locally in the browser
function processImageLocally(file, maxSize, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            let { width, height } = img;

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

            const baseName = (file.name.substring(0, file.name.lastIndexOf('.')) || file.name)
                .replace(/[^\w-]+/g, '-')
                .toLowerCase();

            const finish = (blob, ext, mime) => {
                if (!blob) {
                    reject(new Error('Canvas to Blob failed'));
                    return;
                }
                resolve(new File([blob], `${baseName}.${ext}`, { type: mime }));
            };

            canvas.toBlob((blob) => {
                if (blob) {
                    finish(blob, 'webp', 'image/webp');
                    return;
                }
                canvas.toBlob((jpegBlob) => {
                    finish(jpegBlob, 'jpg', 'image/jpeg');
                }, 'image/jpeg', quality);
            }, 'image/webp', quality);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image load failed'));
        };
        img.src = objectUrl;
    });
}

async function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeEditSetId || activeEditSetId === 'NEW') return;

    const set = currentSets.find(s => s.id === activeEditSetId);
    if (!set) return;

    els.uploadStatus.classList.remove('hidden');
    set.images = set.images || [];

    let uploaded = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        els.uploadStatus.textContent = t('admin.processing', { i: i + 1, n: files.length, name: file.name });

        try {
            const fullFile = await processImageLocally(file, 2560, 0.85);
            const thumbFile = await processImageLocally(file, 1200, 0.75);

            const baseFolder = set.type === 'corporate' ? 'corporate' : 'cosplay';
            const ext = fullFile.name.split('.').pop() || 'jpg';
            const cleanName = (file.name.substring(0, file.name.lastIndexOf('.')) || file.name)
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .toLowerCase() || 'photo';
            const slug = String(set.slug || "set")
                .replace(/[^a-zA-Z0-9._-]+/g, "-")
                .replace(/^-+|-+$/g, "") || "set";
            const imgName = `${Date.now()}-${cleanName}.${ext}`;

            const fullPath = `${baseFolder}/featured/${slug}/full/${imgName}`;
            const thumbPath = `${baseFolder}/featured/${slug}/thumbnails/${imgName}`;

            els.uploadStatus.textContent = t('admin.uploading', { i: i + 1, n: files.length });

            const fullFormData = new FormData();
            fullFormData.append('file', fullFile, imgName);
            fullFormData.append('path', fullPath);
            await apiFetch('/upload', { method: 'POST', body: fullFormData });

            const thumbFormData = new FormData();
            thumbFormData.append('file', thumbFile, imgName);
            thumbFormData.append('path', thumbPath);
            await apiFetch('/upload', { method: 'POST', body: thumbFormData });

            set.images.push(fullPath);
            uploaded += 1;
            renderCoverSelection(set);
            renderSets(currentSets);
        } catch (err) {
            console.error(err);
            els.uploadStatus.textContent = t('admin.uploadErr', { name: file.name, error: err.message });
            await new Promise((r) => setTimeout(r, 1800));
        }
    }

    e.target.value = '';

    if (uploaded) {
        await saveAllData();
        els.uploadStatus.textContent = t('admin.uploaded', { n: uploaded });
    }

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

    window.addEventListener('alerego:lang', () => {
        if (window.AleregoI18n) window.AleregoI18n.apply();
        if (!els.dashboardView.classList.contains('hidden-view')) {
            renderSets(currentSets);
            if (activeEditSetId && activeEditSetId !== 'NEW') {
                const set = currentSets.find((item) => item.id === activeEditSetId);
                if (set) renderCoverSelection(set);
            }
        }
    });
}

// Avvia l'applicazione
init();