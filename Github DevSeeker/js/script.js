/**
 * DevSeeker Kinetic Logic - Ultimate Fix
 */

const ui = {
    html: document.documentElement,
    body: document.body,
    input: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    backToHomeBtn: document.getElementById('backToHomeBtn'),
    profileInfo: document.getElementById('profileInfo'),
    contentArea: document.getElementById('contentArea'),
    loader: document.getElementById('loader'),
    
    // Tools
    btnHabits: document.getElementById('btnHabits'),
    btnResume: document.getElementById('btnResume'),
    btnInsights: document.getElementById('btnInsights'),
    
    // Modals
    btnFollowers: document.getElementById('btnFollowers'),
    btnFollowing: document.getElementById('btnFollowing'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    closeModalBtn: document.getElementById('closeModal'),
    
    // Language System
    langBtn: document.getElementById('langBtn')
};

const API = 'https://api.github.com/users/';
let currentLang = 'en';
let currentUser = null;
let currentRepos = [];
let currentEvents = [];
let translations = {};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations('en'); // Default to English
    const savedUser = sessionStorage.getItem('currentGithubUser');
    if (savedUser) {
        search(savedUser);
    } else {
        ui.input.focus();
    }
});

// --- Events ---
ui.searchBtn.addEventListener('click', () => search(ui.input.value));
ui.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') search(ui.input.value); });

// Back to Home Event
ui.backToHomeBtn.addEventListener('click', () => {
    ui.html.classList.add('landing-mode');
    ui.profileInfo.classList.add('hidden');
    ui.contentArea.classList.add('hidden');
    ui.input.value = '';
    sessionStorage.removeItem('currentGithubUser');
    setTimeout(() => ui.input.focus(), 100);
});

// Language Toggle Event
ui.langBtn.addEventListener('click', () => {
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    loadTranslations(newLang);
});

// Modals
ui.btnFollowers.addEventListener('click', () => {
    if(currentUser && currentUser.followers > 0) openList('followers', translations.modalFollowers);
});
ui.btnFollowing.addEventListener('click', () => {
    if(currentUser && currentUser.following > 0) openList('following', translations.modalFollowing);
});

ui.closeModalBtn.addEventListener('click', closeModal);
ui.modal.addEventListener('click', (e) => { if(e.target === ui.modal) closeModal(); });

// Tools
ui.btnHabits.addEventListener('click', showHabits);
ui.btnResume.addEventListener('click', showResume);
ui.btnInsights.addEventListener('click', showInsights);

// --- Core Logic ---

async function search(username) {
    if(!username.trim()) return;

    ui.loader.classList.remove('hidden');
    
    try {
        const [user, repos, events] = await Promise.all([
            fetch(`${API}${username}`).then(r => { if(!r.ok) throw new Error(); return r.json(); }),
            fetch(`${API}${username}/repos?sort=updated&per_page=100`).then(r => r.json()),
            fetch(`${API}${username}/events/public?per_page=50`).then(r => r.json())
        ]);

        currentUser = user;
        currentRepos = repos;
        currentEvents = events;
        
        sessionStorage.setItem('currentGithubUser', username);
        renderUI(user, repos);
        
        // Show Dashboard
        ui.html.classList.remove('landing-mode');
        ui.profileInfo.classList.remove('hidden');
        ui.contentArea.classList.remove('hidden');

    } catch (e) {
        alert(translations.errorNotFound || 'User Not Found');
        sessionStorage.removeItem('currentGithubUser');
    } finally {
        ui.loader.classList.add('hidden');
    }
}

function renderUI(user, repos) {
    // Basic Info
    document.getElementById('avatar').src = user.avatar_url;
    document.getElementById('name').textContent = user.name || user.login;
    document.getElementById('username').textContent = `@${user.login}`;
    document.getElementById('userType').textContent = user.type;
    
    // Bio
    document.getElementById('bio').textContent = user.bio || translations.noBio || 'No Bio';
    
    // Hireable Badge
    const badge = document.getElementById('hireableBadge');
    if(user.hireable) badge.classList.remove('hidden');
    else badge.classList.add('hidden');

    // Meta Data
    setLink('blog', user.blog);
    setLink('twitter', user.twitter_username ? `https://twitter.com/${user.twitter_username}` : null);
    setText('location', user.location);
    setText('company', user.company);
    
    // Age Calculation
    const created = new Date(user.created_at);
    document.getElementById('joined').textContent = created.toLocaleDateString();
    
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365)); 
    document.getElementById('accountAge').textContent = `${diffYears} Years Active`;

    // Stats
    document.getElementById('followers').textContent = formatNum(user.followers);
    document.getElementById('following').textContent = formatNum(user.following);
    
    ui.btnFollowers.style.opacity = user.followers > 0 ? '1' : '0.5';
    ui.btnFollowers.style.cursor = user.followers > 0 ? 'pointer' : 'default';
    
    ui.btnFollowing.style.opacity = user.following > 0 ? '1' : '0.5';
    ui.btnFollowing.style.cursor = user.following > 0 ? 'pointer' : 'default';

    const stars = repos.reduce((a,b) => a + b.stargazers_count, 0);
    document.getElementById('totalStars').textContent = formatNum(stars);

    // Graphs & Lists
    document.getElementById('contribGraph').src = `https://ghchart.rshah.org/${user.login}`;
    renderLangs(repos);
    renderRepos(repos.slice(0, 10));
}

// --- Tools Logic ---

function showHabits() {
    openModal(translations.habitTitle);
    if(currentEvents.length === 0) {
        ui.modalBody.innerHTML = `<p>${translations.noData}</p>`;
        return;
    }
    
    const hours = new Array(24).fill(0);
    currentEvents.forEach(e => hours[new Date(e.created_at).getHours()]++);
    const max = Math.max(...hours);
    
    let html = '<div style="display:flex; align-items:flex-end; height:200px; gap:4px; padding-top:20px;">';
    hours.forEach(h => {
        let pct = max > 0 ? (h/max)*100 : 0;
        html += `<div style="flex:1; background:var(--accent); height:${pct}%; border-radius:2px 2px 0 0; opacity:0.8;"></div>`;
    });
    html += '</div><div style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.8rem; color:#888;"><span>00:00</span><span>12:00</span><span>23:59</span></div>';
    ui.modalBody.innerHTML = html;
}

function showResume() {
    openModal(translations.resumeTitle);
    ui.modalBody.innerHTML = `
        <div style="background:white; color:black; padding:30px; border-radius:5px; font-family:serif;">
            <h1 style="border-bottom:2px solid black; margin-bottom:10px">${currentUser.name || currentUser.login}</h1>
            <p>${currentUser.email || 'No Public Email'} | ${currentUser.location || 'Remote'}</p>
            <br>
            <h3>Summary</h3>
            <p>${currentUser.bio || 'Experienced Developer.'}</p>
            <br>
            <h3>Top Skills</h3>
            <p>${Object.keys(getLangCounts(currentRepos)).slice(0,5).join(', ')}</p>
            <br>
            <button onclick="window.print()" style="margin-top:20px; padding:8px 16px; cursor:pointer; background:#222; color:white; border:none; border-radius:4px;">Print PDF</button>
        </div>
    `;
}

function showInsights() {
    openModal(translations.insightTitle);
    if(currentRepos.length === 0) { ui.modalBody.innerHTML = 'No public repos'; return; }
    
    const stars = currentRepos.reduce((a,b) => a + b.stargazers_count, 0);
    const forks = currentRepos.reduce((a,b) => a + b.forks_count, 0);
    const avg = currentRepos.length > 0 ? (stars / currentRepos.length).toFixed(1) : 0;
    
    ui.modalBody.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; text-align:center;">
            <div style="background:#0d1117; padding:20px; border-radius:12px; border:1px solid #30363d;">
                <h2 style="color:var(--accent)">${avg}</h2><span>Avg Stars/Repo</span>
            </div>
            <div style="background:#0d1117; padding:20px; border-radius:12px; border:1px solid #30363d;">
                <h2 style="color:var(--accent)">${forks}</h2><span>Total Forks</span>
            </div>
        </div>
        <br>
        <h3 style="border-bottom:1px solid #30363d; padding-bottom:5px; color:white;">Most Active</h3>
        <ul style="list-style:none; margin-top:10px;">
            ${currentRepos.sort((a,b)=> new Date(b.updated_at) - new Date(a.updated_at)).slice(0,3).map(r => `
                <li style="padding:10px; border-bottom:1px solid #30363d; display:flex; justify-content:space-between;">
                    <span style="color:white;">${r.name}</span>
                    <span style="color:#888; font-size:0.8rem;">${new Date(r.updated_at).toLocaleDateString()}</span>
                </li>
            `).join('')}
        </ul>
    `;
}

// --- Utils ---

async function openList(type, title) {
    openModal(title);
    ui.modalBody.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>';
    try {
        const res = await fetch(`${API}${currentUser.login}/${type}?per_page=50`);
        const list = await res.json();
        
        if(list.length === 0) {
            ui.modalBody.innerHTML = '<p style="text-align:center; color:#888;">List is empty</p>';
            return;
        }

        ui.modalBody.innerHTML = '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(80px, 1fr)); gap:15px;"></div>';
        const grid = ui.modalBody.firstElementChild;
        
        list.forEach(u => {
            const d = document.createElement('div');
            d.style.textAlign = 'center';
            d.innerHTML = `
                <img src="${u.avatar_url}" style="width:50px; height:50px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:0.2s;">
                <div style="font-size:0.75rem; overflow:hidden; text-overflow:ellipsis; margin-top:5px; color:var(--text-main);">${u.login}</div>
            `;
            const img = d.querySelector('img');
            img.addEventListener('mouseover', () => img.style.borderColor = 'var(--accent)');
            img.addEventListener('mouseout', () => img.style.borderColor = 'transparent');
            img.addEventListener('click', () => {
                closeModal();
                ui.input.value = u.login;
                search(u.login);
            });
            grid.appendChild(d);
        });
    } catch(e) {
        ui.modalBody.innerHTML = 'Error loading list.';
    }
}

function renderRepos(repos) {
    const list = document.getElementById('repoList');
    list.innerHTML = '';
    repos.forEach(r => {
        list.innerHTML += `
            <div class="repo-item">
                <div class="repo-header">
                    <a href="${r.html_url}" target="_blank" class="repo-name">${r.name}</a>
                </div>
                <div class="repo-meta">
                    <span>${r.language || 'Code'}</span>
                    <span><i class="fa-regular fa-star"></i> ${r.stargazers_count}</span>
                    <span><i class="fa-solid fa-code-branch"></i> ${r.forks_count}</span>
                </div>
            </div>
        `;
    });
}

function renderLangs(repos) {
    const counts = getLangCounts(repos);
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const container = document.getElementById('langList');
    container.innerHTML = '';
    
    let total = 0;
    Object.values(counts).forEach(v => total += v);

    sorted.forEach(([l, c]) => {
        const pct = total > 0 ? ((c/total)*100).toFixed(1) : 0;
        container.innerHTML += `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <span style="width:100px; font-size:0.9rem; color:white;">${l}</span>
                <div style="flex:1; height:8px; background:#21262d; border-radius:4px; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:var(--accent);"></div>
                </div>
                <span style="font-size:0.8rem; color:#888;">${pct}%</span>
            </div>
        `;
    });
}

function getLangCounts(repos) {
    const c = {};
    repos.forEach(r => { if(r.language) c[r.language] = (c[r.language]||0)+1; });
    return c;
}

function openModal(title) {
    ui.modalTitle.textContent = title;
    ui.modal.classList.remove('hidden');
    ui.body.classList.add('modal-open');
}

function closeModal() {
    ui.modal.classList.add('hidden');
    ui.body.classList.remove('modal-open');
}

async function loadTranslations(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    ui.langBtn.textContent = lang === 'en' ? 'AR' : 'EN';

    try {
        // This assumes you have a locales folder with en.json and ar.json
        const res = await fetch(`./locales/${lang}.json`);
        translations = await res.json();

        document.querySelectorAll('[data-i18n]').forEach(el => {
            if(translations[el.dataset.i18n]) el.textContent = translations[el.dataset.i18n];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            if(translations[el.dataset.i18nPlaceholder]) el.placeholder = translations[el.dataset.i18nPlaceholder];
        });
    } catch(e) {
        console.error('Translation missing', e);
    }
    
    if(currentUser) renderUI(currentUser, currentRepos);
}

function formatNum(n) { return new Intl.NumberFormat(currentLang==='ar'?'ar-EG':'en-US', {notation:"compact"}).format(n); }
function setText(id, val) { 
    const el = document.getElementById(id); 
    el.textContent = val || translations.noData || 'N/A'; 
}
function setLink(id, val) {
    const el = document.getElementById(id);
    if(val) { el.href = val; el.textContent = val.replace('https://','').replace('http://',''); el.parentElement.style.opacity = '1'; }
    else { el.textContent = 'N/A'; el.parentElement.style.opacity = '0.5'; el.removeAttribute('href'); }
}

// 3D Parallax Mouse Tracking (Landing Mode Only)
document.addEventListener('mousemove', (e) => {
    if (!ui.html.classList.contains('landing-mode')) return;
    const logo = document.getElementById('landingLogo');
    if (!logo) return;
    const x = (window.innerWidth / 2 - e.pageX) / 25; 
    const y = (window.innerHeight / 2 - e.pageY) / 25;
    logo.style.transform = `perspective(500px) rotateY(${x}deg) rotateX(${-y}deg)`;
});
