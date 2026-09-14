import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { onRequestGet as listSongs } from '../functions/api/songs.js';
import { onRequestGet as getSong } from '../functions/api/songs/[id].js';
import { onRequestPost as addFavorite } from '../functions/api/favorites.js';

const dataset = await readFile(new URL('../data/songs.json', import.meta.url), 'utf8');
function context(path, params = {}) {
    return {
        request: new Request(`https://example.test${path}`),
        params,
        env: { ASSETS: { fetch: async () => new Response(dataset, { status: 200 }) } },
    };
}

test('GET /api/songs filters and paginates canonical songs', async () => {
    const response = await listSongs(context('/api/songs?q=pupus&limit=1'));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.meta.total, 1);
    assert.equal(body.data[0].title, 'Pupus');
    assert.equal(body.data[0].lyrics[0].text, 'Aku tak mengerti');
});

test('GET /api/songs/:id returns song by slug and clear 404 error', async () => {
    const response = await getSong(context('/api/songs/pupus-dewa-19', { id: 'pupus-dewa-19' }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.id, 'pupus-dewa-19');

    const missing = await getSong(context('/api/songs/missing', { id: 'missing' }));
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, 'SONG_NOT_FOUND');
});

test('favorites mutation requires a bearer token before any database write', async () => {
    const request = new Request('https://example.test/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ song_id: 'pupus-dewa-19' }),
        headers: { 'content-type': 'application/json' },
    });
    const response = await addFavorite({ request, env: {} });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, 'AUTH_REQUIRED');
});
