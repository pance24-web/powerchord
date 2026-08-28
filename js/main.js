document.addEventListener('DOMContentLoaded', function () {
    const DATA_URL = 'data/songs.json';
    const STORAGE_KEY = 'powerchord_views';

    // ========================================
    // 1. LOAD DATA & ROUTING OTOMATIS
    // ========================================
    fetch(DATA_URL)
        .then(res => {
            if (!res.ok) throw new Error('Gagal memuat data lagu.');
            return res.json();
        })
        .then(songs => {
            // Cek halaman mana yang sedang dibuka
            const isDetail = document.getElementById('song-detail') !== null;
            const isArtistPage = document.getElementById('artists-container') !== null;
            const isHome = document.getElementById('popular-list') !== null;

            if (isHome) {
                renderPopularSongs(songs);
                renderAlphabetHome(songs);
                setupSearch(songs);
            }

            if (isDetail) {
                loadSongDetail(songs);
            }

            if (isArtistPage) {
                renderArtistsPage(songs);
            }

            // Setup dark mode toggle (jika ada tombol)
            setupDarkMode();
        })
        .catch(err => {
            console.error('Error:', err);
            const container = document.getElementById('popular-list') || document.getElementById('artists-container');
            if (container) container.innerHTML = '<p style="color:red;">⚠️ Gagal memuat data. Pastikan file songs.json ada.</p>';
        });

    // ========================================
    // 2. HALAMAN BERANDA - POPULER & ALPHABET
    // ========================================
    function renderPopularSongs(songs) {
        const container = document.getElementById('popular-list');
        if (!container) return;

        const views = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        const sorted = [...songs].sort((a, b) => (views[b.id] || 0) - (views[a.id] || 0));
        const top5 = sorted.slice(0, 5);

        if (top5.length === 0 || top5.every(s => (views[s.id] || 0) === 0)) {
            container.innerHTML = '<p style="padding:16px;color:#888;">Belum ada data populer. Mainkan lagu dulu yuk! 🎸</p>';
            return;
        }

        container.innerHTML = top5.map(song => `
            <div class="song-item">
                <span>🎵 <strong>${song.judul}</strong> - ${song.artis}</span>
                <span class="view-count">👁️ ${views[song.id] || 0} kali</span>
            </div>
        `).join('');
    }

    function renderAlphabetHome(songs) {
        const container = document.getElementById('alphabet-home');
        if (!container) return;

        const letters = [...new Set(songs.map(s => s.judul.charAt(0).toUpperCase()))].sort();
        container.innerHTML = letters.map(l => `<a href="index.html?letter=${l}">${l}</a>`).join('');
        
        // Highlight huruf aktif dari URL
        const params = new URLSearchParams(window.location.search);
        const activeLetter = params.get('letter');
        if (activeLetter) {
            container.querySelectorAll('a').forEach(a => {
                if (a.textContent === activeLetter) a.classList.add('active');
            });
            filterByLetter(songs, activeLetter);
        } else {
            // Tampilkan semua lagu jika tidak ada filter
            renderSongCatalog(songs);
        }
    }

    function filterByLetter(songs, letter) {
        const filtered = songs.filter(s => s.judul.charAt(0).toUpperCase() === letter);
        renderSongCatalog(filtered, `Menampilkan ${filtered.length} lagu dengan huruf ${letter}`);
    }

    function renderSongCatalog(songs, infoText = '') {
        const container = document.getElementById('song-catalog');
        if (!container) return;

        if (songs.length === 0) {
            container.innerHTML = '<p style="padding:20px;color:#888;">Tidak ada lagu dengan huruf tersebut.</p>';
            return;
        }

        container.innerHTML = songs.map(song => `
            <a href="detail.html?id=${song.id}" class="song-item-link">
                <span>
                    <span class="title">🎵 ${song.judul}</span>
                    <span class="artist"> - ${song.artis}</span>
                </span>
                <span class="genre-tag">${song.genre || 'Umum'}</span>
            </a>
        `).join('');

        if (infoText) {
            const info = document.createElement('p');
            info.style.cssText = 'padding:12px 4px;color:#888;font-size:14px;';
            info.textContent = infoText;
            container.parentNode.insertBefore(info, container);
        }
    }

    // ========================================
    // 3. HALAMAN DETAIL LAGU
    // ========================================
    function loadSongDetail(songs) {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (!id) {
            document.getElementById('song-detail').innerHTML = '<p style="color:red;">ID lagu tidak ditemukan.</p>';
            return;
        }

        const song = songs.find(s => s.id === id);
        if (!song) {
            document.getElementById('song-detail').innerHTML = `<p style="color:red;">Lagu dengan ID "${id}" tidak ditemukan.</p>`;
            return;
        }

        // Render detail
        document.getElementById('song-title').textContent = song.judul;
        document.getElementById('song-artist').textContent = song.artis;
        document.getElementById('song-genre').textContent = `🏷️ ${song.genre || 'Umum'}`;
        
        // Render chord (contoh sederhana)
        const chordDisplay = document.getElementById('chord-display');
        if (chordDisplay) {
            chordDisplay.innerHTML = song.chord ? song.chord.replace(/\n/g, '<br>') : '<i>Chord belum tersedia.</i>';
        }

        // 3A. Breadcrumb
        const artistLink = document.getElementById('breadcrumb-artist');
        const current = document.getElementById('breadcrumb-current');
        if (artistLink) {
            artistLink.href = `artists.html?artist=${encodeURIComponent(song.artis)}`;
            artistLink.textContent = `🎤 ${song.artis}`;
        }
        if (current) {
            current.textContent = song.judul;
        }

        // 3B. Counter Views (Populer)
        incrementViewCount(id);

        // 3C. Setup Transpose (opsional, sederhana)
        setupTranspose(song);
    }

    function incrementViewCount(songId) {
        const views = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        views[songId] = (views[songId] || 0) + 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
    }

    // ========================================
    // 4. TRANSPOSE SEDERHANA (Demo)
    // ========================================
    function setupTranspose(song) {
        const upBtn = document.getElementById('transpose-up');
        const downBtn = document.getElementById('transpose-down');
        const resetBtn = document.getElementById('transpose-reset');
        const display = document.getElementById('chord-display');
        let currentOffset = 0;

        if (!upBtn || !display) return;

        const chords = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        function transposeChord(chord, offset) {
            const match = chord.match(/^([A-G]#?)(.*)/);
            if (!match) return chord;
            const base = match[1];
            const rest = match[2] || '';
            const idx = chords.indexOf(base);
            if (idx === -1) return chord;
            const newIdx = (idx + offset + 12) % 12;
            return chords[newIdx] + rest;
        }

        function applyTranspose(offset) {
            if (!song.chord) return;
            const lines = song.chord.split('\n');
            const transposedLines = lines.map(line => {
                return line.replace(/\b[A-G]#?(?:m|maj|sus|add|dim)?\d?\b/g, (match) => {
                    return transposeChord(match, offset);
                });
            });
            display.innerHTML = transposedLines.join('<br>');
        }

        upBtn.addEventListener('click', () => {
            currentOffset = (currentOffset + 1) % 12;
            applyTranspose(currentOffset);
        });
        downBtn.addEventListener('click', () => {
            currentOffset = (currentOffset - 1 + 12) % 12;
            applyTranspose(currentOffset);
        });
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                currentOffset = 0;
                display.innerHTML = song.chord ? song.chord.replace(/\n/g, '<br>') : '<i>Chord belum tersedia.</i>';
            });
        }
    }

    // ========================================
    // 5. HALAMAN ARTIS
    // ========================================
    function renderArtistsPage(songs) {
        const container = document.getElementById('artists-container');
        if (!container) return;

        // Kelompokkan berdasarkan artis
        const artistMap = new Map();
        songs.forEach(song => {
            const key = song.artis.trim().toLowerCase();
            if (!artistMap.has(key)) {
                artistMap.set(key, { artis: song.artis, songs: [] });
            }
            artistMap.get(key).songs.push(song.judul);
        });

        let artists = Array.from(artistMap.values());
        artists.sort((a, b) => a.artis.localeCompare(b.artis));

        // Filter jika ada query param ?artist=
        const params = new URLSearchParams(window.location.search);
        const filterArtist = params.get('artist');
        if (filterArtist) {
            const decoded = decodeURIComponent(filterArtist).toLowerCase();
            artists = artists.filter(a => a.artis.toLowerCase().includes(decoded));
        }

        // Render Group
        const grouped = {};
        artists.forEach(artist => {
            const firstChar = artist.artis.charAt(0).toUpperCase();
            if (!grouped[firstChar]) grouped[firstChar] = [];
            grouped[firstChar].push(artist);
        });

        let html = '';
        const sortedKeys = Object.keys(grouped).sort();
        if (sortedKeys.length === 0) {
            html = '<p style="padding:20px;color:#888;">Tidak ada artis ditemukan.</p>';
        } else {
            sortedKeys.forEach(letter => {
                html += `<div class="artist-group" data-letter="${letter}">`;
                html += `<div class="artist-letter">${letter}</div>`;
                grouped[letter].forEach(artist => {
                    html += `
                        <div class="artist-item">
                            <span class="artist-name">${artist.artis}</span>
                            <span>
                                <span class="artist-count">${artist.songs.length} lagu</span>
                                <a href="index.html?search=${encodeURIComponent(artist.artis)}" class="artist-link-btn">Lihat Lagu →</a>
                            </span>
                        </div>
                    `;
                });
                html += `</div>`;
            });
        }
        container.innerHTML = html;

        // Render Alphabet Filter atas
        renderArtistAlphabet(sortedKeys);
    }

    function renderArtistAlphabet(letters) {
        const container = document.getElementById('alphabet-filter-artist');
        if (!container) return;
        container.innerHTML = letters.map(l => 
            `<a href="#${l}" onclick="document.querySelector('.artist-group[data-letter="${l}"]')?.scrollIntoView({behavior:'smooth'})">${l}</a>`
        ).join('');
    }

    // ========================================
    // 6. SEARCH FUNCTION (Homepage)
    // ========================================
    function setupSearch(songs) {
        const input = document.getElementById('search-input');
        if (!input) return;

        input.addEventListener('input', function () {
            const query = this.value.toLowerCase().trim();
            const container = document.getElementById('song-catalog');
            if (!container) return;

            if (query.length < 2) {
                // Reset ke tampilan awal atau alfabet
                const letter = new URLSearchParams(window.location.search).get('letter');
                if (letter) filterByLetter(songs, letter);
                else renderSongCatalog(songs);
                return;
            }

            const filtered = songs.filter(s => 
                s.judul.toLowerCase().includes(query) || 
                s.artis.toLowerCase().includes(query)
            );
            renderSongCatalog(filtered, `Hasil pencarian untuk "${query}" (${filtered.length} ditemukan)`);
        });

        // Jika ada ?search= di URL
        const params = new URLSearchParams(window.location.search);
        const searchQuery = params.get('search');
        if (searchQuery) {
            input.value = searchQuery;
            input.dispatchEvent(new Event('input'));
        }
    }

    // ========================================
    // 7. STICKY BACK BUTTON (Global)
    // ========================================
    window.goBackToCatalog = function () {
        if (document.referrer && document.referrer.includes(window.location.host)) {
            window.history.back();
        } else {
            window.location.href = 'index.html';
        }
    };

    // ========================================
    // 8. DARK MODE
    // ========================================
    function setupDarkMode() {
        const toggleBtn = document.getElementById('dark-mode-toggle');
        if (!toggleBtn) return;

        const isDark = localStorage.getItem('powerchord_dark') === 'true';
        if (isDark) document.body.classList.add('dark-mode');

        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const now = document.body.classList.contains('dark-mode');
            localStorage.setItem('powerchord_dark', now);
            toggleBtn.textContent = now ? '☀️' : '🌙';
        });

        toggleBtn.textContent = isDark ? '☀️' : '🌙';
    }
});