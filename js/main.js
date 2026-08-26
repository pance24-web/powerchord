let searchQuery = '';
let activeGenre = 'all';
let songs = [];

const genreMatchers = {
    all: () => true,
    Pop: (genre) => genre.includes('Pop'),
    Rock: (genre) => genre.includes('Rock'),
    Dangdut: (genre) => genre.includes('Dangdut'),
    Indie: (genre) => genre.includes('Indie'),
    Reggae: (genre) => genre.includes('Reggae'),
    Minang: (genre) => genre.includes('Minang'),
    Melayu: (genre) => genre.includes('Melayu'),
    Ska: (genre) => genre.includes('Ska'),
    Folk: (genre) => genre.includes('Folk'),
    Worship: (genre) => genre.includes('Worship'),
    Acoustic: (genre) => genre.includes('Acoustic') || genre.includes('Akustik')
};

function matchesGenre(song, genre) {
    const value = typeof song.genre === 'string' ? song.genre : '';
    const matcher = genreMatchers[genre];
    return matcher ? matcher(value) : value === genre;
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

function createSongRow(song) {
    const link = document.createElement('a');
    link.className = 'song-row';
    link.href = `detail.html?id=${getSongIndex(song)}`;

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
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';

    link.append(main, difficulty, key, arrow);
    return link;
}

function createLatestRow(song) {
    const row = document.createElement('div');
    row.className = 'latest-row';
    const link = document.createElement('a');
    link.href = `detail.html?id=${getSongIndex(song)}`;
    link.textContent = `${song.judul} — ${song.artis}`;
    const label = document.createElement('span');
    label.className = 'latest-date';
    label.textContent = 'Chord terbaru';
    row.append(link, label);
    return row;
}

function renderRows(container, list, rowFactory) {
    if (!container) return;
    container.replaceChildren();
    if (!list.length) {
        const empty = document.createElement('p');
        empty.className = 'loading-state';
        empty.textContent = 'Tidak ada lagu ditemukan.';
        container.appendChild(empty);
        return;
    }
    list.forEach((song) => container.appendChild(rowFactory(song)));
}

function renderHomepage() {
    const latest = songs.slice(-5).reverse();
    const popular = songs.slice(0, 5);
    renderRows(document.getElementById('songList'), latest, createSongRow);
    renderRows(document.getElementById('newSongList'), latest, (song) => {
        const link = document.createElement('a');
        link.href = `detail.html?id=${getSongIndex(song)}`;
        link.textContent = `${song.artis} — ${song.judul}`;
        return link;
    });
    renderRows(document.getElementById('popularSongList'), popular, (song) => {
        const link = document.createElement('a');
        link.href = `detail.html?id=${getSongIndex(song)}`;
        link.textContent = `${song.artis} — ${song.judul}`;
        return link;
    });
    renderRows(document.getElementById('catalogList'), songs, createSongRow);

    const latestCount = document.getElementById('latestCount');
    const catalogCount = document.getElementById('catalogCount');
    if (latestCount) latestCount.textContent = `${latest.length} lagu`;
    if (catalogCount) catalogCount.textContent = `${songs.length} lagu`;
}

function getFilteredSongs() {
    return songs.filter((song) => {
        const genreMatch = activeGenre === 'all' || matchesGenre(song, activeGenre);
        const query = searchQuery.toLowerCase();
        const textMatch = !query || song.judul.toLowerCase().includes(query) || song.artis.toLowerCase().includes(query);
        return genreMatch && textMatch;
    });
}

function renderSearchResults(filtered) {
    const results = document.getElementById('searchResults');
    if (!results) return;
    results.replaceChildren();
    if (searchQuery.length < 2) {
        results.hidden = true;
        return;
    }

    const matches = filtered.slice(0, 6);
    if (!matches.length) {
        const empty = document.createElement('p');
        empty.className = 'search-empty';
        empty.textContent = 'Lagu tidak ditemukan';
        results.appendChild(empty);
    } else {
        matches.forEach((song) => {
            const link = document.createElement('a');
            link.href = `detail.html?id=${getSongIndex(song)}`;
            link.textContent = `${song.judul} — ${song.artis}`;
            results.appendChild(link);
        });
    }
    results.hidden = false;
}

function filterHomepage() {
    const filtered = getFilteredSongs();
    const isFiltered = searchQuery.length > 0 || activeGenre !== 'all';
    const latestList = document.getElementById('songList');
    const catalogList = document.getElementById('catalogList');

    if (isFiltered) {
        renderRows(latestList, filtered, createSongRow);
        renderRows(catalogList, filtered, createSongRow);
    } else {
        renderRows(latestList, songs.slice(-5).reverse(), createSongRow);
        renderRows(catalogList, songs, createSongRow);
    }

    const latestCount = document.getElementById('latestCount');
    const catalogCount = document.getElementById('catalogCount');
    if (latestCount) latestCount.textContent = `${isFiltered ? filtered.length : Math.min(5, songs.length)} lagu`;
    if (catalogCount) catalogCount.textContent = `${isFiltered ? filtered.length : songs.length} lagu`;
    renderSearchResults(filtered);
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
        filterHomepage();
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            input.value = '';
            searchQuery = '';
            filterHomepage();
        }
    });

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            filterHomepage();
            const catalog = document.getElementById('song-catalog');
            if (catalog) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    document.addEventListener('click', (event) => {
        const results = document.getElementById('searchResults');
        if (results && !event.target.closest('.header-search') && !event.target.closest('.search-results')) {
            results.hidden = true;
        }
    });
}

async function loadSongs() {
    try {
        const response = await fetch('data/songs.json');
        if (!response.ok) throw new Error('Gagal memuat data lagu');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Format data lagu tidak valid');
        songs = data;
        if (document.getElementById('songList')) {
            renderHomepage();
            filterHomepage();
        }
        initDetailPage();
    } catch (error) {
        console.error(error);
        const target = document.getElementById('songList') || document.getElementById('lirik');
        if (target) target.textContent = 'Gagal memuat data lagu.';
    }
}

initMobileMenu();
initHomepageInteractions();
loadSongs();

/* ===== HALAMAN DETAIL ===== */
function initDetailPage() {
    const titleElement = document.getElementById('judulLagu');
    if (!titleElement) return;

    const params = new URLSearchParams(window.location.search);
    const rawId = params.get('id');
    const index = Number(rawId);
    const song = Number.isInteger(index) && index >= 0 ? songs[index] : null;

    const showError = (message) => {
        titleElement.textContent = message;
        const artist = document.getElementById('artisLagu');
        const lyrics = document.getElementById('lirik');
        if (artist) artist.textContent = '';
        if (lyrics) lyrics.textContent = '';
        document.querySelector('.control-bar')?.setAttribute('hidden', 'true');
    };

    if (!song) {
        showError('Lagu tidak ditemukan');
        return;
    }

    titleElement.textContent = song.judul;
    const artistElement = document.getElementById('artisLagu');
    if (artistElement) artistElement.textContent = song.artis;

    const meta = document.querySelectorAll('.detail-meta span');
    if (meta[0]) meta[0].textContent = getDifficulty(song);
    if (meta[1]) meta[1].textContent = song.genre || 'Guitar';
    if (meta[2]) meta[2].textContent = `Original key: ${song.kunci || 'C'}`;

    const related = document.getElementById('relatedSongs');
    if (related) {
        renderRows(related, songs.filter((item) => item !== song).slice(0, 5), (item) => {
            const link = document.createElement('a');
            link.href = `detail.html?id=${getSongIndex(item)}`;
            link.textContent = `${item.artis} — ${item.judul}`;
            return link;
        });
    }

    let offset = 0;
    const keyDisplay = document.getElementById('keyNow');
    const originalKey = song.kunci || 'C';
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
