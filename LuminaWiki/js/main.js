document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Logic ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if(savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.querySelector('#themeToggle i').className = 'fas fa-sun';
    }

    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        document.querySelector('#themeToggle i').className = isLight ? 'fas fa-sun' : 'fas fa-moon';
    });

    // --- DOM Elements ---
    const searchInput = document.getElementById('searchInput');
    const suggestionsBox = document.getElementById('suggestionsBox');
    const lensBtn = document.getElementById('lensBtn');
    
    // --- Smart Search Logic ---
    const performSearch = () => {
        const query = searchInput.value.trim();
        if(query) {
            // Detect input language via Regex
            const isArabicText = /[\u0600-\u06FF]/.test(query);
            // Search target follows the input text, not the UI
            const targetLang = isArabicText ? 'ar' : 'en';
            
            addToHistory(query, targetLang);
            window.location.href = `html/details.html?q=${encodeURIComponent(query)}&lang=${targetLang}`;
        }
    };

    lensBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') performSearch(); });

    // --- Autocomplete Logic ---
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);
        if (query.length < 2) { suggestionsBox.classList.add('hidden'); return; }

        debounceTimer = setTimeout(() => {
            // Suggestion API also follows input text language
            const isArabicText = /[\u0600-\u06FF]/.test(query);
            const apiLang = isArabicText ? 'ar' : 'en';

            fetch(`https://${apiLang}.wikipedia.org/w/api.php?action=opensearch&search=${query}&limit=5&format=json&origin=*`)
                .then(res => res.json())
                .then(data => showSuggestions(data[1], apiLang));
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            suggestionsBox.classList.add('hidden');
        }
    });

    function showSuggestions(titles, lang) {
        if (!titles.length) return;
        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.remove('hidden');
        titles.forEach(title => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = title;
            div.onclick = () => {
                addToHistory(title, lang);
                window.location.href = `html/details.html?q=${encodeURIComponent(title)}&lang=${lang}`;
            };
            suggestionsBox.appendChild(div);
        });
    }

    // --- Library & History ---
    const libraryList = document.getElementById('libraryList');
    const librarySection = document.getElementById('librarySection');
    const historyList = document.getElementById('historyList');
    const historySection = document.getElementById('historySection');

    function renderLibrary() {
        const library = JSON.parse(localStorage.getItem('wikiLibrary') || '[]');
        if (library.length > 0) {
            librarySection.classList.remove('hidden');
            libraryList.innerHTML = '';
            library.forEach((item, index) => {
                const chip = document.createElement('div');
                chip.className = 'history-item';
                chip.innerHTML = `<span onclick="location.href='html/details.html?q=${encodeURIComponent(item.title)}&lang=${item.lang}'">${item.title}</span> <i class="fas fa-trash" data-idx="${index}"></i>`;
                chip.querySelector('.fa-trash').onclick = (e) => {
                    e.stopPropagation();
                    library.splice(index, 1);
                    localStorage.setItem('wikiLibrary', JSON.stringify(library));
                    renderLibrary();
                };
                libraryList.appendChild(chip);
            });
        } else {
            librarySection.classList.add('hidden');
        }
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('wikiHistory') || '[]');
        if (history.length > 0) {
            historySection.classList.remove('hidden');
            historyList.innerHTML = '';
            history.forEach((item, index) => {
                const chip = document.createElement('div');
                chip.className = 'history-item';
                chip.innerHTML = `<span onclick="location.href='html/details.html?q=${encodeURIComponent(item.term)}&lang=${item.lang}'">${item.term}</span> <i class="fas fa-times" data-idx="${index}"></i>`;
                chip.querySelector('.fa-times').onclick = (e) => {
                    e.stopPropagation();
                    history.splice(index, 1);
                    localStorage.setItem('wikiHistory', JSON.stringify(history));
                    renderHistory();
                };
                historyList.appendChild(chip);
            });
        } else {
            historySection.classList.add('hidden');
        }
    }
    
    function addToHistory(term, lang) {
        let history = JSON.parse(localStorage.getItem('wikiHistory') || '[]');
        history = history.filter(h => h.term !== term);
        history.unshift({ term, lang });
        if (history.length > 20) history.pop(); 
        localStorage.setItem('wikiHistory', JSON.stringify(history));
    }

    renderLibrary();
    renderHistory();

    // --- Actions ---
    document.getElementById('randomBtn').onclick = () => {
        // Random search uses UI language preference
        window.location.href = `html/details.html?q=random&lang=${LangHandler.currentLang}&random=true`;
    };
    
    // --- Voice Recognition Logic ---
    if ('webkitSpeechRecognition' in window) {
        const voiceBtn = document.getElementById('voiceBtn');
        const recognition = new webkitSpeechRecognition();
        
        voiceBtn.onclick = () => {
            if(voiceBtn.classList.contains('listening')) {
                recognition.stop();
            } else { 
                // Voice Language = UI Language (Strict)
                const uiLang = LangHandler.currentLang; 
                recognition.lang = uiLang === 'ar' ? 'ar-EG' : 'en-US';
                
                recognition.start(); 
                voiceBtn.classList.add('listening'); 
            }
        };
        
        recognition.onresult = (e) => {
            searchInput.value = e.results[0][0].transcript;
            // After voice input, performSmartSearch handles the text language detection
            performSearch();
        };
        
        recognition.onend = () => voiceBtn.classList.remove('listening');
    }
});
