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
} from '../js/core.js';

const songs = JSON.parse(await readFile(new URL('../data/songs.json', import.meta.url), 'utf8'));

test('dataset contains stable unique IDs', () => {
    assert.equal(songs.length, 100);
    const ids = songs.map((song) => song.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)));
});

test('getSongHref creates stable detail URLs', () => {
    assert.equal(getSongHref(songs[0], 0), 'detail.html?id=komang-raim-laode');
});

test('parseSongReference supports stable IDs and legacy numeric links', () => {
    assert.equal(parseSongReference('komang-raim-laode', songs), songs[0]);
    assert.equal(parseSongReference('0', songs), songs[0]);
    assert.equal(parseSongReference('missing-song', songs), null);
});

test('filterSongs searches title and artist and applies genre', () => {
    assert.equal(filterSongs(songs, 'komang').length, 1);
    assert.equal(filterSongs(songs, 'slank').length, 2);
    assert.equal(filterSongs(songs, '', 'Pop').length, 61);
    assert.equal(filterSongs(songs, 'komang', 'Rock').length, 0);
});

test('search normalizes whitespace and matches all 100 songs deterministically', () => {
    assert.equal(normalizeSearchQuery('  SLaNk   terlalu  '), 'slank terlalu');
    assert.equal(searchSongs(songs, 'slank terlalu').length, 3);
    assert.equal(searchSongs(songs, 'slank terlalu').map((song) => song.id).join(','), 'terlalu-lama-vierra,ku-tak-bisa-slank,virus-slank');
});

test('search ranks exact title before title, artist, and partial matches', () => {
    assert.equal(rankSong(songs.find((song) => song.judul === 'Komang'), 'komang').matchType, 'exact-title');
    assert.equal(rankSong(songs.find((song) => song.id === 'ku-tak-bisa-slank'), 'slank').matchType, 'artist');
    assert.equal(searchSongs(songs, 'komang')[0].id, 'komang-raim-laode');
    assert.equal(searchSongs(songs, 'komnag')[0].id, 'komang-raim-laode');
});

test('getDifficulty derives difficulty from unique chords', () => {
    assert.equal(getDifficulty({ lirik: [{ chord: 'C' }, { chord: 'G' }, { chord: 'Am' }, { chord: 'F' }] }), 'Easy');
    assert.equal(getDifficulty({ lirik: [{ chord: 'C' }, { chord: 'G' }, { chord: 'Am' }, { chord: 'F' }, { chord: 'Dm' }, { chord: 'E' }, { chord: 'B' }, { chord: 'A' }] }), 'Advanced');
});

test('transposeChord handles roots and slash chords', () => {
    assert.equal(transposeChord('C G Am F', 1), 'C# G# A#m F#');
    assert.equal(transposeChord('D/F#', -2), 'C/E');
    assert.equal(transposeChord('Bb', 2), 'C');
});
