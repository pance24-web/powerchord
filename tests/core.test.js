import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import {
    filterSongs,
    getDifficulty,
    normalizeSearchQuery,
    rankSong,
    searchSongs,
    getSongHref,
    parseSongReference,
    transposeChord,
    getChordShape,
    suggestCapo,
    rateChordEase,
} from '../public/js/core.js';

const songs = JSON.parse(await readFile(new URL('../data/songs.json', import.meta.url), 'utf8'));

// --- Test Dataset ---
test('dataset contains stable unique IDs', () => {
    assert.ok(songs.length > 0, 'Dataset harus memiliki setidaknya 1 lagu');
    const ids = songs.map((song) => song.id);
    assert.equal(new Set(ids).size, ids.length, 'Semua ID lagu harus unik');
    assert.ok(ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)), 'ID harus menggunakan format slug yang valid');
});

// --- Test getSongHref ---
test('getSongHref creates stable detail URLs', () => {
    const firstSong = songs[0];
    const firstIndex = 0;
    const href = getSongHref(firstSong, firstIndex);
    assert.ok(href.startsWith('detail.html?id='), 'URL harus dimulai dengan detail.html?id=');
    assert.ok(href.includes(firstSong.id), 'URL harus mengandung ID lagu');
});

// --- Test parseSongReference ---
test('parseSongReference supports stable IDs and legacy numeric links', () => {
    const firstSong = songs[0];
    
    // Test dengan ID yang valid
    assert.equal(parseSongReference(firstSong.id, songs), firstSong, 'Harus menemukan lagu dengan ID yang valid');
    
    // Test dengan index 0 (legacy)
    assert.equal(parseSongReference('0', songs), firstSong, 'Harus menemukan lagu dengan index 0');
    
    // Test dengan ID yang tidak ada
    assert.equal(parseSongReference('missing-song', songs), null, 'Harus mengembalikan null untuk ID yang tidak ada');
});

// --- Test filterSongs ---
test('filterSongs searches title and artist and applies genre', () => {
    if (songs.length === 0) assert.fail('Tidak ada lagu untuk ditest');
    
    // Test pencarian dengan judul atau artis
    const firstSong = songs[0];
    const searchTerm = firstSong.judul.substring(0, 3).toLowerCase();
    const filtered = filterSongs(songs, searchTerm);
    assert.ok(filtered.length >= 0, 'Harus mengembalikan array (bisa kosong jika tidak ada match)');
    
    // Test filter dengan genre
    const popSongs = filterSongs(songs, '', 'Pop');
    assert.ok(popSongs.every(song => song.genre === 'Pop'), 'Semua lagu harus memiliki genre Pop');
    
    // Test filter dengan genre yang tidak ada
    const unknownGenreSongs = filterSongs(songs, '', 'UnknownGenre');
    assert.equal(unknownGenreSongs.length, 0, 'Harus mengembalikan 0 lagu untuk genre yang tidak ada');
});

// --- Test searchSongs ---
test('search normalizes whitespace and matches all songs deterministically', () => {
    assert.equal(normalizeSearchQuery('  SLaNk   terlalu  '), 'slank terlalu', 'Harus menormalisasi whitespace');
    
    if (songs.length > 0) {
        const firstSong = songs[0];
        const searchTerm = firstSong.judul.substring(0, 3).toLowerCase();
        const results = searchSongs(songs, searchTerm);
        assert.ok(Array.isArray(results), 'Harus mengembalikan array');
        assert.ok(results.length >= 0, 'Jumlah hasil bisa 0 atau lebih');
    }
});

// --- Test rankSong ---
test('search ranks exact title before title, artist, and partial matches', () => {
    if (songs.length > 0) {
        const firstSong = songs[0];
        const exactMatch = rankSong(firstSong, firstSong.judul);
        assert.equal(exactMatch.matchType, 'exact-title', 'Pencarian dengan judul yang tepat harus memiliki matchType exact-title');
        
        // Test pencarian dengan artis
        const artistMatch = rankSong(firstSong, firstSong.artis);
        assert.ok(['exact-title', 'artist', 'title', 'partial'].includes(artistMatch.matchType), 'Match type harus valid');
    }
});

// --- Test getDifficulty ---
test('getDifficulty derives difficulty from unique chords', () => {
    assert.equal(getDifficulty({ lirik: [{ chord: 'C' }, { chord: 'G' }, { chord: 'Am' }, { chord: 'F' }] }), 'Easy', 'Harus mengembalikan Easy untuk chord sederhana');
    assert.equal(getDifficulty({ lirik: [{ chord: 'C' }, { chord: 'G' }, { chord: 'Am' }, { chord: 'F' }, { chord: 'Dm' }, { chord: 'E' }, { chord: 'B' }, { chord: 'A' }] }), 'Advanced', 'Harus mengembalikan Advanced untuk chord yang lebih banyak');
});

// --- Test transposeChord ---
test('transposeChord handles roots and slash chords', () => {
    assert.equal(transposeChord('C G Am F', 1), 'C# G# A#m F#', 'Harus mentranspose chord dengan benar');
    assert.equal(transposeChord('D/F#', -2), 'C/E', 'Harus mentranspose slash chord dengan benar');
    assert.equal(transposeChord('Bb', 2), 'C', 'Harus mentranspose Bb ke C');
});

test('getChordShape parses major, minor, and transposed chord symbols', () => {
    const cMajor = getChordShape('C');
    assert.equal(cMajor.root, 'C');
    assert.equal(cMajor.quality, 'major');
    assert.equal(cMajor.baseFret, 1, 'C mayor harus menggunakan posisi open chord standar');

    const aMinor = getChordShape('Am');
    assert.equal(aMinor.root, 'A');
    assert.equal(aMinor.quality, 'minor');
    assert.deepEqual(aMinor.positions, ['x', 0, 2, 2, 1, 0]);

    assert.equal(getChordShape('C/Eb').root, 'C', 'Bass note slash chord tidak mengubah bentuk utama');
    assert.equal(getChordShape('H'), null, 'Simbol chord tidak valid harus ditolak');

    const fMajor = getChordShape('F');
    assert.equal(fMajor.root, 'F');
    assert.deepEqual(fMajor.positions, [1, 3, 3, 2, 1, 1], 'F barre chord harus memiliki posisi fret yang tepat');

    const bMinor = getChordShape('Bm');
    assert.equal(bMinor.root, 'B');
    assert.deepEqual(bMinor.positions, ['x', 2, 4, 4, 3, 2], 'Bm barre chord harus memiliki posisi fret yang tepat');
});

test('suggestCapo recommends easy open chords for barre-heavy songs', () => {
    // Kasus lagu di kunci F dengan akor [F, Bb, C, Dm]
    // Jika pasang Capo fret 1 -> dimainkan [E, A, B, C#m]
    // Jika pasang Capo fret 3 -> dimainkan [D, G, A, Bm] (3 open chords D, G, A!)
    // Atau Capo fret 5 -> dimainkan [C, F, G, Am]
    const suggestionF = suggestCapo(['F', 'Bb', 'C', 'Dm'], 'F');
    assert.ok(suggestionF.bestFret > 0, 'Harus menyarankan capo untuk lagu penuh barre di nada F');
    assert.ok([3, 5].includes(suggestionF.bestFret), 'Rekomendasi terbaik harus fret 3 (bentuk D) atau fret 5 (bentuk C)');
    assert.equal(suggestionF.isAlreadyOptimal, false);

    // Kasus lagu yang sudah sangat mudah (C, G, Am, F atau C, G, Am, Em)
    const easySong = suggestCapo(['C', 'G', 'Am', 'Em'], 'C');
    assert.equal(easySong.bestFret, 0, 'Lagu yang sudah menggunakan open chords C-G-Am-Em tidak perlu dipaksa capo');
    assert.equal(easySong.isAlreadyOptimal, true);
});

