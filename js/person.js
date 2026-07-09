import { initApp, getUser } from './app.js';
import { getPersonById, getImages, deletePerson, deleteImage, updateImageOrder, updatePerson } from './storage.js';
import { openModal, closeModal } from './modal.js';
import { formatDate, showToast } from './utils.js';
import { fields } from './fields.js';

const user = initApp();
const params = new URLSearchParams(window.location.search);
const id = params.get('id');

if (!id) window.location.href = 'index.html';

let currentPerson = null;
let currentImages = [];

async function loadPerson() {
    try {
        currentPerson = await getPersonById(id);
        if (currentPerson.owner !== user) {
            showToast('Unauthorized access', 'error');
            window.location.href = 'index.html';
            return;
        }
        currentImages = await getImages(id);
        renderDetails();
        renderGallery();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderDetails() {
    const d = currentPerson.data;
    document.getElementById('detail-name').textContent = d.name || 'Unnamed';
    document.getElementById('detail-subtitle').textContent = [d.occupation, d.city, d.country].filter(Boolean).join(' • ');
    
    const fieldsContainer = document.getElementById('detail-fields');
    fieldsContainer.innerHTML = fields.filter(f => f.id !== 'name').map(f => {
        let val = d[f.id];
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'object' && Object.keys(val).length === 0)) return '';
        
        let displayVal = '';
        if (f.type === 'list') displayVal = val.map(v => `<span class="tag-small">${v}</span>`).join('');
        else if (f.type === 'social') displayVal = Object.entries(val).map(([k,v]) => `<a href="${v}" target="_blank" class="social-link">${k}</a>`).join('');
        else displayVal = val;

        return `<div class="detail-group"><h4>${f.label}</h4><div class="detail-value">${displayVal}</div></div>`;
    }).join('');
}

function renderGallery() {
    const gallery = document.getElementById('gallery-grid');
    gallery.innerHTML = '';
    
    currentImages.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.style.backgroundImage = `url(${img.url})`;
        div.draggable = true;
        div.dataset.index = index;
        
        div.ondragstart = (e) => e.dataTransfer.setData('text/plain', index);
        div.ondragover = (e) => e.preventDefault();
        div.ondrop = (e) => handleReorder(e, index);
        
        div.onclick = () => openFullscreen(img.url);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete-img';
        delBtn.innerHTML = '&times;';
        delBtn.onclick = async (e) => {
            e.stopPropagation();
            await deleteImage(img.id, img.url);
            loadPerson();
        };
        div.appendChild(delBtn);
        gallery.appendChild(div);
    });
}

async function handleReorder(e, targetIndex) {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex === targetIndex) return;
    
    const item = currentImages.splice(sourceIndex, 1)[0];
    currentImages.splice(targetIndex, 0, item);
    
    for (let i = 0; i < currentImages.length; i++) {
        await updateImageOrder(currentImages[i].id, i);
    }
    renderGallery();
}

function openFullscreen(url) {
    const fs = document.getElementById('fullscreen-viewer');
    fs.querySelector('img').src = url;
    fs.classList.add('active');
    fs.onclick = () => fs.classList.remove('active');
}

document.getElementById('edit-btn').onclick = () => openModal(id);
document.getElementById('delete-btn').onclick = async () => {
    if(confirm('Are you sure?')) {
        await deletePerson(id);
        window.location.href = 'index.html';
    }
};

document.getElementById('export-json-btn').onclick = () => {
    const blob = new Blob([JSON.stringify(currentPerson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${currentPerson.data.name || 'person'}.json`; a.click();
};

document.getElementById('duplicate-btn').onclick = async () => {
    const { createPerson } = await import('./storage.js');
    const newData = { ...currentPerson.data, name: `${currentPerson.data.name} (Copy)` };
    const newP = await createPerson(user, newData);
    // Optionally copy images (skipped for brevity, requires re-uploading)
    window.location.href = `person.html?id=${newP.id}`;
};

document.addEventListener('dataUpdated', loadPerson);
loadPerson();