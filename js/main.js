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
    const firstLetter = song.artis.trim().charAt(0).toUpperCase();
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

    const views = document.createElement('span');
    views.className = 'popular-views';
    const viewCount = Math.floor(Math.random() * 200) + 50;
    views.textContent = `🎵 ${viewCount} views`;

    row.append(rank, main, views);
    return row;
}

function renderArtistsList() {
    const container = document.getElementById('artistsList');
    if (!container || !state.songs.length) return;

    const artistMap = new Map();
    state.songs.forEach((song) => {
        const artistName = song.artis.trim();
        if (!artistMap.has(artistName)) {
            artistMap.set(artistName, []);
        }
        artistMap.get(artistName).push(song);
    });

    container.replaceChildren();
    const sortedArtists = [...artistMap.entries()].sort((a, b) => 
        a[0].localeCompare(b[0])
    );

    sortedArtists.forEach(([artistName, songs]) => {
        const card = document.createElement('a');
        card.className = 'artist-card';
        card.href = `#song-catalog`;
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = artistName;
                state.searchQuery = artistName;
                filterHomepage();
                document.getElementById('song-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        const avatar = document.createElement('div');
        avatar.className = 'artist-avatar';
        avatar.textContent = artistName.charAt(0).toUpperCase();

        const info = document.createElement('div');
        info.className = 'artist-info';
        const name = document.createElement('div');
        name.className = 'artist-name';
        name.textContent = artistName;
        const count = document.createElement('div');
        count.className = 'artist-song-count';
        count.textContent = `${songs.length} lagu`;
        info.append(name, count);

        card.append(avatar, info);
        container.appendChild(card);
    });
}

function renderPopularSongs() {
    const container = document.getElementById('popularSongsList');
    if (!container || !state.songs.length) return;

    container.replaceChildren();
    const topSongs = state.songs.slice(0, 4);
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
    renderArtistsList();
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
            localStorage.setItem('powerchord-theme', nextTheme);
        } catch (error) {
            console.warn('Preferensi tema tidak dapat disimpan.', error);
        }
    });
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

async function loadSongs() {
    const needsSongData = document.getElementById('songList') || document.getElementById('judulLagu');
    if (!needsSongData) return;

    try {
        const response = await fetch('data/songs.json');
        if (!response.ok) throw new Error('Gagal memuat data lagu');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Format data lagu tidak valid');
        state.songs = data;
        if (document.getElementById('songList')) filterHomepage();
        initDetailPage();
    } catch {
        const songList = document.getElementById('songList');
        const target = songList || document.getElementById('lirik');
        if (songList) markCatalogReady(songList);
        if (target) target.textContent = 'Gagal memuat data lagu.';
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
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = new URL(getSongHref(song, getSongIndex(song)), window.location.href).href;
    const artistElement = document.getElementById('artisLagu');
    if (artistElement) artistElement.textContent = song.artis;
    const meta = document.querySelectorAll('.detail-meta span');
    if (meta[0]) meta[0].textContent = getDifficulty(song);
    if (meta[1]) meta[1].textContent = song.genre || 'Guitar';
    if (meta[2]) meta[2].textContent = `Original key: ${song.kunci || 'C'}`;
    
    // Update Breadcrumb (BARU)
    updateBreadcrumb(song);
    
    // Setup Sticky Back Button (BARU)
    setupStickyBackButton();
    
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

// Update Breadcrumb (BARU)
function updateBreadcrumb(song) {
    const breadcrumbGenre = document.getElementById('breadcrumbGenre');
    const breadcrumbArtist = document.getElementById('breadcrumbArtist');
    const breadcrumbSong = document.getElementById('breadcrumbSong');
    
    if (breadcrumbGenre && song.genre) {
        breadcrumbGenre.textContent = `🏷️ ${song.genre}`;
        breadcrumbGenre.closest('.breadcrumb').querySelector('a[href="index.html"]').nextElementSibling.nextElementSibling.outerHTML = 
            `<a href="index.html?genre=${encodeURIComponent(song.genre.toLowerCase())}#song-catalog">🏷️ ${song.genre}</a>`;
    }
    
    if (breadcrumbArtist) {
        breadcrumbArtist.textContent = `🎤 ${song.artis}`;
        // Replace the span with a link to artists page
        const artistLink = document.createElement('a');
        artistLink.href = `artists.html?artist=${encodeURIComponent(song.artis)}`;
        artistLink.textContent = `🎤 ${song.artis}`;
        breadcrumbArtist.replaceWith(artistLink);
    }
    
    if (breadcrumbSong) {
        breadcrumbSong.textContent = `🎵 ${song.judul}`;
    }
}

// Setup Sticky Back Button (BARU)
function setupStickyBackButton() {
    const stickyButton = document.getElementById('stickyBackButton');
    if (!stickyButton) return;
    
    // Get the referring letter from URL or default to current song's first letter
    const params = new URLSearchParams(window.location.search);
    const songId = params.get('id');
    let backLink = 'index.html#song-catalog';
    
    if (songId) {
        const song = parseSongReference(songId, state.songs);
        if (song) {
            const firstLetter = song.artis.trim().charAt(0).toUpperCase();
            const letterParam = /\d/.test(firstLetter) ? '0-9' : firstLetter;
            backLink = `index.html?letter=${letterParam}#song-catalog`;
        }
    }
    
    stickyButton.addEventListener('click', () => {
        window.location.href = backLink;
    });
    
    // Show/hide based on scroll position
    function handleScroll() {
        if (window.scrollY > 300) {
            stickyButton.style.display = 'inline-flex';
        } else {
            stickyButton.style.display = 'none';
        }
    }
    
    // Initial check
    handleScroll();
    
    // Listen for scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });
}

// Render Artists Page (BARU)
function renderArtistsPage() {
    const container = document.getElementById('artistsList');
    const artistCountEl = document.getElementById('artistCount');
    const totalArtistsEl = document.getElementById('totalArtists');
    const totalSongsEl = document.getElementById('totalSongs');
    
    if (!container || !state.songs.length) return;
    
    // Build artist map
    const artistMap = new Map();
    state.songs.forEach((song) => {
        const artistName = song.artis.trim();
        if (!artistMap.has(artistName)) {
            artistMap.set(artistName, []);
        }
        artistMap.get(artistName).push(song);
    });
    
    // Update stats
    if (totalArtistsEl) totalArtistsEl.textContent = artistMap.size;
    if (totalSongsEl) totalSongsEl.textContent = state.songs.length;
    
    // Get filter letter from URL or default
    const params = new URLSearchParams(window.location.search);
    const artistParam = params.get('artist');
    let activeLetter = params.get('letter') || 'all';
    let searchQuery = artistParam || '';
    
    // Filter artists
    let filteredArtists = [...artistMap.entries()];
    
    if (activeLetter !== 'all') {
        filteredArtists = filteredArtists.filter(([name]) => {
            const firstLetter = name.trim().charAt(0).toUpperCase();
            if (activeLetter === '0-9') return /\d/.test(firstLetter);
            return firstLetter === activeLetter;
        });
    }
    
    if (searchQuery) {
        filteredArtists = filteredArtists.filter(([name]) => 
            name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    // Sort alphabetically
    filteredArtists.sort((a, b) => a[0].localeCompare(b[0]));
    
    // Update count
    if (artistCountEl) {
        artistCountEl.textContent = `${filteredArtists.length} artis`;
    }
    
    // Render list
    container.replaceChildren();
    
    if (!filteredArtists.length) {
        const empty = document.createElement('p');
        empty.className = 'loading-state';
        empty.textContent = 'Artis tidak ditemukan.';
        container.appendChild(empty);
        return;
    }
    
    filteredArtists.forEach(([artistName, songs]) => {
        const item = document.createElement('div');
        item.className = 'artist-list-item';
        
        const info = document.createElement('div');
        info.className = 'artist-info-main';
        
        const link = document.createElement('a');
        link.className = 'artist-name-link';
        link.href = `index.html?q=${encodeURIComponent(artistName)}#song-catalog`;
        link.textContent = artistName;
        
        const countLabel = document.createElement('span');
        countLabel.className = 'artist-song-count-label';
        countLabel.textContent = `${songs.length} lagu`;
        
        info.append(link, countLabel);
        
        const viewLink = document.createElement('a');
        viewLink.className = 'view-songs-link';
        viewLink.href = `index.html?q=${encodeURIComponent(artistName)}#song-catalog`;
        viewLink.textContent = 'Lihat Lagu →';
        
        item.append(info, viewLink);
        container.appendChild(item);
    });
}

// Init Artists Page Interactions (BARU)
function initArtistsPageInteractions() {
    const container = document.getElementById('artistsList');
    if (!container) return;
    
    // Letter filter
    document.querySelectorAll('.artist-alphabet-nav [data-letter]').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const letter = button.dataset.letter;
            
            // Update active state
            document.querySelectorAll('.artist-alphabet-nav [data-letter]').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.letter === letter);
            });
            
            // Reload with new letter
            const url = new URL(window.location);
            if (letter === 'all') {
                url.searchParams.delete('letter');
            } else {
                url.searchParams.set('letter', letter);
            }
            url.searchParams.delete('artist');
            window.history.pushState({}, '', url);
            renderArtistsPage();
        });
    });
    
    // Search box
    const searchInput = document.getElementById('artistSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();
            const url = new URL(window.location);
            if (query) {
                url.searchParams.set('artist', query);
                url.searchParams.delete('letter');
                document.querySelectorAll('.artist-alphabet-nav [data-letter]').forEach((btn) => {
                    btn.classList.toggle('active', false);
                });
            } else {
                url.searchParams.delete('artist');
                document.querySelectorAll('.artist-alphabet-nav [data-letter="all"]').forEach((btn) => {
                    btn.classList.toggle('active', true);
                });
            }
            window.history.pushState({}, '', url);
            renderArtistsPage();
        });
    }
    
    renderArtistsPage();
}

initTheme();
initMobileMenu();
initHomepageInteractions();
loadSongs();

// Init Artists Page (call after songs are loaded)
document.addEventListener('DOMContentLoaded', () => {
    const artistsList = document.getElementById('artistsList');
    if (artistsList) {
        // Wait for songs to load, then render artists page
        const checkAndInit = setInterval(() => {
            if (state.songs.length > 0) {
                clearInterval(checkAndInit);
                initArtistsPageInteractions();
            }
        }, 100);
    }
});
