import {
    filterSongs,
    getDifficulty,
    normalizeSearchQuery,
    getSongHref,
    parseSongReference,
    transposeChord,
    extractSongChords,
    OCTAVE_SIZE,
    suggestCapo,
    getChordShape,
} from './core.js';
import { fetchSongsFromSupabase } from './supabase.js';
import { fetchLocalSongs, normalizeAndValidateSongs } from './song-service.js';

const state = {
    searchQuery: '',
    activeGenre: 'All',
    activeLetter: '',
    activeSuggestion: -1,
    songs: [],
};

const debugLog = (...args) => {
    if (globalThis.__POWERCHORD_DEBUG__ === true) globalThis.console?.info(...args);
};
const debugWarn = (...args) => {
    if (globalThis.__POWERCHORD_DEBUG__ === true) globalThis.console?.warn(...args);
};

// --- Configuration Constants ---
const NETWORK_TIMEOUT_MS = 10000; // 10 detik timeout untuk fetch

// --- LocalStorage Helper (Safe Access) ---
// Menggunakan try/catch untuk mencegah error di private browsing mode
function getLocalStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (error) {
        debugWarn(`Tidak dapat membaca localStorage untuk key "${key}":`, error);
        return defaultValue;
    }
}

function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        debugWarn(`Tidak dapat menyimpan ke localStorage untuk key "${key}":`, error);
        return false;
    }
}

const FAVORITES_STORAGE_KEY = 'powerchord_favorites';
const HISTORY_STORAGE_KEY = 'powerchord_history';
const MAX_HISTORY_ITEMS = 50;
const ANALYTICS_STORAGE_KEY = 'powerchord_analytics';
const MAX_ANALYTICS_ITEMS = 100;
const MAX_ANALYTICS_QUERY_LENGTH = 200;
const ANALYTICS_DEDUP_WINDOW_MS = 1000;

function getStoredIdList(key) {
    try {
        const rawValue = getLocalStorage(key, '[]');
        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed)
            ? parsed.filter((value) => typeof value === 'string' && value.trim())
            : [];
    } catch (error) {
        debugWarn(`Gagal membaca daftar tersimpan "${key}":`, error);
        return [];
    }
}

function saveStoredIdList(key, ids) {
    return setLocalStorage(key, JSON.stringify(ids));
}

function readAnalytics() {
    try {
        const parsed = JSON.parse(getLocalStorage(ANALYTICS_STORAGE_KEY, '[]'));
        return Array.isArray(parsed) ? parsed.slice(-MAX_ANALYTICS_ITEMS) : [];
    } catch (error) {
        debugWarn('Gagal membaca analytics:', error);
        return [];
    }
}

function appendAnalyticsEntry(entry) {
    const analytics = readAnalytics();
    const lastEntry = analytics[analytics.length - 1];
    const lastTimestamp = Date.parse(lastEntry?.timestamp || '');
    const entryTimestamp = Date.parse(entry.timestamp);
    const sameEvent = entry.type === lastEntry?.type
        && (entry.page === lastEntry?.page || entry.query === lastEntry?.query);
    if (sameEvent && Number.isFinite(lastTimestamp)
        && entryTimestamp - lastTimestamp < ANALYTICS_DEDUP_WINDOW_MS) {
        return;
    }

    analytics.push(entry);
    setLocalStorage(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics.slice(-MAX_ANALYTICS_ITEMS)));
}

function addToHistory(songId) {
    if (typeof songId !== 'string' || !songId) return;
    const history = getStoredIdList(HISTORY_STORAGE_KEY).filter((id) => id !== songId);
    history.unshift(songId);
    saveStoredIdList(HISTORY_STORAGE_KEY, history.slice(0, MAX_HISTORY_ITEMS));
}

function isFavorite(songId) {
    return getStoredIdList(FAVORITES_STORAGE_KEY).includes(songId);
}

function toggleFavorite(songId) {
    if (typeof songId !== 'string' || !songId) return false;
    const favorites = getStoredIdList(FAVORITES_STORAGE_KEY);
    const index = favorites.indexOf(songId);
    if (index >= 0) favorites.splice(index, 1);
    else favorites.push(songId);
    saveStoredIdList(FAVORITES_STORAGE_KEY, favorites);
    return index < 0;
}

function getSongIndex(song) {
    return state.songs.indexOf(song);
}

function makeReferenceLink(song) {
    const link = document.createElement('a');
    link.className = 'reference-link';
    link.href = getSongHref(song, getSongIndex(song));
    link.textContent = `${song.artist} - ${song.title}`;
    return link;
}

function renderReferenceList(container, items) {
    if (!container) return;
    container.replaceChildren();
    items.forEach((item) => container.appendChild(makeReferenceLink(item)));
}

function renderSongRow(song, { asLink = false } = {}) {
    const row = document.createElement(asLink ? 'a' : 'div');
    row.className = 'song-row';
    if (asLink) row.href = getSongHref(song, getSongIndex(song));

    const main = document.createElement('span');
    main.className = 'song-main';
    const title = document.createElement(asLink ? 'span' : 'a');
    title.className = 'song-title';
    if (!asLink) title.href = getSongHref(song, getSongIndex(song));
    title.textContent = song.title;
    const artist = document.createElement(asLink ? 'span' : 'a');
    artist.className = 'song-artist';
    if (!asLink) artist.href = `catalog.html?artist=${encodeURIComponent(song.artist)}`;
    artist.textContent = song.artist;
    main.append(title, artist);

    const difficulty = document.createElement('span');
    difficulty.className = 'song-meta';
    difficulty.textContent = getDifficulty(song);
    const key = document.createElement('span');
    key.className = 'song-key';
    key.textContent = song.key || '—';
    const arrow = document.createElement('span');
    arrow.className = 'song-arrow';
    arrow.textContent = '→';
    arrow.setAttribute('aria-hidden', 'true');
    row.append(main, difficulty, key, arrow);
    return row;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
let activeChordTrigger = null;

function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
}

function renderChordDiagram(container, shape) {
    if (!container || !shape) return;
    container.replaceChildren();
    const svg = createSvgElement('svg', {
        viewBox: '0 0 300 300', role: 'img',
        'aria-label': `Diagram chord ${shape.root} ${shape.quality}`,
    });
    const title = createSvgElement('title');
    title.textContent = `Diagram chord ${shape.root}`;
    svg.appendChild(title);
    const left = 62;
    const top = 70;
    const stringGap = 36;
    const fretGap = 38;
    const fretCount = 5;
    const baseFret = Number(shape.baseFret) > 0 ? Number(shape.baseFret) : 1;
    const fretLabel = createSvgElement('text', { x: 22, y: 105, class: 'diagram-fret-label' });
    fretLabel.textContent = baseFret > 1 ? `${baseFret}fr` : '1';
    svg.appendChild(fretLabel);
    for (let stringIndex = 0; stringIndex < 6; stringIndex += 1) {
        const x = left + stringIndex * stringGap;
        svg.appendChild(createSvgElement('line', {
            x1: x, y1: top, x2: x, y2: top + fretCount * fretGap,
            class: 'diagram-string',
        }));
        const marker = String(shape.positions?.[stringIndex] ?? 'x');
        const markerText = createSvgElement('text', {
            x, y: 48, class: marker === 'x' ? 'diagram-muted' : 'diagram-open',
        });
        markerText.textContent = marker === 'x' ? '×' : marker === '0' ? '○' : '';
        svg.appendChild(markerText);
    }
    for (let fretIndex = 0; fretIndex <= fretCount; fretIndex += 1) {
        const y = top + fretIndex * fretGap;
        svg.appendChild(createSvgElement('line', {
            x1: left, y1: y, x2: left + 5 * stringGap, y2: y,
            class: fretIndex === 0 && baseFret === 1 ? 'diagram-nut' : 'diagram-fret',
        }));
    }
    shape.positions?.forEach((position, stringIndex) => {
        const fret = Number(position);
        if (!Number.isFinite(fret) || fret <= 0) return;
        const relativeFret = baseFret > 1 ? fret - baseFret + 1 : fret;
        if (relativeFret < 1 || relativeFret > fretCount) return;
        svg.appendChild(createSvgElement('circle', {
            cx: left + stringIndex * stringGap,
            cy: top + (relativeFret - 0.5) * fretGap,
            r: 10,
            class: 'diagram-dot',
        }));
    });
    container.appendChild(svg);
}

function initChordDiagramModal() {
    const modal = document.getElementById('chordModal');
    const closeButton = document.getElementById('closeChordModal');
    const diagram = document.getElementById('chordDiagram');
    const title = document.getElementById('chordModalTitle');
    const subtitle = document.getElementById('chordModalSubtitle');
    if (!modal || !closeButton || !diagram || !title || !subtitle || modal.dataset.initialized) return;
    const closeModal = () => {
        modal.hidden = true;
        diagram.replaceChildren();
        activeChordTrigger?.focus();
        activeChordTrigger = null;
    };
    const openModal = (symbol, trigger) => {
        const shape = getChordShape(symbol);
        if (!shape) return;
        activeChordTrigger = trigger;
        title.textContent = symbol;
        subtitle.textContent = `${shape.quality === 'minor' ? 'Minor' : 'Major'} · Senar dari E rendah ke e tinggi`;
        renderChordDiagram(diagram, shape);
        modal.hidden = false;
        closeButton.focus();
    };
    modal.dataset.initialized = 'true';
    closeButton.addEventListener('click', closeModal);
    modal.querySelector('[data-chord-modal-close]')?.addEventListener('click', closeModal);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.hidden) closeModal();
    });
    window.openChordDiagram = openModal;
}

function renderLatestSongRow(song) {
    return renderSongRow(song, { asLink: false });
}

function matchesLetter(song) {
    if (!state.activeLetter) return true;
    const firstLetter = song.title.trim().charAt(0).toUpperCase();
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
        option.textContent = `${song.title} — ${song.artist}`;
        option.addEventListener('click', closeSearchResults);
        results.appendChild(option);
    });

    if (filtered.length > 6) {
        const seeAll = document.createElement('a');
        seeAll.className = 'view-all-link';
        seeAll.href = `catalog.html?q=${encodeURIComponent(state.searchQuery)}`;
        seeAll.textContent = `Lihat Semua (${filtered.length}) →`;
        seeAll.addEventListener('click', closeSearchResults);
        results.appendChild(seeAll);
    }

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


function renderHeroStats(songs) {
    const songCount = document.getElementById('heroSongCount');
    const artistCount = document.getElementById('heroArtistCount');
    if (songCount) songCount.textContent = `${songs.length}+`;
    if (artistCount) artistCount.textContent = `${new Set(songs.map((song) => song.artist).filter(Boolean)).size}+`;
}

function initHeroSearch() {
    const heroForm = document.getElementById('heroSearchForm');
    const heroInput = document.getElementById('heroSearchInput');
    const headerInput = document.getElementById('searchInput');
    const headerForm = document.getElementById('headerSearchForm');
    if (!heroForm || !heroInput) return;
    const syncToHeader = () => {
        if (!headerInput) return;
        headerInput.value = heroInput.value;
        headerInput.dispatchEvent(new Event('input', { bubbles: true }));
    };
    heroInput.addEventListener('input', syncToHeader);
    heroForm.addEventListener('submit', (event) => {
        event.preventDefault();
        syncToHeader();
        if (headerForm) headerForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        else document.getElementById('song-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.querySelectorAll('[data-search-example]').forEach((button) => {
        button.addEventListener('click', () => {
            heroInput.value = button.dataset.searchExample || '';
            syncToHeader();
            heroInput.focus();
        });
    });
}

function renderPopularSongRow(song, index) {
    const row = document.createElement('a');
    row.className = `song-row${index < 3 ? ' top' : ''}`;
    row.href = getSongHref(song, getSongIndex(song));
    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = String(index + 1);
    const meta = document.createElement('span');
    meta.className = 'meta';
    const title = document.createElement('b');
    title.textContent = song.title;
    const subtitle = document.createElement('span');
    subtitle.textContent = `${song.artist} · ${song.genre || 'Pop'}`;
    meta.append(title, subtitle);
    const right = document.createElement('span');
    right.className = 'col-right';
    const difficulty = document.createElement('span');
    difficulty.className = `badge ${getDifficulty(song) === 'Easy' ? 'easy' : getDifficulty(song) === 'Advanced' ? 'hard' : 'mid'}`;
    difficulty.textContent = getDifficulty(song) === 'Easy' ? 'Mudah' : getDifficulty(song) === 'Advanced' ? 'Sulit' : 'Sedang';
    const key = document.createElement('span');
    key.className = 'badge key';
    key.textContent = song.key || '—';
    right.append(difficulty, key);
    row.append(rank, meta, right);
    return row;
}

function renderNewSongRow(song) {
    const row = renderPopularSongRow(song, 0);
    row.classList.remove('top');
    row.querySelector('.rank')?.remove();
    const badge = document.createElement('span');
    badge.className = 'badge new';
    badge.textContent = 'Baru';
    row.querySelector('.col-right')?.prepend(badge);
    return row;
}

function renderNewSongs() {
    const container = document.getElementById('newSongList');
    if (!container) return;
    container.replaceChildren();
    state.songs.slice(-4).reverse().forEach((song) => container.appendChild(renderNewSongRow(song)));
}

function renderPopularSongs() {
    const container = document.getElementById('popularSongsList');
    if (!container || !state.songs.length) return;

    const markedPopular = state.songs.filter((song) => song.popular === true);
    const remainingSongs = state.songs.filter((song) => song.popular !== true);
    const topSongs = [...markedPopular, ...remainingSongs].slice(0, 5);

    container.replaceChildren();
    topSongs.forEach((song, index) => {
        container.appendChild(renderPopularSongRow(song, index));
    });
}

function filterHomepage() {
    if (!document.getElementById('songList')) return;
    const filtered = getFilteredSongs();

    // CRITICAL: Render langsung (user lagi nunggu ini)
    renderSearchRows(filtered);
    const latestCount = document.getElementById('latestCount');
    if (latestCount) latestCount.textContent = `${filtered.length} lagu`;
    if (normalizeSearchQuery(state.searchQuery).length >= 2) renderSearchResults(filtered);
    else closeSearchResults();

    // NON-CRITICAL: Render saat browser idle dengan fallback aman (PERF-006)
    const renderNonCritical = () => {
        renderNewSongs();
        renderPopularSongs();
    };

    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(renderNonCritical);
    } else {
        setTimeout(renderNonCritical, 1);
    }
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
    const storedTheme = getLocalStorage('powerchord-theme', 'dark');
    const initialTheme = storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : 'light';

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
        setLocalStorage('powerchord-theme', nextTheme);
    });
}

function initSearchInteractions() {
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

    let searchDebounceTimer = null;

    input.addEventListener('input', () => {
        state.searchQuery = input.value.trim();
        state.activeSuggestion = -1;
        input.setAttribute('aria-activedescendant', '');

        // Clear timer sebelumnya
        if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

        // Tunggu 300ms setelah user berhenti mengetik
        searchDebounceTimer = setTimeout(() => {
            if (document.getElementById('songList')) {
                filterHomepage();
            }
        }, 300);
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
        closeSearchResults();

        // Track pencarian
        if (state.searchQuery.trim()) {
            trackSearchQuery(state.searchQuery.trim());
        }

        const isCatalogPage = window.location.pathname.endsWith('/catalog')
            || window.location.pathname.includes('catalog.html');
        const isDetailPage = window.location.pathname.endsWith('/detail')
            || window.location.pathname.includes('detail.html');
        // Di katalog, update URL; dari detail, buka halaman katalog.
        if (isCatalogPage) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('q', state.searchQuery);
            window.history.pushState({}, '', newUrl);
            initCatalogPage();
        } else if (isDetailPage) {
            const newUrl = new URL('/catalog', window.location.origin);
            if (state.searchQuery.trim()) newUrl.searchParams.set('q', state.searchQuery.trim());
            window.location.assign(newUrl.href);
        } else {
            filterHomepage();
            document.getElementById('song-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    document.querySelectorAll('[data-genre]').forEach((button) => {
        button.addEventListener('click', () => {
            const genre = button.dataset.genre || 'All';

            // Jika di catalog.html, update URL dengan parameter genre=
            const isCatalogPage = window.location.pathname.endsWith('/catalog')
                || window.location.pathname.includes('catalog.html');
            if (isCatalogPage) {
                const newUrl = new URL(window.location.href);
                if (genre === 'All') {
                    newUrl.searchParams.delete('genre');
                } else {
                    newUrl.searchParams.set('genre', genre);
                }
                window.location.href = newUrl;
            } else {
                // Jika di homepage, update state dan filter
                state.activeGenre = genre;
                updateFilterButtonState('[data-genre]', state.activeGenre, 'genre');
                filterHomepage();
            }
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

let songsPromise;

function loadSongs() {
    const needsSongData = document.getElementById('songList')
        || document.getElementById('judulLagu')
        || document.getElementById('collectionList')
        || document.getElementById('historyList');
    if (!needsSongData) return Promise.resolve();
    if (songsPromise) return songsPromise;

    songsPromise = (async () => {

    const supabaseController = new AbortController();
    const supabaseTimeoutId = setTimeout(() => supabaseController.abort(), NETWORK_TIMEOUT_MS);

    try {
        state.songs = normalizeAndValidateSongs(await fetchSongsFromSupabase({ signal: supabaseController.signal }));
        debugLog(`Memuat ${state.songs.length} lagu dari Supabase`);
    } catch (supabaseError) {
        debugWarn('Supabase tidak tersedia, menggunakan fallback JSON:', supabaseError);
        const fallbackController = new AbortController();
        const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), NETWORK_TIMEOUT_MS);
        try {
            state.songs = await fetchLocalSongs({ signal: fallbackController.signal });
        } catch (fallbackError) {
            console.error('Gagal memuat data lagu:', fallbackError);
            const songList = document.getElementById('songList');
            const target = songList || document.getElementById('lirik');
            if (songList) markCatalogReady(songList);
            if (target) target.textContent = 'Gagal memuat data lagu. Silakan periksa koneksi internet Anda dan refresh halaman.';
            return;
        } finally {
            clearTimeout(fallbackTimeoutId);
        }
    } finally {
        clearTimeout(supabaseTimeoutId);
    }

    renderHeroStats(state.songs);
    if (document.getElementById('songList')) filterHomepage();
    if (document.getElementById('judulLagu')) initDetailPage();
    })();

    return songsPromise;
}

function initDrawer() {
    document.getElementById('hamburgerBtn')?.addEventListener('click', () => window.toggleDrawer());
    document.getElementById('drawerClose')?.addEventListener('click', () => window.closeDrawer());
    document.getElementById('drawerOverlay')?.addEventListener('click', () => window.closeDrawer());
    document.getElementById('drawerSearchInput')?.addEventListener('input', (e) => window.handleDrawerSearch(e.target.value));
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

    initChordDiagramModal();

    titleElement.textContent = song.title;
    document.title = `${song.title} — Chord & Lirik PowerChord`;

    const breadcrumb = document.getElementById('breadcrumbSong');
    if (breadcrumb) breadcrumb.textContent = song.title;

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = new URL(getSongHref(song, getSongIndex(song)), window.location.href).href;

    const artistElement = document.getElementById('artisLagu');
    if (artistElement) artistElement.textContent = song.artist;

    addToHistory(song.id);
    const favoriteButton = document.getElementById('toggleFavorite');
    const updateFavoriteButton = () => {
        const favorite = isFavorite(song.id);
        if (!favoriteButton) return;
        favoriteButton.textContent = favorite ? '★ Tersimpan' : '☆ Simpan';
        favoriteButton.setAttribute('aria-pressed', String(favorite));
        favoriteButton.setAttribute('aria-label', favorite
            ? `Hapus ${song.title} dari koleksi`
            : `Simpan ${song.title} ke koleksi`);
        favoriteButton.classList.toggle('is-favorite', favorite);
    };
    favoriteButton?.addEventListener('click', () => {
        toggleFavorite(song.id);
        updateFavoriteButton();
    });
    updateFavoriteButton();

    const difficultyEl = document.getElementById('difficulty');
    const genreEl = document.getElementById('genre');
    const originalKeyEl = document.getElementById('originalKey');
    if (difficultyEl) difficultyEl.textContent = `🎸 ${getDifficulty(song)}`;
    if (genreEl) genreEl.textContent = song.genre || 'Guitar';
    if (originalKeyEl) originalKeyEl.textContent = `Original key: ${song.key || 'C'}`;

    const relatedSongs = state.songs
        .filter((candidate) => candidate !== song && candidate.genre === song.genre)
        .slice(0, 5);
    renderReferenceList(document.getElementById('relatedSongs'), relatedSongs);

    let offset = 0;
    const originalKey = song.key || 'C';
    const keyDisplay = document.getElementById('keyNow');
    if (keyDisplay) keyDisplay.textContent = originalKey;




    function renderLyrics() {
        const container = document.getElementById('lirik');
        if (!container) return;
        container.replaceChildren();
        (Array.isArray(song.lyrics) ? song.lyrics : []).forEach((line) => {
            const row = document.createElement('div');
            row.className = 'baris-lirik';
            const chordGroup = document.createElement('span');
            chordGroup.className = 'chord-group';
            const chordNames = String(line.chord || '').trim().split(/\s+/).filter(Boolean);
            if (!chordNames.length) chordNames.push('');
            chordNames.forEach((chordName) => {
                const transposedChord = transposeChord(chordName, offset) || '';
                const chord = document.createElement('button');
                chord.className = 'chord-lirik';
                chord.type = 'button';
                chord.textContent = transposedChord || '\u00A0';
                if (transposedChord) {
                    chord.setAttribute('data-chord', transposedChord);
                    chord.setAttribute('aria-label', `Lihat diagram chord ${transposedChord}`);
                    chord.addEventListener('click', () => window.openChordDiagram?.(transposedChord, chord));
                } else {
                    chord.setAttribute('aria-hidden', 'true');
                    chord.style.pointerEvents = 'none';
                }
                chordGroup.appendChild(chord);
            });
            const text = document.createElement('span');
            text.className = 'teks-lirik';
            text.textContent = line.text;
            row.append(chordGroup, text);
            container.appendChild(row);
        });
    }

    const updateTransposedKey = () => {
        if (keyDisplay) keyDisplay.textContent = transposeChord(originalKey, offset);
        updateCapoUI();
    };

    // --- Capo Suggestion Logic ---
    const capoBox = document.getElementById('capoBox');
    const capoStatus = document.getElementById('capoStatus');
    const btnCapoSuggest = document.getElementById('btnCapoSuggest');
    let activeCapoFret = 0;

    function updateCapoUI() {
        if (!capoBox || !btnCapoSuggest || !capoStatus) return;
        const currentChords = extractSongChords(song.lyrics);
        const currentTransposedChords = currentChords.map((c) => transposeChord(c, offset) || c);
        const currentKey = transposeChord(originalKey, offset);

        const suggestion = suggestCapo(currentTransposedChords, currentKey, 7);

        if (activeCapoFret > 0) {
            capoStatus.textContent = `Fret ${activeCapoFret}`;
            capoStatus.classList.add('active');
            btnCapoSuggest.hidden = false;
            btnCapoSuggest.classList.add('applied');
            btnCapoSuggest.querySelector('.capo-action-text').textContent = '✕ Lepas Capo';
            btnCapoSuggest.setAttribute('aria-label', 'Lepas capo dan kembali ke akor standar');
        } else {
            capoStatus.textContent = 'Standar';
            capoStatus.classList.remove('active');
            btnCapoSuggest.classList.remove('applied');

            if (!suggestion.isAlreadyOptimal && suggestion.bestFret > 0) {
                btnCapoSuggest.hidden = false;
                const actionText = btnCapoSuggest.querySelector('.capo-action-text');
                if (actionText) {
                    actionText.textContent = `Saran: Fret ${suggestion.bestFret} (${suggestion.playedKey})`;
                }
                btnCapoSuggest.setAttribute(
                    'aria-label',
                    `Pasang Capo di Fret ${suggestion.bestFret} untuk memainkan bentuk akor ${suggestion.playedKey}`
                );
                btnCapoSuggest.dataset.fret = suggestion.bestFret;
            } else {
                btnCapoSuggest.hidden = true;
            }
        }
    }

    btnCapoSuggest?.addEventListener('click', () => {
        if (activeCapoFret > 0) {
            // Lepas capo -> kembalikan offset ke posisi semula
            offset = (offset + activeCapoFret) % OCTAVE_SIZE;
            activeCapoFret = 0;
        } else {
            // Pasang capo yang disarankan
            const targetFret = parseInt(btnCapoSuggest.dataset.fret, 10);
            if (!isNaN(targetFret) && targetFret > 0) {
                activeCapoFret = targetFret;
                // Saat pasang capo fret X, akor yang dimainkan jari turun X semitone
                offset = (offset - targetFret + OCTAVE_SIZE) % OCTAVE_SIZE;
            }
        }
        renderLyrics();
        updateTransposedKey();
    });

    renderLyrics();
    updateCapoUI();

    document.getElementById('plus')?.addEventListener('click', () => {
        offset = (offset + 1) % OCTAVE_SIZE;
        activeCapoFret = 0;
        renderLyrics();
        updateTransposedKey();
    });
    document.getElementById('minus')?.addEventListener('click', () => {
        offset = (offset - 1 + OCTAVE_SIZE) % OCTAVE_SIZE;
        activeCapoFret = 0;
        renderLyrics();
        updateTransposedKey();
    });
    document.getElementById('reset')?.addEventListener('click', () => {
        offset = 0;
        activeCapoFret = 0;
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
        if (value.length >= 2) window.closeDrawer();
    }
};
// --- SERVICE WORKER REGISTRATION (PWA) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js?v=14', { updateViaCache: 'none' })
      .then((registration) => {
        registration.update();
        debugLog('[SW] Registered with scope:', registration.scope);
      })
      .catch((error) => {
        debugWarn('[SW] Registration failed:', error);
      });
  });
}
// --- PWA OFFLINE INDICATOR (PWA-008) ---
function initOfflineIndicator() {
    const banner = document.getElementById('offline-banner');
    if (!banner) return;

    const showOffline = () => {
        banner.hidden = false;
        document.body.classList.add('has-offline-banner');
    };

    const showOnline = () => {
        banner.hidden = true;
        document.body.classList.remove('has-offline-banner');
    };

    // Cek status awal saat halaman dimuat
    if (!navigator.onLine) showOffline();

    // Dengarkan perubahan jaringan
    window.addEventListener('offline', showOffline);
    window.addEventListener('online', showOnline);
}
// --- COLLECTION & HISTORY FUNCTIONS ---
function getFavorites() {
    return getStoredIdList(FAVORITES_STORAGE_KEY);
}

function getHistory() {
    return getStoredIdList(HISTORY_STORAGE_KEY);
}

function renderCollectionList() {
    const container = document.getElementById('collectionList');
    const emptyContainer = document.getElementById('emptyCollection');
    const countElement = document.getElementById('collectionCount');

    if (!container) return;

    const favorites = new Set(getFavorites());
    const songs = state.songs.filter(song => favorites.has(song.id));

    if (countElement) {
        countElement.textContent = `${songs.length} lagu`;
    }

    if (songs.length === 0) {
        container.hidden = true;
        if (emptyContainer) emptyContainer.hidden = false;
        return;
    }

    container.hidden = false;
    if (emptyContainer) emptyContainer.hidden = true;
    container.replaceChildren();

    songs.forEach((song) => {
        container.appendChild(renderSongRow(song, { asLink: true }));
    });
}

function renderHistoryList() {
    const container = document.getElementById('historyList');
    const emptyContainer = document.getElementById('emptyHistory');
    const countElement = document.getElementById('historyCount');

    if (!container) return;

    const history = new Set(getHistory());
    const songs = state.songs.filter(song => history.has(song.id));

    if (countElement) {
        countElement.textContent = `${songs.length} lagu`;
    }

    if (songs.length === 0) {
        container.hidden = true;
        if (emptyContainer) emptyContainer.hidden = false;
        return;
    }

    container.hidden = false;
    if (emptyContainer) emptyContainer.hidden = true;
    container.replaceChildren();

    songs.forEach((song) => {
        container.appendChild(renderSongRow(song, { asLink: true }));
    });
}

function initCollectionPage() {
    if (!document.getElementById('collectionList')) return;
    loadSongs().then(() => {
        renderCollectionList();
    });
}

function initHistoryPage() {
    if (!document.getElementById('historyList')) return;
    loadSongs().then(() => {
        renderHistoryList();
    });
}

function initCatalogPage() {
    const songList = document.getElementById('songList');
    if (!songList) return;

    const params = new URLSearchParams(window.location.search);
    const genreParam = params.get('genre');
    const artistParam = params.get('artist');
    const queryParam = params.get('q');

    if (genreParam) {
        state.activeGenre = genreParam;
        updateFilterButtonState('[data-genre]', state.activeGenre, 'genre');
    }

    if (artistParam) {
        state.searchQuery = artistParam;
        const input = document.getElementById('searchInput');
        if (input) input.value = artistParam;
    }

    if (queryParam) {
        state.searchQuery = queryParam;
        const input = document.getElementById('searchInput');
        if (input) input.value = queryParam;
    }

    loadSongs().then(() => {
        filterHomepage();
    });
}

// --- ANALYTICS & TRACKING ---
function trackPageView() {
    try {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const searchParams = window.location.search;
        const fullPath = page + searchParams;

        appendAnalyticsEntry({
            type: 'page_view',
            page: fullPath,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        debugWarn('Gagal menyimpan analytics:', error);
    }
}

function trackSearchQuery(query) {
    const trimmed = typeof query === 'string'
        ? query.trim().slice(0, MAX_ANALYTICS_QUERY_LENGTH)
        : '';
    if (!trimmed) return;

    try {
        appendAnalyticsEntry({
            type: 'search',
            query: trimmed,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        debugWarn('Gagal menyimpan analytics pencarian:', error);
    }
}



// --- INISIALISASI ---
initOfflineIndicator();
initTheme();
initDrawer();
initSearchInteractions();
initHeroSearch();
loadSongs();
initCollectionPage();
initHistoryPage();
initCatalogPage();
trackPageView();
