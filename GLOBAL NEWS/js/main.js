// State Variables
let currentPage = 0;
const limit = 12;
let isFetching = false;
let hasMore = true;

// DOM Elements
const newsGrid = document.getElementById('news-grid');
const loader = document.getElementById('loader');
const tickerContent = document.getElementById('ticker-content');
const datetimeEl = document.getElementById('datetime');

// Modal Elements
const modal = document.getElementById('news-modal');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalDate = document.getElementById('modal-date');
const modalLink = document.getElementById('modal-link');
const closeBtn = document.querySelector('.close-btn');

// Clock Function
function updateClock() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    datetimeEl.innerHTML = `${dateStr} &nbsp;|&nbsp; <span style="color:#fff; font-weight:bold">${timeStr}</span>`;
}
setInterval(updateClock, 1000);
updateClock();

// Fetch Data from API
async function fetchNews() {
    if (isFetching || !hasMore) return;
    
    isFetching = true;
    loader.classList.add('visible');

    const offset = currentPage * limit;
    // Using Spaceflight News API (Public/Free)
    const url = `https://api.spaceflightnewsapi.net/v4/articles/?limit=${limit}&offset=${offset}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        // Initialize Ticker on first load
        if (currentPage === 0 && data.results.length > 0) {
            initTicker(data.results);
        }

        if (data.results.length === 0) {
            hasMore = false;
        } else {
            renderNews(data.results);
            currentPage++;
        }
    } catch (err) {
        console.error("API Error:", err);
    } finally {
        isFetching = false;
        loader.classList.remove('visible');
    }
}

// Initialize Ticker
function initTicker(articles) {
    const headlines = articles.slice(0, 10).map(art => art.title);
    const repeatedHeadlines = [...headlines, ...headlines]; // Duplicate for smoothness
    
    tickerContent.innerHTML = repeatedHeadlines.map(title => `
        <span class="ticker-item">
            <span class="separator"></span>
            ${title}
        </span>
    `).join('');
}

// Render News Cards
function renderNews(articles) {
    articles.forEach(art => {
        const card = document.createElement('div');
        card.className = 'news-card';
        const img = art.image_url || 'https://via.placeholder.com/400x250?text=News';

        card.innerHTML = `
            <img src="${img}" class="card-img" alt="News" loading="lazy">
            <div class="card-body">
                <h3 class="card-title">${art.title}</h3>
                <p class="card-summary">${art.summary}</p>
            </div>
        `;

        card.addEventListener('click', () => showModal(art));
        newsGrid.appendChild(card);
    });
}

// Infinite Scroll Listener
window.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 200) {
        fetchNews();
    }
});

// Modal Logic
function showModal(art) {
    modalImg.src = art.image_url;
    modalTitle.textContent = art.title;
    modalDesc.textContent = art.summary;
    modalDate.textContent = new Date(art.published_at).toLocaleDateString();
    modalLink.href = art.url;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

const closeModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
};

closeBtn.onclick = closeModal;
window.onclick = (e) => { if (e.target == modal) closeModal(); };

// Init App
fetchNews();
