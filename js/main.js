// State aktif
let activeGenre = 'all';
let searchQuery = '';
let lagu = []; // Data akan diisi dari JSON

const genreMatchers = {
    all: () => true,
    Pop: (genre) => genre === 'Pop',
    Rock: (genre) => genre === 'Rock' || genre.includes('Rock'),
    Dangdut: (genre) => genre === 'Dangdut',
    'Pop Rock': (genre) => genre === 'Pop Rock',
    Indie: (genre) => genre.includes('Indie'),
    Reggae: (genre) => genre === 'Reggae',
    Minang: (genre) => genre === 'Pop Minang',
    Melayu: (genre) => genre === 'Pop Melayu',
    Ska: (genre) => genre === 'Ska',
    Folk: (genre) => genre.includes('Folk')
};

function matchesGenre(song, genre) {
    const songGenre = typeof song.genre === 'string' ? song.genre : '';
    const matcher = genreMatchers[genre];
    return matcher ? matcher(songGenre) : songGenre === genre;
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
        try {
            localStorage.setItem('theme', next);
        } catch (e) {
            // localStorage mungkin tidak tersedia (mis. mode privat)
        }
    });

    // Ikuti perubahan preferensi sistem HANYA jika pengguna belum memilih manual
    try {
        if (!localStorage.getItem('theme') && window.matchMedia) {
            const mql = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e) => {
                setTheme(e.matches ? 'dark' : 'light');
            };
            if (mql.addEventListener) mql.addEventListener('change', handler);
            else if (mql.addListener) mql.addListener(handler);
        }
    } catch (e) {}
})();

// Fungsi untuk memuat data dari JSON
async function loadSongs() {
    try {
        const response = await fetch('data/songs.json');
        if (!response.ok) {
            throw new Error('Gagal memuat data');
        }
        const songs = await response.json();
        if (!Array.isArray(songs)) {
            throw new Error('Format data lagu tidak valid');
        }
        lagu = songs;
        filterSongs(); // Tampilkan semua lagu setelah data dimuat
        initDetailPage(); // Inisialisasi halaman detail jika sedang di detail.html
    } catch (error) {
        console.error('Error:', error);
        const songList = document.getElementById('songList');
        if (songList) {
            songList.textContent = 'Gagal memuat data lagu. Pastikan file songs.json ada di folder data/.';
        }
    }
}

// Render semua lagu (hanya judul & artis)
function renderSongs(data) {
    const songList = document.getElementById('songList');
    if (!songList) return;
    songList.replaceChildren();

    if (data.length === 0) {
        songList.textContent = 'Tidak ada lagu ditemukan.';
        return;
    }

    data.forEach((song) => {
        const originalIndex = lagu.indexOf(song);
        const card = document.createElement('a');
        card.href = originalIndex >= 0 ? `detail.html?id=${originalIndex}` : '#';
        card.className = 'song-card';

        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = song.judul;

        const artist = document.createElement('div');
        artist.className = 'card-artist';
        artist.textContent = song.artis;

        card.append(title, artist);
        songList.appendChild(card);
    });
}

// Fungsi untuk memfilter lagu berdasarkan genre & search
function filterSongs() {
    let filtered = lagu;

    // Filter genre menggunakan aturan yang konsisten untuk kategori utama dan subgenre.
    if (activeGenre !== 'all') {
        filtered = filtered.filter(song => matchesGenre(song, activeGenre));
    }

    // Filter pencarian (jika ada)
    if (searchQuery.length >= 2) {
        filtered = filtered.filter(song => 
            song.judul.toLowerCase().includes(searchQuery) || 
            song.artis.toLowerCase().includes(searchQuery)
        );
    }

    renderSongs(filtered);
}

// Pencarian
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

if (searchInput && searchResults) {
    searchInput.addEventListener('input', (e) => {
        searchResults.setAttribute('aria-busy', 'true');
        searchQuery = e.target.value.toLowerCase().trim();
        filterSongs();

        // Tampilkan autocomplete
        if (searchQuery.length < 2) {
            searchResults.replaceChildren();
            searchResults.hidden = true;
            searchResults.setAttribute('aria-busy', 'false');
            return;
        }

        const filtered = lagu.filter(song =>
            song.judul.toLowerCase().includes(searchQuery) ||
            song.artis.toLowerCase().includes(searchQuery)
        );

        searchResults.replaceChildren();
        if (filtered.length > 0) {
            filtered.forEach(song => {
                const link = document.createElement('a');
                link.href = `detail.html?id=${lagu.indexOf(song)}`;
                link.textContent = `${song.judul} - ${song.artis}`;
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
    });
}

// Klik genre chip
const genreChips = document.querySelectorAll('.chip');
genreChips.forEach(chip => {
    chip.addEventListener('click', () => {
        genreChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeGenre = chip.dataset.genre;
        genreChips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
        filterSongs();
    });
});

// Sembunyikan hasil autocomplete saat klik di luar
document.addEventListener('click', (e) => {
    if (searchResults && !e.target.closest('.search-section')) {
        searchResults.hidden = true;
    }
});

if (searchInput && searchResults) {
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchResults.replaceChildren();
            searchResults.hidden = true;
            searchInput.value = '';
            searchQuery = '';
            filterSongs();
        }
    });
}

// Jalankan saat halaman dimuat
loadSongs();

/* ===== LOGIKA HALAMAN DETAIL ===== */
function initDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const rawSongId = urlParams.get('id');
    const songId = Number(rawSongId);

    const showDetailError = (message) => {
        const judulElem = document.getElementById('judulLagu');
        const artisElem = document.getElementById('artisLagu');
        const lirikContainer = document.getElementById('lirik');
        const transposeBox = document.querySelector('.transpose-box');
        const autoscrollBox = document.querySelector('.autoscroll-box');
        if (judulElem) judulElem.textContent = message;
        if (artisElem) artisElem.textContent = '';
        if (lirikContainer) lirikContainer.textContent = '';
        if (transposeBox) transposeBox.hidden = true;
        if (autoscrollBox) autoscrollBox.hidden = true;
    };

    if (rawSongId === null || !Number.isInteger(songId) || songId < 0) {
        if (document.getElementById('judulLagu')) showDetailError('Lagu tidak ditemukan');
        return;
    }

    {
        async function loadDetailSong() {
            try {
                let song = lagu[songId];
                if (!song) {
                    const response = await fetch('data/songs.json');
                    if (!response.ok) throw new Error('Gagal memuat data');
                    const songs = await response.json();
                    song = songs[songId];
                }

                if (song) {
                    const judulElem = document.getElementById('judulLagu');
                    const artisElem = document.getElementById('artisLagu');
                    if (judulElem) judulElem.textContent = song.judul;
                    if (artisElem) artisElem.textContent = song.artis;

                    let currentKey = song.kunci || 'C';
                    let offset = 0;
                    const keyDisplay = document.getElementById('keyNow');
                    if (keyDisplay) keyDisplay.textContent = currentKey;

                    const chromatic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
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

                        if (song.lirik && Array.isArray(song.lirik)) {
                            song.lirik.forEach(baris => {
                                const divBaris = document.createElement('div');
                                divBaris.className = 'baris-lirik';

                                const chordSpan = document.createElement('span');
                                chordSpan.className = 'chord-lirik';
                                chordSpan.textContent = transposeChord(baris.chord) || '\u00A0';

                                const teksSpan = document.createElement('span');
                                teksSpan.className = 'teks-lirik';
                                teksSpan.textContent = baris.teks;

                                divBaris.appendChild(chordSpan);
                                divBaris.appendChild(teksSpan);
                                lirikContainer.appendChild(divBaris);
                            });
                        }
                    }

                    renderLirik();

                    const plusBtn = document.getElementById('plus');
                    const minusBtn = document.getElementById('minus');
                    const resetBtn = document.getElementById('reset');

                    if (plusBtn) {
                        plusBtn.addEventListener('click', () => {
                            offset = (offset + 1) % 12;
                            renderLirik();
                            if (keyDisplay) keyDisplay.textContent = transposeChord(currentKey);
                        });
                    }

                    if (minusBtn) {
                        minusBtn.addEventListener('click', () => {
                            offset = (offset - 1 + 12) % 12;
                            renderLirik();
                            if (keyDisplay) keyDisplay.textContent = transposeChord(currentKey);
                        });
                    }

                    if (resetBtn) {
                        resetBtn.addEventListener('click', () => {
                            offset = 0;
                            renderLirik();
                            if (keyDisplay) keyDisplay.textContent = currentKey;
                        });
                    }

                    // Autoscroll Logic
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

                    const scrollFrame = (timestamp) => {
                        if (!isScrolling) return;
                        const elapsed = lastFrameTime ? timestamp - lastFrameTime : 16;
                        lastFrameTime = timestamp;
                        window.scrollBy(0, scrollSpeed * elapsed / 16);
                        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 20) {
                            stopScroll();
                            return;
                        }
                        animationFrame = requestAnimationFrame(scrollFrame);
                    };

                    const startScroll = () => {
                        if (isScrolling) return;
                        isScrolling = true;
                        lastFrameTime = 0;
                        updateScrollButton();
                        animationFrame = requestAnimationFrame(scrollFrame);
                    };

                    const stopScroll = () => {
                        isScrolling = false;
                        if (animationFrame !== null) cancelAnimationFrame(animationFrame);
                        animationFrame = null;
                        lastFrameTime = 0;
                        updateScrollButton();
                    };

                    if (toggleScrollBtn) {
                        toggleScrollBtn.addEventListener('click', () => {
                            if (isScrolling) stopScroll();
                            else startScroll();
                        });
                    }

                    if (scrollFastBtn) {
                        scrollFastBtn.addEventListener('click', () => {
                            if (scrollSpeed < 5) {
                                scrollSpeed++;
                                if (speedDisplay) speedDisplay.textContent = `${scrollSpeed}x`;
                                if (isScrolling) { stopScroll(); startScroll(); }
                            }
                        });
                    }

                    if (scrollSlowBtn) {
                        scrollSlowBtn.addEventListener('click', () => {
                            if (scrollSpeed > 1) {
                                scrollSpeed--;
                                if (speedDisplay) speedDisplay.textContent = `${scrollSpeed}x`;
                                if (isScrolling) { stopScroll(); startScroll(); }
                            }
                        });
                    }
                } else {
                    showDetailError('Lagu tidak ditemukan');
                }
            } catch (error) {
                console.error('Error:', error);
                const lirikContainer = document.getElementById('lirik');
                if (lirikContainer) lirikContainer.textContent = 'Gagal memuat lagu.';
            }
        }

        loadDetailSong();
    }
}