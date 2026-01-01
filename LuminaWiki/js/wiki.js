document.addEventListener('DOMContentLoaded', () => {
    // --- Initialization ---
    const params = new URLSearchParams(window.location.search);
    
    // contentLang determines which Wikipedia API to query (based on input text)
    const contentLang = params.get('lang') || 'en';
    let query = params.get('q');
    const isRandom = params.get('random');

    if(localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
    document.getElementById('themeToggleDetails').onclick = () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    };

    // --- Data Fetching ---
    if (isRandom) fetchRandom();
    else if (query) fetchArticle(query);
    else window.location.href = '../index.html';

    function fetchRandom() {
        // Use contentLang for the random article
        fetch(`https://${contentLang}.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*`)
            .then(res => res.json())
            .then(data => {
                const title = data.query.random[0].title;
                window.history.pushState({}, '', `?q=${encodeURIComponent(title)}&lang=${contentLang}`);
                fetchArticle(title);
            });
    }

    function fetchArticle(title) {
        // Fetch article content using contentLang
        const url = `https://${contentLang}.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info|langlinks&titles=${title}&inprop=url&pithumbsize=1200&lllimit=50&format=json&origin=*`;
        
        fetch(url).then(res => res.json()).then(data => {
            const page = Object.values(data.query.pages)[0];
            if (!page || page.pageid == -1) { 
                document.getElementById('wikiTitle').textContent = LangHandler.translations['article_not_found']; 
                document.getElementById('loader').classList.add('hidden');
                return; 
            }
            renderPage(page);
            fetchRelated(title);
        });
    }

    // --- Content Rendering ---
    function renderPage(page) {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('content').classList.remove('hidden');

        document.getElementById('wikiTitle').textContent = page.title;
        document.getElementById('wikiImage').src = page.thumbnail ? page.thumbnail.source : 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';
        
        // Display the Content Language, not necessarily the UI language
        document.getElementById('langTag').textContent = contentLang.toUpperCase();

        let html = cleanWikiContent(page.extract);
        const textContainer = document.getElementById('wikiText');
        textContainer.innerHTML = html;

        // Set direction of the Article Content specifically based on contentLang
        textContainer.style.direction = contentLang === 'ar' ? 'rtl' : 'ltr';
        textContainer.style.textAlign = contentLang === 'ar' ? 'right' : 'left';

        const wordCount = textContainer.innerText.split(/\s+/).length;
        const mins = Math.ceil(wordCount / 200);
        document.getElementById('readTime').innerHTML = `<i class="far fa-clock"></i> ${mins} ${LangHandler.translations['read_time'] || 'min'}`;

        const p = document.createElement('div'); p.innerHTML = html;
        const summary = p.querySelector('p') ? p.querySelector('p').innerText.substring(0, 200) + '...' : (LangHandler.translations['no_summary'] || 'No summary');
        document.getElementById('summaryText').textContent = summary;
        // Adjust summary direction
        document.getElementById('quickSummary').style.direction = contentLang === 'ar' ? 'rtl' : 'ltr';

        generateToC(textContainer);
        setupImages(textContainer);
        if(page.langlinks) setupLangSwitcher(page.langlinks);

        checkBookmark(page.title);
        document.getElementById('bookmarkBtn').onclick = () => toggleBookmark(page.title);

        const shareUrl = window.location.href;
        document.getElementById('waShare').href = `https://wa.me/?text=${encodeURIComponent(page.title + " " + shareUrl)}`;
        document.getElementById('fbShare').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    }

    function cleanWikiContent(html) {
        if(!html) return "";
        let div = document.createElement('div');
        div.innerHTML = html;
        div.querySelectorAll('style, .mw-editsection, .reference, table').forEach(el => el.remove());
        return div.innerHTML;
    }

    function generateToC(container) {
        const headers = container.querySelectorAll('h2, h3');
        const tocList = document.getElementById('tocList');
        tocList.innerHTML = '';
        if(headers.length === 0) { document.getElementById('tocSidebar').style.display = 'none'; return; }
        
        headers.forEach((header, index) => {
            header.id = `section-${index}`;
            const li = document.createElement('li');
            li.innerHTML = `<a href="#section-${index}">${header.innerText}</a>`;
            tocList.appendChild(li);
        });
        
        tocList.querySelectorAll('a').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // --- Interactive Helpers ---
    function setupImages(container) {
        const images = container.querySelectorAll('img');
        const gallerySec = document.getElementById('gallerySection');
        const lightbox = document.getElementById('lightboxModal');
        const lightboxImg = document.getElementById('lightboxImg');

        document.getElementById('wikiImage').onclick = function() {
            lightboxImg.src = this.src;
            lightbox.classList.remove('hidden');
        };

        if(images.length > 0) {
            gallerySec.classList.remove('hidden');
            gallerySec.innerHTML = '';
            images.forEach(img => {
                const clone = img.cloneNode();
                clone.onclick = () => {
                    lightboxImg.src = clone.src;
                    lightbox.classList.remove('hidden');
                };
                gallerySec.appendChild(clone);
                img.style.cursor = "zoom-in";
                img.onclick = () => {
                    lightboxImg.src = img.src;
                    lightbox.classList.remove('hidden');
                };
            });
        }
        document.getElementById('closeLightbox').onclick = () => lightbox.classList.add('hidden');
        lightbox.onclick = (e) => { if(e.target === lightbox) lightbox.classList.add('hidden'); }
    }

    function setupLangSwitcher(langLinks) {
        const modal = document.getElementById('langModal');
        const list = document.getElementById('langList');
        list.innerHTML = '';
        langLinks.forEach(link => {
            const item = document.createElement('div');
            item.className = 'lang-item';
            item.textContent = `${link.lang.toUpperCase()} - ${link['*']}`;
            item.onclick = () => window.location.href = `details.html?q=${encodeURIComponent(link['*'])}&lang=${link.lang}`;
            list.appendChild(item);
        });
        document.getElementById('langBtn').onclick = () => modal.classList.remove('hidden');
    }

    function checkBookmark(title) {
        const library = JSON.parse(localStorage.getItem('wikiLibrary') || '[]');
        const exists = library.some(i => i.title === title);
        const btn = document.getElementById('bookmarkBtn');
        btn.innerHTML = exists ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';
        btn.classList.toggle('active', exists);
    }

    function toggleBookmark(title) {
        let library = JSON.parse(localStorage.getItem('wikiLibrary') || '[]');
        const idx = library.findIndex(i => i.title === title);
        if (idx > -1) library.splice(idx, 1);
        else library.push({ title, lang: contentLang });
        localStorage.setItem('wikiLibrary', JSON.stringify(library));
        checkBookmark(title);
    }

    // --- Focus Mode & Utilities ---
    const toggleFocus = () => {
        document.body.classList.toggle('focus-mode');
        const btn = document.getElementById('focusBtn');
        const exitBtn = document.getElementById('exitFocusBtn');
        const isFocus = document.body.classList.contains('focus-mode');
        
        btn.innerHTML = isFocus ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
        if (isFocus) exitBtn.classList.remove('hidden');
        else exitBtn.classList.add('hidden');
    };

    document.getElementById('focusBtn').onclick = toggleFocus;
    document.getElementById('exitFocusBtn').onclick = toggleFocus;

    const tooltip = document.getElementById('selTooltip');
    document.addEventListener('mouseup', () => {
        const selection = window.getSelection().toString().trim();
        if (selection.length > 0 && selection.length < 50) {
            const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
            tooltip.style.left = rect.left + window.scrollX + 'px';
            tooltip.style.top = (rect.top + window.scrollY - 40) + 'px';
            tooltip.classList.remove('hidden');
            document.getElementById('selTerm').textContent = selection;
            document.getElementById('selSearchBtn').onclick = () => {
                 // Smart Search from Selection
                 const isAr = /[\u0600-\u06FF]/.test(selection);
                 const sLang = isAr ? 'ar' : 'en';
                 window.open(`details.html?q=${encodeURIComponent(selection)}&lang=${sLang}`, '_blank');
            };
        } else {
            tooltip.classList.add('hidden');
        }
    });

    document.getElementById('fontUpBtn').onclick = () => document.getElementById('wikiText').style.fontSize = '1.4rem';
    document.getElementById('fontDownBtn').onclick = () => document.getElementById('wikiText').style.fontSize = '1rem';
    document.getElementById('shareBtn').onclick = () => document.getElementById('shareModal').classList.remove('hidden');
    document.getElementById('pdfBtn').onclick = () => {
        const element = document.getElementById('printArea');
        html2pdf().from(element).save(document.getElementById('wikiTitle').textContent);
    };
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = function() { this.closest('.modal').classList.add('hidden'); });

    window.onscroll = () => {
        const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        document.getElementById('progressBar').style.width = (window.scrollY / h * 100) + "%";
    };

    // --- Related Articles ---
    function fetchRelated(title) {
        // Query related items using contentLang
        fetch(`https://${contentLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=morelike:${title}&srlimit=4&format=json&origin=*`)
            .then(res => res.json())
            .then(data => {
                const container = document.getElementById('relatedContainer');
                container.innerHTML = '';
                if(data.query.search) {
                    data.query.search.forEach(item => {
                        const card = document.createElement('div');
                        card.className = 'related-card';
                        card.innerText = item.title;
                        card.onclick = () => window.location.href = `details.html?q=${encodeURIComponent(item.title)}&lang=${contentLang}`;
                        container.appendChild(card);
                    });
                }
            });
    }
});