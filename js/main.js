import {
    filterSongs,
    getDifficulty,
    normalizeSearchQuery,
    getSongHref,
    parseSongReference,
    transposeChord,
} from './core.js';

const state = {
    searchQuery: '',
    activeGenre: 'All',
    activeLetter: '',
    activeSuggestion: -1,
    songs: [],
};

function getSongIndex(song) {
    return state.songs.indexOf(song);
}

function makeReferenceLink(song) {
    const link = document.createElement('a');
    link.className = 'reference-link';
    link.href = getSongHref(song, getSongIndex(song));
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
    row.href = getSongHref(song, getSongIndex(song));

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

function matchesLetter(song) {
    if (!state.activeLetter) return true;
    const firstLetter = song.judul.trim().charAt(0).toUpperCase(); // FIX: judul, bukan artis
    if (state.activeLetter === '0-9') return /\d/.test(firstLetter);
    return firstLetter === state.activeLetter;
}

function getFilteredSongs() {
    return filterSongs(state.songs, state.searchQuery, state.activeGenre).filter(matchesLetter);
}

function markCatalogReady(container) {
    container.classList.remove('is-loading');
    container.setAttribute('aria-busy', 'false');
}

function renderSearchRows(filtered) {
    const container = document.getElementById('songList');
    if (!container) return;
    const ready = state.songs.length > 0;
    container.replaceChildren();
    if (!filtered.length) {
        const empty = document.createElement('p');
        empty.className = 'loading-state';
        empty.textContent = 'Lagu tidak ditemukan.';
        container.appendChild(empty);
        if (ready) markCatalogReady(container);
        return;
    }
    filtered.forEach((song) => container.appendChild(renderLatestSongRow(song)));
    if (ready) markCatalogReady(container);
}

function closeSearchResults() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    state.activeSuggestion = -1;
    input?.setAttribute('aria-activedescendant', '');
    input?.setAttribute('aria-expanded', 'false');
    if (results) results.hidden = true;
}

function renderSearchResults(filtered) {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    if (!results) return;
    results.replaceChildren();
    state.activeSuggestion = -1;
    input?.setAttribute('aria-activedescendant', '');
    if (normalizeSearchQuery(state.searchQuery).length < 2) {
        closeSearchResults();
        return;
    }

    filtered.slice(0, 6).forEach((song, index) => {
        const option = document.createElement('a');
        option.id = `search-option-${index}`;
        option.className = 'search-option';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.href = getSongHref(song, getSongIndex(song));
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
    input?.setAttribute('aria-expanded', 'true');
}

// FIX-003: Popular songs berdasarkan field "popular: true" di JSON,
// fallback ke 4 lagu pertama jika tidak ada yang ditandai.
// Hapus Math.random() views — tidak ada data palsu.
function renderPopularSongRow(song, index) {
    const row = document.createElement('a');
    row.className = 'popular-song-row';
    row.href = getSongHref(song, getSongIndex(song));

    const rank = document.createElement('span');
    rank.className = 'popular-rank';
    rank.textContent = `#${index + 1}`;

    const main = document.createElement('div');
    main.className = 'popular-song-main';
    const title = document.createElement('div');
    title.className = 'popular-song-title';
    title.textContent = song.judul;
    const artist = document.createElement('div');
    artist.className = 'popular-song-artist';
    artist.textContent = song.artis;
    main.append(title, artist);

    const genre = document.createElement('span');
    genre.className = 'popular-genre';
    genre.textContent = song.genre || 'Pop';

    row.append(rank, main, genre);
    return row;
}

function renderPopularSongs() {
    const container = document.getElementById('popularSongsList');
    if (!container || !state.songs.length) return;

    // FIX-003: Cari lagu yang ditandai popular: true
    // Jika tidak ada, fallback ke 4 lagu pertama
    const markedPopular = state.songs.filter((song) => song.popular === true);
    const topSongs = markedPopular.length >= 4
        ? markedPopular.slice(0, 4)
        : state.songs.slice(0, 4);

    container.replaceChildren();
    topSongs.forEach((song, index) => {
        container.appendChild(renderPopularSongRow(song, index));
    });
}

function filterHomepage() {
    if (!document.getElementById('songList')) return;
    const filtered = getFilteredSongs();
    renderSearchRows(filtered);
    renderReferenceList(document.getElementById('newSongList'), state.songs.slice(-5).reverse());
    renderPopularSongs();
    const latestCount = document.getElementById('latestCount');
    if (latestCount) latestCount.textContent = `${filtered.length} lagu`;
    if (normalizeSearchQuery(state.searchQuery).length >= 2) renderSearchResults(filtered);
    else closeSearchResults();
}

function updateLetterLinkState(activeValue) {
    document.querySelectorAll('[data-letter]').forEach((link) => {
        const isActive = link.dataset.letter === activeValue;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
    });
}

function updateFilterButtonState(selector, activeValue, datasetKey) {
    document.querySelectorAll(selector).forEach((button) => {
        const isActive = button.dataset[datasetKey] === activeValue;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

function initTheme() {
    const button = document.getElementById('themeToggle');
    let storedTheme = null;
    try {
        storedTheme = localStorage.getItem('powerchord-theme');
    } catch (error) {
        console.warn('Preferensi tema tidak dapat dibaca.', error);
    }
    const initialTheme = storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : 'dark';

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
            localStorage.setItem('powerchord-theme', nextTheme);
        } catch (error) {
            console.warn('Preferensi tema tidak dapat disimpan.', error);
        }
    });
}

// FIX-004: initMobileMenu() dihapus — elemen yang dicari tidak ada di HTML.
// Drawer dihandle via window.toggleDrawer / window.closeDrawer di bawah.
// Hamburger button tetap pakai onclick di HTML untuk kompatibilitas.

function initHomepageInteractions() {
    const input = document.getElementById('searchInput');
    const form = document.getElementById('headerSearchForm');
    if (!input) return;

    const params = new URLSearchParams(window.location.search);
    const incomingQuery = params.get('q');
    const incomingLetter = params.get('letter');
    if (incomingQuery) {
        input.value = incomingQuery;
        state.searchQuery = incomingQuery.trim();
    }
    if (incomingLetter === '0-9' || /^[A-Z]$/.test(incomingLetter || '')) {
        state.activeLetter = incomingLetter;
        updateLetterLinkState(state.activeLetter);
    }

    input.addEventListener('input', () => {
        state.searchQuery = input.value.trim();
        state.activeSuggestion = -1;
        input.setAttribute('aria-activedescendant', '');
        filterHomepage();
    });

    input.addEventListener('keydown', (event) => {
        const results = document.getElementById('searchResults');
        const options = results ? [...results.querySelectorAll('[role="option"]')] : [];
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!options.length) return;
            event.preventDefault();
            if (state.activeSuggestion < 0) {
                state.activeSuggestion = event.key === 'ArrowDown' ? 0 : options.length - 1;
            } else {
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                state.activeSuggestion = (state.activeSuggestion + direction + options.length) % options.length;
            }
            options.forEach((option, index) => {
                option.setAttribute('aria-selected', String(index === state.activeSuggestion));
            });
            input.setAttribute('aria-activedescendant', options[state.activeSuggestion].id);
            return;
        }
        if (event.key === 'Enter' && options.length) {
            event.preventDefault();
            const selectedIndex = state.activeSuggestion >= 0 ? state.activeSuggestion : 0;
            options[selectedIndex].click();
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
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
            state.activeGenre = button.dataset.genre || 'All';
            updateFilterButtonState('[data-genre]', state.activeGenre, 'genre');
            filterHomepage();
        });
    });

    document.querySelectorAll('[data-letter]').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            state.activeLetter = button.dataset.letter || '';
            updateLetterLinkState(state.activeLetter);
            filterHomepage();
            document.getElementById('song-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    document.addEventListener('click', (event) => {
        const results = document.getElementById('searchResults');
        const target = event.target instanceof Element ? event.target : null;
        if (results && !target?.closest('.header-search') && !target?.closest('.search-results')) closeSearchResults();
    });
}

// FIX-001 + FIX-002: loadSongs() sekarang dipanggil di inisialisasi,
// dan initDetailPage() hanya dipanggil jika elemen detail ada di halaman.
async function loadSongs() {
    const needsSongData = document.getElementById('songList') || document.getElementById('judulLagu');
    if (!needsSongData) return;

    try {
        const response = await fetch('data/songs.json');
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Format data lagu tidak valid');
        state.songs = data;

        if (document.getElementById('songList')) filterHomepage();

        // FIX-001: Hanya jalankan initDetailPage() jika elemen detail ada
        if (document.getElementById('judulLagu')) initDetailPage();

    } catch (error) {
        // FIX (AUDIT-006): Error sekarang di-log, tidak dibuang
        console.error('Gagal memuat data lagu:', error);
        const songList = document.getElementById('songList');
        const target = songList || document.getElementById('lirik');
        if (songList) markCatalogReady(songList);
        if (target) target.textContent = 'Gagal memuat data lagu. Silakan refresh halaman.';
    }
}

function initDetailPage() {
    const titleElement = document.getElementById('judulLagu');
    if (!titleElement) return;

    const reference = new URLSearchParams(window.location.search).get('id');
    const song = parseSongReference(reference, state.songs);

    if (!song) {
        titleElement.textContent = 'Lagu tidak ditemukan';
        const artist = document.getElementById('artisLagu');
        if (artist) artist.textContent = '';
        document.querySelector('.control-bar')?.setAttribute('hidden', 'true');
        return;
    }

    titleElement.textContent = song.judul;
    document.title = `${song.judul} — Chord & Lirik PowerChord`;

    const breadcrumb = document.getElementById('breadcrumbSong');
    if (breadcrumb) breadcrumb.textContent = song.judul;

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = new URL(getSongHref(song, getSongIndex(song)), window.location.href).href;

    const artistElement = document.getElementById('artisLagu');
    if (artistElement) artistElement.textContent = song.artis;

    const difficultyEl = document.getElementById('difficulty');
    const genreEl = document.getElementById('genre');
    const originalKeyEl = document.getElementById('originalKey');
    if (difficultyEl) difficultyEl.textContent = `🎸 ${getDifficulty(song)}`;
    if (genreEl) genreEl.textContent = song.genre || 'Guitar';
    if (originalKeyEl) originalKeyEl.textContent = `Original key: ${song.kunci || 'C'}`;

    const relatedSongs = state.songs
        .filter((candidate) => candidate !== song && candidate.genre === song.genre)
        .slice(0, 5);
    renderReferenceList(document.getElementById('relatedSongs'), relatedSongs);

    let offset = 0;
    const originalKey = song.kunci || 'C';
    const keyDisplay = document.getElementById('keyNow');
    if (keyDisplay) keyDisplay.textContent = originalKey;

    function renderLyrics() {
        const container = document.getElementById('lirik');
        if (!container) return;
        container.replaceChildren();
        (Array.isArray(song.lirik) ? song.lirik : []).forEach((line) => {
            const row = document.createElement('div');
            row.className = 'baris-lirik';
            const chord = document.createElement('span');
            chord.className = 'chord-lirik';
            chord.textContent = transposeChord(line.chord, offset) || '\u00A0';
            const text = document.createElement('span');
            text.className = 'teks-lirik';
            text.textContent = line.teks;
            row.append(chord, text);
            container.appendChild(row);
        });
    }

    const updateTransposedKey = () => {
        if (keyDisplay) keyDisplay.textContent = transposeChord(originalKey, offset);
    };

    renderLyrics();

    document.getElementById('plus')?.addEventListener('click', () => {
        offset = (offset + 1) % 12;
        renderLyrics();
        updateTransposedKey();
    });
    document.getElementById('minus')?.addEventListener('click', () => {
        offset = (offset - 1 + 12) % 12;
        renderLyrics();
        updateTransposedKey();
    });
    document.getElementById('reset')?.addEventListener('click', () => {
        offset = 0;
        renderLyrics();
        updateTransposedKey();
    });

    const scrollButton = document.getElementById('toggleScroll');
    const slowButton = document.getElementById('scrollSlow');
    const fastButton = document.getElementById('scrollFast');
    const speedDisplay = document.getElementById('speedDisplay');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
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
    function syncMotionPreference() {
        const reducedMotion = prefersReducedMotion.matches;
        if (!scrollButton) return;
        scrollButton.disabled = reducedMotion;
        scrollButton.title = reducedMotion
            ? 'Autoscroll dinonaktifkan karena preferensi reduced motion'
            : '';
        if (reducedMotion) stopScroll();
    }
    syncMotionPreference();
    prefersReducedMotion.addEventListener?.('change', syncMotionPreference);

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

// --- DRAWER FUNCTIONS ---
window.toggleDrawer = function () {
    document.getElementById('drawer')?.classList.toggle('open');
    document.getElementById('drawerOverlay')?.classList.toggle('open');
};

window.closeDrawer = function () {
    document.getElementById('drawer')?.classList.remove('open');
    document.getElementById('drawerOverlay')?.classList.remove('open');
};

window.handleDrawerSearch = function (value) {
    const homeInput = document.getElementById('searchInput');
    if (homeInput) {
        homeInput.value = value;
        homeInput.dispatchEvent(new Event('input', { bubbles: true }));
        if (value.length >= 2) closeDrawer();
    }
};

// Event listener drawer search
document.addEventListener('DOMContentLoaded', () => {
    const drawerSearch = document.getElementById('drawerSearchInput');
    drawerSearch?.addEventListener('input', (e) => {
        window.handleDrawerSearch(e.target.value);
    });
});

// --- INISIALISASI ---
// FIX-002: loadSongs() sekarang dipanggil di sini
initTheme();
initHomepageInteractions();
loadSongs();