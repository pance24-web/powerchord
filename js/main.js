// State aktif
let activeGenre = 'all';
let searchQuery = '';
let lagu = []; // Data akan diisi dari JSON

/* ===== THEME TOGGLE ===== */
(function initThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;

    function currentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    toggleBtn.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
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
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
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
        lagu = await response.json();
        filterSongs(); // Tampilkan semua lagu setelah data dimuat
        initDetailPage(); // Inisialisasi halaman detail jika sedang di detail.html
    } catch (error) {
        console.error('Error:', error);
        const songList = document.getElementById('songList');
        if (songList) {
            songList.innerHTML = '<p style="padding:16px;">Gagal memuat data lagu. Pastikan file songs.json ada di folder data/.</p>';
        }
    }
}

// Render semua lagu (hanya judul & artis)
function renderSongs(data) {
    const songList = document.getElementById('songList');
    if (!songList) return;
    songList.innerHTML = '';

    if (data.length === 0) {
        songList.innerHTML = '<p style="padding:16px; color:#6c757d;">Tidak ada lagu ditemukan.</p>';
        return;
    }

    data.forEach((song, idx) => {
        const card = document.createElement('a');
        card.href = `detail.html?id=${idx}`;
        card.className = 'song-card';

        card.innerHTML = `
            <div class="card-title">${song.judul}</div>
            <div class="card-artist">${song.artis}</div>
        `;

        songList.appendChild(card);
    });
}

// Fungsi untuk memfilter lagu berdasarkan genre & search
function filterSongs() {
    let filtered = lagu;

    // Filter genre
    if (activeGenre !== 'all') {
        // Kategori gabungan (mengandung kata tertentu)
        if (activeGenre === 'Indie') {
            filtered = filtered.filter(song => song.genre.includes('Indie'));
        } else if (activeGenre === 'Folk') {
            filtered = filtered.filter(song => song.genre.includes('Folk'));
        } else if (activeGenre === 'Minang') {
            filtered = filtered.filter(song => song.genre === 'Pop Minang');
        } else if (activeGenre === 'Melayu') {
            filtered = filtered.filter(song => song.genre === 'Pop Melayu');
        } else {
            // Exact match untuk genre lain (Pop, Rock, Dangdut, Pop Rock, Reggae, Ska, dll.)
            filtered = filtered.filter(song => song.genre === activeGenre);
        }
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
        searchQuery = e.target.value.toLowerCase().trim();
        filterSongs();

        // Tampilkan autocomplete
        if (searchQuery.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const filtered = lagu.filter(song => 
            song.judul.toLowerCase().includes(searchQuery) || 
            song.artis.toLowerCase().includes(searchQuery)
        );

        if (filtered.length > 0) {
            searchResults.innerHTML = filtered.map(song => `
                <a href="detail.html?id=${lagu.indexOf(song)}">${song.judul} - ${song.artis}</a>
            `).join('');
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = `<a href="#">Lagu tidak ditemukan</a>`;
            searchResults.style.display = 'block';
        }
    });
}

// Klik genre chip
const genreChips = document.querySelectorAll('.chip');
genreChips.forEach(chip => {
    chip.addEventListener('click', () => {
        genreChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeGenre = chip.dataset.genre;
        filterSongs();
    });
});

// Sembunyikan hasil autocomplete saat klik di luar
document.addEventListener('click', (e) => {
    if (searchResults && !e.target.closest('.search-section')) {
        searchResults.style.display = 'none';
    }
});

// Jalankan saat halaman dimuat
loadSongs();

/* ===== LOGIKA HALAMAN DETAIL ===== */
function initDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const songId = parseInt(urlParams.get('id'));

    if (songId !== null && !isNaN(songId)) {
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

                    function transposeChord(chord) {
                        if (!chord) return '';
                        const regex = /^[A-G][#b]?/;
                        const match = chord.match(regex);
                        if (!match) return chord;
                        const root = match[0];
                        const index = chromatic.indexOf(root);
                        if (index === -1) return chord;
                        const newIndex = (index + offset + 12) % 12;
                        const newRoot = chromatic[newIndex];
                        return newRoot + chord.slice(root.length);
                    }

                    function renderLirik() {
                        const lirikContainer = document.getElementById('lirik');
                        if (!lirikContainer) return;
                        lirikContainer.innerHTML = '';

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
                    let scrollInterval = null;
                    let scrollSpeed = 1;

                    const startScroll = () => {
                        if (isScrolling) return;
                        isScrolling = true;
                        if (toggleScrollBtn) {
                            toggleScrollBtn.classList.add('scrolling');
                            toggleScrollBtn.textContent = '⏸ Pause Scroll';
                        }
                        scrollInterval = setInterval(() => {
                            window.scrollBy({ top: scrollSpeed, behavior: 'smooth' });
                            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 20) {
                                stopScroll();
                            }
                        }, 50);
                    };

                    const stopScroll = () => {
                        isScrolling = false;
                        clearInterval(scrollInterval);
                        if (toggleScrollBtn) {
                            toggleScrollBtn.classList.remove('scrolling');
                            toggleScrollBtn.textContent = '▶ Autoscroll';
                        }
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
                }
            } catch (error) {
                console.error('Error:', error);
                const lirikContainer = document.getElementById('lirik');
                if (lirikContainer) lirikContainer.innerHTML = '<p>Gagal memuat lagu.</p>';
            }
        }

        loadDetailSong();
    }
}