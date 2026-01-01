/**
 * Language Handler Module
 * Handles translation fetching, RTL toggling, and persistence.
 */

const LangHandler = {
    currentLang: localStorage.getItem('appLang') || 'en',
    translations: {},

    // Initialize Language System
    async init() {
        await this.loadLanguage(this.currentLang);
        this.updateUI();
        this.setupEventListeners();
    },

    // Fetch JSON Data
    async loadLanguage(lang) {
        try {
            // Note: Use a local server (e.g., Live Server) to avoid CORS with file://
            const rootPath = window.location.pathname.includes('/html/') ? '../' : '';
            const response = await fetch(`${rootPath}lang/${lang}.json`);
            this.translations = await response.json();
            this.currentLang = lang;
            localStorage.setItem('appLang', lang);
            
            // Update Document Direction
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
            
            if (lang === 'ar') document.body.classList.add('rtl');
            else document.body.classList.remove('rtl');

        } catch (error) {
            console.error('Language loading failed:', error);
        }
    },

    // Update Text Content on Page
    updateUI() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[key]) {
                // Handle inputs placeholders vs text content
                if (el.tagName === 'INPUT') el.placeholder = this.translations[key];
                else el.textContent = this.translations[key];
            }
        });
    },

    // Toggle Language (EN <-> AR)
    async toggleLanguage() {
        const newLang = this.currentLang === 'en' ? 'ar' : 'en';
        await this.loadLanguage(newLang);
        this.updateUI();
        
        // Update Toggle Button Icon/Text if needed
        const btn = document.getElementById('langToggleGlobal');
        if(btn) btn.textContent = newLang.toUpperCase();
        
        // Reload page to refresh specific API data if needed
        // window.location.reload(); 
    },

    // Setup Toggle Button Listener
    setupEventListeners() {
        const btn = document.getElementById('langToggleGlobal');
        if (btn) {
            btn.textContent = this.currentLang.toUpperCase();
            btn.addEventListener('click', () => this.toggleLanguage());
        }
    },

    // Get current configured locale for Voice API
    getVoiceLocale() {
        return this.currentLang === 'ar' ? 'ar-EG' : 'en-US';
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => LangHandler.init());