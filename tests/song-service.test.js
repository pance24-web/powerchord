import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    normalizeSong,
    normalizeAndValidateSongs,
    validateCanonicalSong,
} from '../public/js/song-service.js';

const legacySong = {
    id: 'contoh-artis',
    judul: 'Contoh',
    artis: 'Artis',
    genre: 'Pop',
    kunci: 'C',
    lirik: [{ chord: 'C', teks: 'Baris lagu' }],
};

test('normalizeSong maps legacy fields into canonical song contract', () => {
    assert.deepEqual(normalizeSong(legacySong), {
        id: 'contoh-artis',
        title: 'Contoh',
        artist: 'Artis',
        genre: 'Pop',
        key: 'C',
        capo: 0,
        lyrics: [{ chord: 'C', text: 'Baris lagu' }],
        status: 'published',
        updated_at: null,
    });
});

test('canonical validation rejects unpublished and malformed songs', () => {
    const song = normalizeSong(legacySong);
    assert.equal(validateCanonicalSong({ ...song, status: 'draft' }).valid, false);
    assert.equal(validateCanonicalSong({ ...song, key: 'H' }).valid, false);
    assert.equal(validateCanonicalSong({ ...song, lyrics: [] }).valid, false);
});

test('normalizeAndValidateSongs rejects duplicate IDs', () => {
    assert.throws(() => normalizeAndValidateSongs([legacySong, legacySong]), /Duplikasi ID/);
});
