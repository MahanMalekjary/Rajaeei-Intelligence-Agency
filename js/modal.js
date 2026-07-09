import { fields } from './fields.js';
import { compressImage } from './utils.js';
import { uploadImage, createPerson, updatePerson, getImages, deleteImage } from './storage.js';
import { getUser } from './app.js';
import { showToast } from './utils.js';

function createListInput(field) {
    return `
        <div class="list-input-container" data-field="${field.id}">
            <div class="list-tags"></div>
            <div class="list-input-row">
                <input type="text" placeholder="${field.placeholder}" class="input-field list-input">
                <button type="button" class="btn-icon add-list-item">+</button>
            </div>
        </div>
    `;
}

function createSocialInput(field) {
    return `
        <div class="social-input-container" data-field="${field.id}">
            <div class="social-rows"></div>
            <div class="list-input-row">
                <input type="text" placeholder="Platform (e.g. Twitter)" class="input-field social-key">
                <input type="text" placeholder="URL" class="input-field social-val">
                <button type="button" class="btn-icon add-social-item">+</button>
            </div>
        </div>
    `;
}

function generateFormHTML(data = {}, isEdit = false) {
    return fields.map(f => {
        if (f.type === 'list') return `<div class="form-group" data-id="${f.id}"><label>${f.label}</label>${createListInput(f)}</div>`;
        if (f.type === 'social') return `<div class="form-group" data-id="${f.id}"><label>${f.label}</label>${createSocialInput(f)}</div>`;
        
        let input = '';
        const val = data[f.id] || '';
        if (f.type === 'textarea') input = `<textarea name="${f.id}" placeholder="${f.placeholder}" class="input-field">${val}</textarea>`;
        else if (f.type === 'select') {
            input = `<select name="${f.id}" class="input-field"><option value="">Select...</option>${f.options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
        }
        else input = `<input type="${f.type}" name="${f.id}" value="${val}" placeholder="${f.placeholder}" class="input-field" ${f.required ? 'required' : ''}>`;
        
        return `<div class="form-group" data-id="${f.id}"><label>${f.label}</label>${input}</div>`;
    }).join('');
}

function getDynamicData(form) {
    const data = {};
    new FormData(form).forEach((val, key) => { if(val) data[key] = val; });
    
    form.querySelectorAll('.list-input-container').forEach(container => {
        const key = container.dataset.field;
        const tags = [...container.querySelectorAll('.tag span')].map(t => t.textContent);
        data[key] = tags;
    });

    form.querySelectorAll('.social-input-container').forEach(container => {
        const key = container.dataset.field;
        const objs = {};
        container.querySelectorAll('.social-row').forEach(row => {
            const k = row.querySelector('.s-key').textContent;
            const v = row.querySelector('.s-val').textContent;
            if(k && v) objs[k] = v;
        });
        data[key] = objs;
    });
    return data;
}

function bindDynamicEvents(form) {
    // Lists
    form.querySelectorAll('.add-list-item').forEach(btn => {
        btn.onclick = () => {
            const container = btn.closest('.list-input-container');
            const input = container.querySelector('.list-input');
            if (!input.value.trim()) return;
            const tagsDiv = container.querySelector('.list-tags');
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `<span>${input.value}</span><span class="remove-tag">&times;</span>`;
            tag.querySelector('.remove-tag').onclick = () => tag.remove();
            tagsDiv.appendChild(tag);
            input.value = '';
        };
    });

    // Socials
    form.querySelectorAll('.add-social-item').forEach(btn => {
        btn.onclick = () => {
            const container = btn.closest('.social-input-container');
            const kInput = container.querySelector('.social-key');
            const vInput = container.querySelector('.social-val');
            if (!kInput.value.trim() || !vInput.value.trim()) return;
            const rowsDiv = container.querySelector('.social-rows');
            const row = document.createElement('div');
            row.className = 'social-row';
            row.innerHTML = `<span class="s-key">${kInput.value}</span>: <span class="s-val">${vInput.value}</span> <span class="remove-tag">&times;</span>`;
            row.querySelector('.remove-tag').onclick = () => row.remove();
            rowsDiv.appendChild(row);
            kInput.value = ''; vInput.value = '';
        };
    });
}

function populateDynamicData(form, data) {
    fields.forEach(f => {
        if (f.type === 'list' && Array.isArray(data[f.id])) {
            const tagsDiv = form.querySelector(`.list-input-container[data-field="${f.id}"] .list-tags`);
            data[f.id].forEach(item => {
                const tag = document.createElement('div');
                tag.className = 'tag';
                tag.innerHTML = `<span>${item}</span><span class="remove-tag">&times;</span>`;
                tag.querySelector('.remove-tag').onclick = () => tag.remove();
                tagsDiv.appendChild(tag);
            });
        }
        if (f.type === 'social' && typeof data[f.id] === 'object') {
            const rowsDiv = form.querySelector(`.social-input-container[data-field="${f.id}"] .social-rows`);
            Object.entries(data[f.id]).forEach(([k, v]) => {
                const row = document.createElement('div');
                row.className = 'social-row';
                row.innerHTML = `<span class="s-key">${k}</span>: <span class="s-val">${v}</span> <span class="remove-tag">&times;</span>`;
                row.querySelector('.remove-tag').onclick = () => row.remove();
                rowsDiv.appendChild(row);
            });
        }
    });
}

export function openModal(personId = null) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('person-form');
    const imageDropZone = document.getElementById('image-drop-zone');
    let uploadedImages = [];
    
    form.innerHTML = generateFormHTML();
    form.dataset.personId = personId || '';
    title.textContent = personId ? 'Edit Person' : 'Add New Person';
    
    bindDynamicEvents(form);

    if (personId) {
        // Fetch and populate
        getPersonById(personId).then(p => {
            populateDynamicData(form, p.data);
        });
    }

    // Image Handling
    imageDropZone.querySelectorAll('.preview-img').forEach(e => e.remove());
    
    imageDropZone.ondragover = (e) => { e.preventDefault(); imageDropZone.classList.add('drag-over'); };
    imageDropZone.ondragleave = () => imageDropZone.classList.remove('drag-over');
    imageDropZone.onclick = () => document.getElementById('file-input').click();
    
    document.getElementById('file-input').onchange = (e) => handleFiles(e.target.files);
    imageDropZone.ondrop = (e) => { e.preventDefault(); imageDropZone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); };

    async function handleFiles(files) {
        for (let file of files) {
            if (!file.type.startsWith('image/')) continue;
            const compressed = await compressImage(file);
            const src = URL.createObjectURL(compressed);
            const img = document.createElement('div');
            img.className = 'preview-img';
            img.style.backgroundImage = `url(${src})`;
            img.innerHTML = '<span class="remove-img">&times;</span>';
            img.querySelector('.remove-img').onclick = (e) => { e.stopPropagation(); img.remove(); };
            imageDropZone.appendChild(img);
            uploadedImages.push(compressed);
        }
    }

    modal.classList.add('active');

    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('modal-submit');
        btn.disabled = true;
        btn.textContent = 'Saving...';
        
        try {
            const data = getDynamicData(form);
            let pid = personId;

            if (personId) {
                await updatePerson(personId, data);
            } else {
                const newPerson = await createPerson(getUser(), data);
                pid = newPerson.id;
            }

            // Upload Images
            for (let imgBlob of uploadedImages) {
                await uploadImage(pid, imgBlob);
            }

            modal.classList.remove('active');
            document.dispatchEvent(new CustomEvent('dataUpdated'));
            showToast(personId ? 'Updated successfully' : 'Created successfully');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Person';
        }
    };
}

export function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

// Make getPersonById available for modal
import { getPersonById } from './storage.js';