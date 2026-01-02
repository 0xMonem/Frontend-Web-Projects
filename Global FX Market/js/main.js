// Global Variables
let allCurrencies = [];
const apiURL = 'https://api.exchangerate-api.com/v4/latest/USD'; // Free Exchange Rate API
const flagsURL = 'https://restcountries.com/v3.1/all?fields=name,currencies,cca2,flags'; // Countries & Flags API

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    fetchMarketData();
    
    // Search Input Listener
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterData(e.target.value);
    });
});

// --- 1. Clock Function ---
function startClock() {
    function update() {
        const now = new Date();
        document.getElementById('current-time').innerText = now.toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('current-date').innerText = now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    }
    update();
    setInterval(update, 1000);
}

// --- 2. Fetch Data ---
async function fetchMarketData() {
    try {
        // Fetch rates and countries simultaneously
        const [ratesRes, countriesRes] = await Promise.all([
            fetch(apiURL),
            fetch(flagsURL)
        ]);

        const ratesData = await ratesRes.json();
        const countriesData = await countriesRes.json();

        // Process and Merge Data
        processData(ratesData, countriesData);

    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('loader').innerHTML = "<span style='color:red'>Failed to load data. Please check connection.</span>";
    }
}

// --- 3. Process Data ---
function processData(ratesData, countriesData) {
    const rates = ratesData.rates;
    const date = ratesData.date;

    // Create Country Map for Quick Lookup
    const currencyMap = {};
    
    countriesData.forEach(country => {
        if(country.currencies) {
            const code = Object.keys(country.currencies)[0];
            if(code) {
                currencyMap[code] = {
                    countryName: country.name.common,
                    flag: country.flags.png,
                    currencyName: country.currencies[code].name
                };
            }
        }
    });

    // Build Final Currency List
    allCurrencies = Object.keys(rates).map(code => {
        const countryInfo = currencyMap[code] || { 
            countryName: "Global", 
            flag: "https://via.placeholder.com/32x20?text=FX", 
            currencyName: code 
        };

        // Simulate volatility (Free API limitation - Missing Open Price)
        // TODO: Replace with real calculation ((Current - Open) / Open) * 100
        const randomChange = (Math.random() * 2 - 1).toFixed(2); 

        return {
            code: code,
            rate: rates[code],
            change: randomChange,
            country: countryInfo.countryName,
            flag: countryInfo.flag,
            name: countryInfo.currencyName
        };
    });

    // Hide loader and render UI
    document.getElementById('loader').style.display = 'none';
    renderTable(allCurrencies);
    renderTicker(allCurrencies);
}

// --- 4. Render Table ---
function renderTable(data) {
    const tbody = document.getElementById('currency-body');
    tbody.innerHTML = '';

    // Limit to top 150 currencies
    const limitData = data.slice(0, 150);

    limitData.forEach(item => {
        const tr = document.createElement('tr');
        
        // Determine trend colors/icons
        const isPositive = item.change >= 0;
        const changeClass = isPositive ? 'positive' : 'negative';
        const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';

        tr.innerHTML = `
            <td><img src="${item.flag}" alt="${item.code}" class="flag-img" loading="lazy"></td>
            <td>
                <div style="font-weight:bold">${item.name}</div>
                <div style="font-size:0.8rem; color:#64748b">${item.country}</div>
            </td>
            <td><span style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:0.85rem">${item.code}</span></td>
            <td class="price-cell">${item.rate.toFixed(4)}</td>
            <td>
                <span class="${changeClass}">
                    <i class="fa-solid ${icon}"></i> ${Math.abs(item.change)}%
                </span>
            </td>
            <td>
                 <!-- Trend Icon Visualization -->
                 <span style="color:${isPositive ? '#16a34a' : '#dc2626'}">
                    <i class="fa-solid fa-chart-line"></i>
                 </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- 5. Render Ticker ---
function renderTicker(data) {
    const tickerContainer = document.getElementById('ticker-content');
    tickerContainer.innerHTML = '';

    // Major Currencies List
    const topCurrencies = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'EGP', 'SAR', 'AED', 'KWD'];
    
    // Filter for major currencies
    const tickerItems = data.filter(item => topCurrencies.includes(item.code));

    tickerItems.forEach(item => {
        const isPositive = item.change >= 0;
        const colorClass = isPositive ? 'ticker-up' : 'ticker-down';
        const symbol = isPositive ? '▲' : '▼';

        const span = document.createElement('span');
        span.className = 'ticker-item';
        span.innerHTML = `
            ${item.code} 
            <span class="${colorClass}">${item.rate.toFixed(3)} ${symbol} ${Math.abs(item.change)}%</span>
        `;
        tickerContainer.appendChild(span);
    });
}

// --- 6. Search Filter ---
function filterData(query) {
    const lowerQuery = query.toLowerCase();
    const filtered = allCurrencies.filter(item => {
        return (
            item.country.toLowerCase().includes(lowerQuery) ||
            item.name.toLowerCase().includes(lowerQuery) ||
            item.code.toLowerCase().includes(lowerQuery)
        );
    });
    renderTable(filtered);
}
