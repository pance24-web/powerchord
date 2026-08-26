let activeGenre = 'all';
let activeView = 'all';
let searchQuery = '';
let lagu = [];

const genreMatchers = {
    all: () => true,
    Pop: (genre) => genre === 'Pop' || genre.includes('Pop'),
    Rock: (genre) => genre === 'Rock' || genre.includes('Rock'),
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
    const songGenre = typeof song.genre === 'string' ? song.genre : '';
    const matcher = genreMatchers[genre];
    return matcher ? matcher(songGenre) : songGenre === genre;
}

function songId(song) {
    return lagu.indexOf(song);
}

function getDifficulty(song) {
    const chords = new Set(
        (Array.isArray(song.lirik) ? song.lirik : [])
            .map((line) => (typeof line.chord === 'string' ? line.chord.trim() : ''))
            .filter(Boolean)
    );
    if (chords.size <= 4) return 'Easy';
    if (chords.size <= 7) return 'Intermediate';
    return 'Advanced';
}

function songMatchesView(song) {
    if (activeView === 'easy') return getDifficulty(song) === 'Easy';
    if (activeView === 'four-chords') {
        const chords = new Set(
            (Array.isArray(song.lirik) ? song.lirik : [])
                .map((line) => (typeof line.chord === 'string' ? line.chord.trim() : ''))
                .filter(Boolean)
        );
        return chords.size <= 4;
    }
    return true;
}

/* ===== THEME TOGGLE ===== */
(function initThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;

    function currentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const isDark = theme === 'dark';
        toggleBtn.setAttribute('aria-pressed', String(isDark));
        toggleBtn.setAttribute('aria-label', isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
        toggleBtn.setAttribute('title', isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
    }

    setTheme(currentTheme());
    toggleBtn.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        setTheme(next);
        try { localStorage.setItem('theme', next); } catch (e) {}
    });
})();

/* ===== MOBILE MENU ===== */
(function initMobileMenu() {
    const menuButton = document.querySelector('.mobile-menu-button');
    const mobileNav = document.getElementById('mobileNav');
    if (!menuButton || !mobileNav) return;

    menuButton.addEventListener('click', () => {
        const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
        menuButton.setAttribute('aria-expanded', String(!isOpen));
        menuButton.setAttribute('aria-label', isOpen ? 'Buka menu' : 'Tutup menu');
        mobileNav.hidden = isOpen;
    });

    mobileNav.addEventListener('click', () => {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Buka menu');
        mobileNav.hidden = true;
    });
})();

function findCuratedSongs(preferredTitles, fallbackStart = 0, fallbackCount = 5) {
    const selected = preferredTitles
        .map((title) => lagu.find((song) => song.judul.toLowerCase() === title.toLowerCase()))
        .filter(Boolean);
    if (selected.length >= 3) return selected;
    const fallback = lagu.slice(fallbackStart, fallbackStart + fallbackCount);
    return [...selected, ...fallback.filter((song) => !selected.includes(song))].slice(0, fallbackCount);
}

function renderSongRow(song) {
    const row = document.createElement('a');
    row.href = `detail.html?id=${songId(song)}`;
    row.className = 'song-row';

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

    row.append(main, difficulty, key, arrow);
    return row;
}

function renderLatestRow(song) {
    const row = document.createElement('div');
    row.className = 'latest-row';
    const link = document.createElement('a');
    link.href = `detail.html?id=${songId(song)}`;
    link.textContent = `${song.judul} — ${song.artis}`;
    const date = document.createElement('span');
    date.className = 'latest-date';
    date.textContent = 'Chord terbaru';
    row.append(link, date);
    return row;
}

function renderCuratedSections() {
    const popularList = document.getElementById('popularList');
    const latestList = document.getElementById('latestList');

    if (popularList) {
        popularList.replaceChildren();
        const popularTitles = ['Yellow', 'Wonderwall', 'Stand By Me', 'Perfect'];
        findCuratedSongs(popularTitles, 0, 4).forEach((song) => popularList.appendChild(renderSongRow(song)));
    }

    if (latestList) {
        latestList.replaceChildren();
        const latestSongs = lagu.slice(-5).reverse();
        latestSongs.forEach((song) => latestList.appendChild(renderLatestRow(song)));
    }
}

function renderSongs(data) {
    const songList = document.getElementById('songList');
    if (!songList) return;
    songList.replaceChildren();

    const catalogCount = document.getElementById('catalogCount');
    if (catalogCount) catalogCount.textContent = `${data.length} lagu`;

    if (data.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'loading-state';
        empty.textContent = 'Tidak ada lagu yang sesuai dengan filter.';
        songList.appendChild(empty);
        return;
    }

    data.forEach((song) => songList.appendChild(renderSongRow(song)));
}

function filterSongs() {
    let filtered = lagu;

    if (activeGenre !== 'all') {
        filtered = filtered.filter((song) => matchesGenre(song, activeGenre));
    }

    if (activeView !== 'all') {
        filtered = filtered.filter(songMatchesView);
    }

    if (searchQuery.length >= 2) {
        filtered = filtered.filter((song) => {
            const title = typeof song.judul === 'string' ? song.judul.toLowerCase() : '';
            const artist = typeof song.artis === 'string' ? song.artis.toLowerCase() : '';
            return title.includes(searchQuery) || artist.includes(searchQuery);
        });
    }

    renderSongs(filtered);
}

function setCategoryActive(section) {
    document.querySelectorAll('.category-link').forEach((link) => {
        const active = link.dataset.section === section;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
}

function scrollToId(id) {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateSearchResults() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    if (!searchInput || !searchResults) return;

    searchResults.setAttribute('aria-busy', 'true');
    searchQuery = searchInput.value.toLowerCase().trim();
    filterSongs();

    if (searchQuery.length < 2) {
        searchResults.replaceChildren();
        searchResults.hidden = true;
        searchResults.setAttribute('aria-busy', 'false');
        return;
    }

    const filtered = lagu.filter((song) => {
        const title = typeof song.judul === 'string' ? song.judul.toLowerCase() : '';
        const artist = typeof song.artis === 'string' ? song.artis.toLowerCase() : '';
        return title.includes(searchQuery) || artist.includes(searchQuery);
    }).slice(0, 6);

    searchResults.replaceChildren();
    if (filtered.length > 0) {
        filtered.forEach((song) => {
            const link = document.createElement('a');
            link.href = `detail.html?id=${songId(song)}`;
            link.textContent = `${song.judul} — ${song.artis}`;
            searchResults.appendChild(link);
        });
    } else {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'search-empty';
        emptyMessage.textContent = 'Lagu tidak ditemukan';
        searchResults.appendChild(emptyMessage);
    }
    searchResults.hidden = false;
    searchResults.setAttribute('aria-busy', 'false');
}

function initHomepageInteractions() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchForm = document.getElementById('searchForm');

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', updateSearchResults);
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                searchInput.value = '';
                searchQuery = '';
                searchResults.replaceChildren();
                searchResults.hidden = true;
                filterSongs();
            }
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (searchInput && searchInput.value.trim().length >= 2) {
                searchResults.hidden = true;
                scrollToId('song-catalog');
            } else if (searchInput) {
                searchInput.focus();
            }
        });
    }

    document.querySelectorAll('[data-search]').forEach((button) => {
        button.addEventListener('click', () => {
            if (!searchInput) return;
            searchInput.value = button.dataset.search || '';
            updateSearchResults();
            searchInput.focus();
        });
    });

    document.querySelectorAll('.category-link').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const section = link.dataset.section;
            setCategoryActive(section);
            activeView = section === 'easy' ? 'easy' : section === 'four-chords' ? 'four-chords' : 'all';
            if (section !== 'genre') activeGenre = 'all';
            document.querySelectorAll('.genre-link').forEach((genreLink) => {
                const active = genreLink.dataset.genre === activeGenre;
                genreLink.classList.toggle('active', active);
                genreLink.setAttribute('aria-pressed', String(active));
            });
            filterSongs();
            const target = section === 'popular' ? 'popular' : section === 'latest' ? 'latest' : section === 'browse';
            scrollToId(target);
        });
    });

    document.querySelectorAll('.genre-link').forEach((button) => {
        button.addEventListener('click', () => {
            activeGenre = button.dataset.genre || 'all';
            activeView = 'all';
            document.querySelectorAll('.genre-link').forEach((genreLink) => {
                const active = genreLink === button;
                genreLink.classList.toggle('active', active);
                genreLink.setAttribute('aria-pressed', String(active));
            });
            setCategoryActive('genre');
            filterSongs();
            scrollToId('song-catalog');
        });
    });

    document.querySelectorAll('[data-focus-catalog]').forEach((link) => {
        link.addEventListener('click', () => scrollToId('song-catalog'));
    });

    document.addEventListener('click', (event) => {
        if (searchResults && !event.target.closest('.hero-search') && !event.target.closest('.search-results')) {
            searchResults.hidden = true;
        }
    });
}

async function loadSongs() {
    try {
        const response = await fetch('data/songs.json');
        if (!response.ok) throw new Error('Gagal memuat data');
        const songs = await response.json();
        if (!Array.isArray(songs)) throw new Error('Format data lagu tidak valid');
        lagu = songs;
        renderCuratedSections();
        filterSongs();
        initDetailPage();
    } catch (error) {
        console.error('Error:', error);
        const songList = document.getElementById('songList');
        if (songList) songList.textContent = 'Gagal memuat data lagu. Pastikan file songs.json tersedia.';
    }
}

initHomepageInteractions();
loadSongs();

/* ===== LOGIKA HALAMAN DETAIL ===== */
function initDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const rawSongId = urlParams.get('id');
    const songIdNumber = Number(rawSongId);
    const judulElem = document.getElementById('judulLagu');
    if (!judulElem) return;

    const showDetailError = (message) => {
        const artisElem = document.getElementById('artisLagu');
        const lirikContainer = document.getElementById('lirik');
        const transposeBox = document.querySelector('.transpose-box');
        const autoscrollBox = document.querySelector('.autoscroll-box');
        judulElem.textContent = message;
        if (artisElem) artisElem.textContent = '';
        if (lirikContainer) lirikContainer.textContent = '';
        if (transposeBox) transposeBox.hidden = true;
        if (autoscrollBox) autoscrollBox.hidden = true;
    };

    if (rawSongId === null || !Number.isInteger(songIdNumber) || songIdNumber < 0) {
        showDetailError('Lagu tidak ditemukan');
        return;
    }

    const song = lagu[songIdNumber];
    if (!song) {
        showDetailError('Lagu tidak ditemukan');
        return;
    }

    const artisElem = document.getElementById('artisLagu');
    if (artisElem) artisElem.textContent = song.artis;
    judulElem.textContent = song.judul;

    const detailMeta = document.querySelectorAll('.detail-meta span');
    if (detailMeta[0]) detailMeta[0].textContent = getDifficulty(song);
    if (detailMeta[1]) detailMeta[1].textContent = song.genre || 'Guitar';
    if (detailMeta[2]) detailMeta[2].textContent = `Original key: ${song.kunci || 'C'}`;

    const relatedSongs = document.getElementById('relatedSongs');
    if (relatedSongs) {
        relatedSongs.replaceChildren();
        lagu.filter((candidate) => candidate !== song).slice(0, 5).forEach((candidate) => {
            const link = document.createElement('a');
            link.href = `detail.html?id=${songId(candidate)}`;
            link.textContent = `${candidate.artis} — ${candidate.judul}`;
            relatedSongs.appendChild(link);
        });
    }

    let currentKey = song.kunci || 'C';
    let offset = 0;
    const keyDisplay = document.getElementById('keyNow');
    if (keyDisplay) keyDisplay.textContent = currentKey;

    const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const enharmonic = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

    function transposeChord(chord) {
        if (!chord) return '';
        return chord.replace(/[A-G](?:#|b)?/g, (root) => {
            const normalizedRoot = enharmonic[root] || root;
            const index = chromatic.indexOf(normalizedRoot);
            if (index === -1) return root;
            return chromatic[(index + offset + 12) % 12];
        });
    }

    function renderLirik() {
        const lirikContainer = document.getElementById('lirik');
        if (!lirikContainer) return;
        lirikContainer.replaceChildren();
        (Array.isArray(song.lirik) ? song.lirik : []).forEach((baris) => {
            const divBaris = document.createElement('div');
            divBaris.className = 'baris-lirik';
            const chordSpan = document.createElement('span');
            chordSpan.className = 'chord-lirik';
            chordSpan.textContent = transposeChord(baris.chord) || '\u00A0';
            const teksSpan = document.createElement('span');
            teksSpan.className = 'teks-lirik';
            teksSpan.textContent = baris.teks;
            divBaris.append(chordSpan, teksSpan);
            lirikContainer.appendChild(divBaris);
        });
    }

    renderLirik();

    const plusBtn = document.getElementById('plus');
    const minusBtn = document.getElementById('minus');
    const resetBtn = document.getElementById('reset');
    if (plusBtn) plusBtn.addEventListener('click', () => {
        offset = (offset + 1) % 12;
        renderLirik();
        if (keyDisplay) keyDisplay.textContent = transposeChord(currentKey);
    });
    if (minusBtn) minusBtn.addEventListener('click', () => {
        offset = (offset - 1 + 12) % 12;
        renderLirik();
        if (keyDisplay) keyDisplay.textContent = transposeChord(currentKey);
    });
    if (resetBtn) resetBtn.addEventListener('click', () => {
        offset = 0;
        renderLirik();
        if (keyDisplay) keyDisplay.textContent = currentKey;
    });

    const toggleScrollBtn = document.getElementById('toggleScroll');
    const scrollSlowBtn = document.getElementById('scrollSlow');
    const scrollFastBtn = document.getElementById('scrollFast');
    const speedDisplay = document.getElementById('speedDisplay');
    let isScrolling = false;
    let animationFrame = null;
    let lastFrameTime = 0;
    let scrollSpeed = 1;

    const updateScrollButton = () => {
        if (!toggleScrollBtn) return;
        toggleScrollBtn.classList.toggle('scrolling', isScrolling);
        toggleScrollBtn.textContent = isScrolling ? '⏸ Pause Scroll' : '▶ Autoscroll';
        toggleScrollBtn.setAttribute('aria-pressed', String(isScrolling));
    };

    const stopScroll = () => {
        isScrolling = false;
        if (animationFrame !== null) cancelAnimationFrame(animationFrame);
        animationFrame = null;
        lastFrameTime = 0;
        updateScrollButton();
    };

    const scrollFrame = (timestamp) => {
        if (!isScrolling) return;
        const elapsed = lastFrameTime ? timestamp - lastFrameTime : 16;
        lastFrameTime = timestamp;
        window.scrollBy(0, scrollSpeed * elapsed / 16);
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 20) {
            stopScroll();
            return;
        }
        animationFrame = requestAnimationFrame(scrollFrame);
    };

    if (toggleScrollBtn) {
        toggleScrollBtn.addEventListener('click', () => {
            if (isScrolling) stopScroll();
            else {
                isScrolling = true;
                lastFrameTime = 0;
                updateScrollButton();
                animationFrame = requestAnimationFrame(scrollFrame);
            }
        });
    }
    if (scrollFastBtn) scrollFastBtn.addEventListener('click', () => {
        if (scrollSpeed < 5) {
            scrollSpeed++;
            if (speedDisplay) speedDisplay.textContent = `${scrollSpeed}x`;
            if (isScrolling) { stopScroll(); toggleScrollBtn?.click(); }
        }
    });
    if (scrollSlowBtn) scrollSlowBtn.addEventListener('click', () => {
        if (scrollSpeed > 1) {
            scrollSpeed--;
            if (speedDisplay) speedDisplay.textContent = `${scrollSpeed}x`;
            if (isScrolling) { stopScroll(); toggleScrollBtn?.click(); }
        }
    });
}
