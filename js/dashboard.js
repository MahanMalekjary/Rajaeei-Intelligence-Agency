import { initApp, logout, getUser } from './app.js';
import { getPeople, deletePerson, getImages } from './storage.js';
import { openModal, closeModal } from './modal.js';
import { formatDate, highlightText, debounce } from './utils.js';
import { fields } from './fields.js';

const user = initApp();
if (!user) throw new Error('Not logged in');

let allData = [];
let currentQuery = '';

document.getElementById('user-name').textContent = user;
document.getElementById('logout-btn').onclick = logout;
document.getElementById('add-btn').onclick = () => openModal();
document.getElementById('modal-close').onclick = closeModal;

async function loadData() {
    const grid = document.getElementById('people-grid');
    grid.innerHTML = Array(6).fill('<div class="card skeleton"><div class="skeleton-img"></div><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>').join('');
    
    try {
        allData = await getPeople(user, currentQuery);
        renderGrid(allData);
        updateStats(allData);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function updateStats(data) {
    document.getElementById('stat-total').textContent = data.length;
    const countries = new Set(data.map(p => p.data.country).filter(Boolean));
    document.getElementById('stat-countries').textContent = countries.size;
}

async function renderGrid(data) {
    const grid = document.getElementById('people-grid');
    grid.innerHTML = '';
    
    for (let person of data) {
        const images = await getImages(person.id);
        const d = person.data;
        const mainImg = images.length > 0 ? images[0].url : 'https://placehold.co/400x500/1a1a2e/e0e0e0?text=No+Image';
        
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => window.location.href = `person.html?id=${person.id}`;
        
        card.innerHTML = `
            <div class="card-image" style="background-image: url(${mainImg})">
                <div class="card-badge">${images.length} 📷</div>
            </div>
            <div class="card-body">
                <h3>${highlightText(d.name || 'Unnamed', currentQuery)}</h3>
                <div class="card-meta">
                    ${d.age ? `<span>${d.age} yrs</span>` : ''}
                    ${d.country ? `<span>📍 ${highlightText(d.country, currentQuery)}</span>` : ''}
                </div>
                ${d.personality ? `<p class="card-desc">${d.personality.substring(0, 50)}...</p>` : ''}
                <div class="card-tags">
                    ${(d.interests || []).slice(0, 2).map(i => `<span class="tag-small">${i}</span>`).join('')}
                </div>
                <div class="card-footer">
                    <span class="card-date">${formatDate(person.created_at)}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    }
}

document.getElementById('search-input').oninput = debounce((e) => {
    currentQuery = e.target.value;
    loadData();
}, 300);

document.getElementById('sort-select').onchange = (e) => {
    const val = e.target.value;
    if (val === 'newest') allData.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (val === 'oldest') allData.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    if (val === 'alpha') allData.sort((a,b) => (a.data.name || '').localeCompare(b.data.name || ''));
    renderGrid(allData);
};

document.addEventListener('dataUpdated', loadData);
loadData();