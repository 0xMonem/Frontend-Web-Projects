// Config
const API_URL = 'https://api.coingecko.com/api/v3';
let currentPage = 1;
const perPage = 50;
const totalPages = 60;
let autoRefreshTimer = null;

// DOM Elements
const tableBody = document.getElementById('crypto-body');
const globalCoinsEl = document.getElementById('global-coins-count');
const tickerContent = document.getElementById('ticker-content');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageIndicator = document.getElementById('page-indicator');
const tableContainer = document.querySelector('.table-scroll-container');

// Formatters
const formatUSD = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
const formatCap = (num) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);

// Loader
function showLoader() {
    tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="5">
                <div class="loader-box">
                    <i class="fa-solid fa-circle-notch loader-spin"></i>
                    <span>Loading Market Data...</span>
                </div>
            </td>
        </tr>`;
}

// Global Stats
async function getGlobalStats() {
    try {
        const res = await fetch(`${API_URL}/global`);
        const data = await res.json();
        if(data.data) globalCoinsEl.innerText = data.data.active_cryptocurrencies.toLocaleString();
    } catch(e) { console.error("Global stats error"); }
}

// Main Data Fetcher
async function loadMarket() {
    // Clear existing timer if manual load happens
    if (autoRefreshTimer) clearTimeout(autoRefreshTimer);

    showLoader();
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${currentPage}&sparkline=false&price_change_percentage=24h`);
        
        // Handle Rate Limit (429) or Network Error
        if(!res.ok) throw new Error("API Error");

        const data = await res.json();
        renderTable(data);
        
        // Load ticker only once
        if(currentPage === 1) renderTicker(data.slice(0, 20));

    } catch (error) {
        // Error Handling Logic
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:30px; color:#dc2626; font-weight:600;">
                    <i class="fa-solid fa-triangle-exclamation"></i> 
                    API updates every 30s. Please wait. Auto-reloading...
                </td>
            </tr>`;
        
        // Auto-reload after 30 seconds (Stay on same page)
        autoRefreshTimer = setTimeout(() => {
            loadMarket();
        }, 30000);

    } finally {
        if (!autoRefreshTimer) updatePagination();
    }
}

// Render Table
function renderTable(coins) {
    tableBody.innerHTML = '';
    coins.forEach((coin, index) => {
        const rank = (currentPage - 1) * perPage + (index + 1);
        const change = coin.price_change_percentage_24h || 0;
        const isUp = change >= 0;
        
        const row = `
            <tr>
                <td style="text-align:center; color:#64748b;">${rank}</td>
                <td>
                    <div class="coin-wrapper">
                        <img src="${coin.image}" alt="icon">
                        <div class="coin-name-group">
                            <span class="name-text">${coin.name}</span>
                            <span class="coin-symbol">${coin.symbol}</span>
                        </div>
                    </div>
                </td>
                <td style="font-weight:600;">${formatUSD(coin.current_price)}</td>
                <td>
                    <span class="badge-change ${isUp ? 'bg-up' : 'bg-down'}">
                        <i class="fa-solid ${isUp ? 'fa-caret-up' : 'fa-caret-down'}"></i>
                        ${Math.abs(change).toFixed(2)}%
                    </span>
                </td>
                <td style="color:#475569;">$${formatCap(coin.market_cap)}</td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
    tableContainer.scrollTop = 0;
}

// Render Ticker
function renderTicker(coins) {
    let html = '';
    coins.forEach(c => {
        const change = c.price_change_percentage_24h || 0;
        const color = change >= 0 ? 't-up' : 't-down';
        const sign = change >= 0 ? '+' : '';
        html += `
            <span class="ticker-item">
                <strong style="color:#e2e8f0">${c.symbol.toUpperCase()}</strong> 
                $${c.current_price} 
                <span class="${color}">(${sign}${change.toFixed(2)}%)</span>
            </span>
            <span style="color:#333">|</span>`;
    });
    tickerContent.innerHTML = html + html;
}

// Pagination Logic
function updatePagination() {
    pageIndicator.innerText = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages;
}

function changePage(dir) {
    currentPage += dir;
    loadMarket();
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    getGlobalStats();
    loadMarket();
    
    // Normal Auto Refresh (60s)
    setInterval(() => {
        if (!document.querySelector('.fa-triangle-exclamation')) { 
            loadMarket(); 
        }
    }, 60000);
});
