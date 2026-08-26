let searchQuery = '';
let activeGenre = 'All';
let activeSuggestion = -1;
let songs = [];

function initTheme() {
    const button = document.getElementById('themeToggle');
    let storedTheme = null;
    try {
        storedTheme = localStorage.getItem('punkkord-theme');
    } catch (error) {
        console.warn('Preferensi tema tidak dapat dibaca.', error);
    }

    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : (systemDark ? 'dark' : 'light');

    const applyTheme = (theme) => {
        document.documentElement.dataset.theme = theme;
        if (!button) return;
        const dark = theme === 'dark';
        button.setAttribute('aria-pressed', String(dark));
        button.setAttribute('aria-label', dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
        button.setAttribute('title', dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
    };

    applyTheme(initialTheme);
    button?.addEventListener('click', () => {
        const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        try {
            localStorage.setItem('punkkord-theme', nextTheme);
        } catch (error) {
            console.warn('Preferensi tema tidak dapat disimpan.', error);
        }
    });
}

function getSongIndex(song) {
    return songs.indexOf(song);
}

function getDifficulty(song) {
    const chords = new Set(
        (Array.isArray(song.lirik) ? song.lirik : [])
            .map((line) => typeof line.chord === 'string' ? line.chord.trim() : '')
            .filter(Boolean)
    );
    if (chords.size <= 4) return 'Easy';
    if (chords.size <= 7) return 'Intermediate';
    return 'Advanced';
}

function makeReferenceLink(song) {
    const link = document.createElement('a');
    link.className = 'reference-link';
    link.href = `detail.html?id=${getSongIndex(song)}`;
    link.textContent = `${song.artis} - ${song.judul}`;
    return link;
}

function renderReferenceList(container, items) {
    if (!container) return;
    container.replaceChildren();
    items.forEach((item) => container.appendChild(makeReferenceLink(item)));
}

function renderLatestSongRow(song) {
    const row = document.createElement('a');
    row.className = 'song-row';
    row.href = `detail.html?id=${getSongIndex(song)}`;

    const main = document.createElement('span');
    main.className = 'song-main';
    const title = document.createElement('span');
    title.className = 'song-title';
    title.textContent = song.judul;
    const artist = document.createElement('span');
    artist.className = 'song-artist';
    artist.textContent = song.artis;
    main.append(title, artist);

    const difficulty = document.createElement('span');
    difficulty.className = 'song-meta';
    difficulty.textContent = getDifficulty(song);

    const key = document.createElement('span');
    key.className = 'song-key';
    key.textContent = song.kunci || '—';

    const arrow = document.createElement('span');
    arrow.className = 'song-arrow';
    arrow.textContent = '→';
    arrow.setAttribute('aria-hidden', 'true');

    row.append(main, difficulty, key, arrow);
    return row;
}

function renderSearchRows(filtered) {
    const container = document.getElementById('songList');
    if (!container) return;
    container.replaceChildren();
    if (!filtered.length) {
        const empty = document.createElement('p');
        empty.className = 'loading-state';
        empty.textContent = 'Lagu tidak ditemukan.';
        container.appendChild(empty);
        return;
    }
    filtered.forEach((song) => container.appendChild(renderLatestSongRow(song)));
}

function matchesGenre(song) {
    const genre = typeof song.genre === 'string' ? song.genre.toLowerCase() : '';
    return activeGenre === 'All' || genre.includes(activeGenre.toLowerCase());
}

function renderHomepage() {
    renderSearchRows(songs.filter(matchesGenre));
    renderReferenceList(document.getElementById('newSongList'), songs.slice(-5).reverse());
    renderReferenceList(document.getElementById('popularSongList'), songs.slice(0, 5));
    const latestCount = document.getElementById('latestCount');
    if (latestCount) latestCount.textContent = `${songs.filter(matchesGenre).length} lagu`;
}

function closeSearchResults() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    activeSuggestion = -1;
    if (input) input.setAttribute('aria-activedescendant', '');
    if (input) input.setAttribute('aria-expanded', 'false');
    if (results) results.hidden = true;
}

function renderSearchResults(filtered) {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    if (!results) return;
    results.replaceChildren();
    activeSuggestion = -1;
    if (input) input.setAttribute('aria-activedescendant', '');
    if (searchQuery.length < 2) {
        closeSearchResults();
        return;
    }
    filtered.slice(0, 6).forEach((song, index) => {
        const option = document.createElement('a');
        option.id = `search-option-${index}`;
        option.className = 'search-option';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.href = `detail.html?id=${getSongIndex(song)}`;
        option.textContent = `${song.judul} — ${song.artis}`;
        option.addEventListener('click', closeSearchResults);
        results.appendChild(option);
    });
    if (!filtered.length) {
        const empty = document.createElement('p');
        empty.className = 'search-empty';
        empty.setAttribute('role', 'status');
        empty.textContent = 'Lagu tidak ditemukan';
        results.appendChild(empty);
    }
    results.hidden = false;
    if (input) input.setAttribute('aria-expanded', 'true');
}

function filterHomepage() {
    if (!document.getElementById('songList')) return;
    const query = searchQuery.toLowerCase();
    const filtered = songs.filter((song) => {
        const title = typeof song.judul === 'string' ? song.judul.toLowerCase() : '';
        const artist = typeof song.artis === 'string' ? song.artis.toLowerCase() : '';
        return matchesGenre(song) && (!query || title.includes(query) || artist.includes(query));
    });

    if (searchQuery.length >= 2) {
        renderSearchRows(filtered);
        renderSearchResults(filtered);
    } else {
        renderHomepage();
        const results = document.getElementById('searchResults');
        if (results) results.hidden = true;
    }
}

function initMobileMenu() {
    const button = document.querySelector('.mobile-menu-button');
    const nav = document.getElementById('mobileNav');
    if (!button || !nav) return;
    button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!open));
        button.setAttribute('aria-label', open ? 'Buka menu' : 'Tutup menu');
        nav.hidden = open;
    });
    nav.addEventListener('click', () => {
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Buka menu');
        nav.hidden = true;
    });
}

function initHomepageInteractions() {
    const input = document.getElementById('searchInput');
    const form = document.getElementById('headerSearchForm');
    if (!input) return;

    const incomingQuery = new URLSearchParams(window.location.search).get('q');
    if (incomingQuery) {
        input.value = incomingQuery;
        searchQuery = incomingQuery.trim();
    }

    input.addEventListener('input', () => {
        searchQuery = input.value.trim();
        activeSuggestion = -1;
        input.setAttribute('aria-activedescendant', '');
        filterHomepage();
    });
    input.addEventListener('keydown', (event) => {
        const results = document.getElementById('searchResults');
        const options = results ? [...results.querySelectorAll('[role="option"]')] : [];
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!options.length) return;
            event.preventDefault();
            if (activeSuggestion < 0) {
                activeSuggestion = event.key === 'ArrowDown' ? 0 : options.length - 1;
            } else {
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                activeSuggestion = (activeSuggestion + direction + options.length) % options.length;
            }
            options.forEach((option, index) => {
                const selected = index === activeSuggestion;
                option.setAttribute('aria-selected', String(selected));
            });
            input.setAttribute('aria-activedescendant', options[activeSuggestion].id);
            return;
        }
        if (event.key === 'Enter' && activeSuggestion >= 0 && options[activeSuggestion]) {
            event.preventDefault();
            options[activeSuggestion].click();
            return;
        }
        if (event.key === 'Escape') {
            input.value = '';
            searchQuery = '';
            filterHomepage();
            closeSearchResults();
        }
    });
    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        filterHomepage();
        closeSearchResults();
        document.getElementById('song-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.querySelectorAll('[data-genre]').forEach((button) => {
        button.addEventListener('click', () => {
            activeGenre = button.dataset.genre || 'All';
            document.querySelectorAll('[data-genre]').forEach((item) => {
                item.classList.toggle('active', item === button);
                item.setAttribute('aria-pressed', String(item === button));
            });
            filterHomepage();
        });
    });
    document.addEventListener('click', (event) => {
        const results = document.getElementById('searchResults');
        if (results && !event.target.closest('.header-search') && !event.target.closest('.search-results')) closeSearchResults();
    });
}

async function loadSongs() {
    const needsSongData = document.getElementById('songList') || document.getElementById('judulLagu');
    if (!needsSongData) return;

    try {
        const response = await fetch('data/songs.json');
        if (!response.ok) throw new Error('Gagal memuat data lagu');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Format data lagu tidak valid');
        songs = data;
        if (document.getElementById('songList')) filterHomepage();
        initDetailPage();
    } catch (error) {
        console.error(error);
        const target = document.getElementById('songList') || document.getElementById('lirik');
        if (target) target.textContent = 'Gagal memuat data lagu.';
    }
}

initTheme();
initMobileMenu();
initHomepageInteractions();
loadSongs();

/* ===== HALAMAN DETAIL ===== */
function initDetailPage() {
    const titleElement = document.getElementById('judulLagu');
    if (!titleElement) return;
    const params = new URLSearchParams(window.location.search);
    const index = Number(params.get('id'));
    const song = Number.isInteger(index) && index >= 0 ? songs[index] : null;
    if (!song) {
        titleElement.textContent = 'Lagu tidak ditemukan';
        const artist = document.getElementById('artisLagu');
        if (artist) artist.textContent = '';
        document.querySelector('.control-bar')?.setAttribute('hidden', 'true');
        return;
    }

    titleElement.textContent = song.judul;
    const artistElement = document.getElementById('artisLagu');
    if (artistElement) artistElement.textContent = song.artis;
    const meta = document.querySelectorAll('.detail-meta span');
    if (meta[0]) meta[0].textContent = getDifficulty(song);
    if (meta[1]) meta[1].textContent = song.genre || 'Guitar';
    if (meta[2]) meta[2].textContent = `Original key: ${song.kunci || 'C'}`;
    const relatedSongs = songs.filter((candidate) => candidate !== song && candidate.genre === song.genre).slice(0, 5);
    renderReferenceList(document.getElementById('relatedSongs'), relatedSongs);

    let offset = 0;
    const originalKey = song.kunci || 'C';
    const keyDisplay = document.getElementById('keyNow');
    if (keyDisplay) keyDisplay.textContent = originalKey;
    const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const enharmonic = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

    function transposeChord(chord) {
        if (!chord) return '';
        return chord.replace(/[A-G](?:#|b)?/g, (root) => {
            const normalized = enharmonic[root] || root;
            const rootIndex = chromatic.indexOf(normalized);
            if (rootIndex < 0) return root;
            return chromatic[(rootIndex + offset + 12) % 12];
        });
    }

    function renderLyrics() {
        const container = document.getElementById('lirik');
        if (!container) return;
        container.replaceChildren();
        (Array.isArray(song.lirik) ? song.lirik : []).forEach((line) => {
            const row = document.createElement('div');
            row.className = 'baris-lirik';
            const chord = document.createElement('span');
            chord.className = 'chord-lirik';
            chord.textContent = transposeChord(line.chord) || '\u00A0';
            const text = document.createElement('span');
            text.className = 'teks-lirik';
            text.textContent = line.teks;
            row.append(chord, text);
            container.appendChild(row);
        });
    }

    renderLyrics();
    document.getElementById('plus')?.addEventListener('click', () => {
        offset = (offset + 1) % 12;
        renderLyrics();
        if (keyDisplay) keyDisplay.textContent = transposeChord(originalKey);
    });
    document.getElementById('minus')?.addEventListener('click', () => {
        offset = (offset - 1 + 12) % 12;
        renderLyrics();
        if (keyDisplay) keyDisplay.textContent = transposeChord(originalKey);
    });
    document.getElementById('reset')?.addEventListener('click', () => {
        offset = 0;
        renderLyrics();
        if (keyDisplay) keyDisplay.textContent = originalKey;
    });

    const scrollButton = document.getElementById('toggleScroll');
    const slowButton = document.getElementById('scrollSlow');
    const fastButton = document.getElementById('scrollFast');
    const speedDisplay = document.getElementById('speedDisplay');
    let scrolling = false;
    let frame = null;
    let lastTime = 0;
    let speed = 1;

    function updateScrollButton() {
        if (!scrollButton) return;
        scrollButton.classList.toggle('scrolling', scrolling);
        scrollButton.textContent = scrolling ? '⏸ Pause Scroll' : '▶ Autoscroll';
        scrollButton.setAttribute('aria-pressed', String(scrolling));
    }
    function stopScroll() {
        scrolling = false;
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        lastTime = 0;
        updateScrollButton();
    }
    function scrollFrame(time) {
        if (!scrolling) return;
        const elapsed = lastTime ? time - lastTime : 16;
        lastTime = time;
        window.scrollBy(0, speed * elapsed / 16);
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 20) {
            stopScroll();
            return;
        }
        frame = requestAnimationFrame(scrollFrame);
    }
    scrollButton?.addEventListener('click', () => {
        if (scrolling) stopScroll();
        else {
            scrolling = true;
            lastTime = 0;
            updateScrollButton();
            frame = requestAnimationFrame(scrollFrame);
        }
    });
    slowButton?.addEventListener('click', () => {
        if (speed > 1) speed--;
        if (speedDisplay) speedDisplay.textContent = `${speed}x`;
    });
    fastButton?.addEventListener('click', () => {
        if (speed < 5) speed++;
        if (speedDisplay) speedDisplay.textContent = `${speed}x`;
    });
}
