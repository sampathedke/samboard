(() => {
    'use strict';

    /* ── DOM refs ── */
    const editor     = document.getElementById('editor');
    const slugInput  = document.getElementById('slugInput');
    const goBtn      = document.getElementById('goBtn');
    const saveBtn    = document.getElementById('saveBtn');
    const copyBtn    = document.getElementById('copyBtn');
    const clearBtn   = document.getElementById('clearBtn');
    const statusBar  = document.getElementById('statusBar');
    const charCount  = document.getElementById('charCount');
    const saveStatus = document.getElementById('saveStatus');
    const urlPrefix  = document.getElementById('urlPrefix');

    /* ── State ── */
    // INITIAL_SLUG should be passed from Thymeleaf (e.g., [[${slug}]])
    let currentSlug   = typeof INITIAL_SLUG !== 'undefined' ? INITIAL_SLUG : 'main';
    let autoSaveTimer = null;
    let lastSaved     = editor.value;

    /* ── Init ── */
    // Updated to show the /v/ prefix in the UI
    urlPrefix.textContent = `${location.origin}/v/`; 
    updateCharCount();

    /* ── Helpers ── */
    function updateCharCount() {
        const len = editor.value.length;
        charCount.textContent = len.toLocaleString() + ' char' + (len !== 1 ? 's' : '');
    }

    function showStatus(msg, type = 'saving', duration = 3000) {
        statusBar.textContent = msg;
        statusBar.className   = `status-bar ${type}`;
        statusBar.classList.remove('hidden');
        if (duration) {
            setTimeout(() => statusBar.classList.add('hidden'), duration);
        }
    }

    function setSaveStatus(msg) {
        saveStatus.textContent = msg;
    }

    /* ── Save (AJAX POST) ── */
    function saveContent(slug, content) {
        showStatus('Saving…', 'saving', 0);
        setSaveStatus('saving…');

        const body = new URLSearchParams();
        body.append('content', content);

        // UPDATED ENDPOINT: matches @PostMapping("/api/clipboard/{slug}")
        return fetch(`/api/clipboard/${encodeURIComponent(slug)}`, {
            method : 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body   : body.toString()
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'ok') {
                lastSaved = content;
                showStatus('✓ Saved', 'success');
                setSaveStatus('saved ' + new Date().toLocaleTimeString());
            } else {
                showStatus('✗ ' + (data.message || 'Save failed'), 'error');
                setSaveStatus('save failed');
            }
        })
        .catch(() => {
            showStatus('✗ Network error', 'error');
            setSaveStatus('error');
        });
    }

    /* ── Load (AJAX GET) ── */
    function loadContent(slug) {
        showStatus('Loading…', 'saving', 0);
        
        // UPDATED ENDPOINT: matches @GetMapping("/api/clipboard/{slug}")
        fetch(`/api/clipboard/${encodeURIComponent(slug)}`)
            .then(r => r.json())
            .then(data => {
                editor.value = data.content || '';
                lastSaved    = editor.value;
                updateCharCount();
                currentSlug  = slug;
                
                document.title = `${slug} — SonBoard`;
                
                // UPDATED URL: Changes browser URL to /v/slug
                history.pushState({slug}, '', `/v/${slug}`);
                
                showStatus(
                    data.status === 'empty' ? 'New clipboard — start typing!' : '✓ Loaded',
                    data.status === 'empty' ? 'saving' : 'success'
                );
                setSaveStatus('');
            })
            .catch(() => showStatus('✗ Could not load', 'error'));
    }

    /* ── Auto-save on typing (1.5s debounce) ── */
    editor.addEventListener('input', () => {
        updateCharCount();
        clearTimeout(autoSaveTimer);
        setSaveStatus('unsaved…');
        autoSaveTimer = setTimeout(() => {
            if (editor.value !== lastSaved) {
                saveContent(currentSlug, editor.value);
            }
        }, 1500);
    });

    /* ── Manual save ── */
    saveBtn.addEventListener('click', () => {
        clearTimeout(autoSaveTimer);
        saveContent(currentSlug, editor.value);
    });

    /* ── Ctrl+S / Cmd+S ── */
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            clearTimeout(autoSaveTimer);
            saveContent(currentSlug, editor.value);
        }
    });

    /* ── Navigate to another slug ── */
    function navigateTo(slug) {
        slug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!slug) return;
        slugInput.value = slug;
        loadContent(slug);
    }

    goBtn.addEventListener('click', () => navigateTo(slugInput.value));
    slugInput.addEventListener('keydown', e => { if (e.key === 'Enter') navigateTo(slugInput.value); });

    /* ── Browser back/forward ── */
    window.addEventListener('popstate', e => {
        if (e.state && e.state.slug) {
            slugInput.value = e.state.slug;
            currentSlug     = e.state.slug;
            loadContent(e.state.slug);
        }
    });

    /* ── Copy button ── */
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(editor.value)
            .then(() => showStatus('✓ Copied to clipboard', 'success'))
            .catch(() => showStatus('✗ Copy failed', 'error'));
    });

    /* ── Clear button ── */
    clearBtn.addEventListener('click', () => {
        if (editor.value && confirm('Clear this clipboard?')) {
            editor.value = '';
            updateCharCount();
            setSaveStatus('unsaved…');
        }
    });

    /* ── Push initial history state ── */
    // Ensure the initial state includes the /v/ prefix
    history.replaceState({ slug: currentSlug }, '', `/v/${currentSlug}`);

})();