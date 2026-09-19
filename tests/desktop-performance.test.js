import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { test } from 'node:test';
import { filterSongs } from '../public/js/core.js';

const root = new URL('../', import.meta.url);
const readProjectFile = (path) => readFile(new URL(path, root), 'utf8');
const fileSize = async (path) => (await stat(new URL(path, root))).size;

const [homepage, catalog, detail, desktopStyles, songsJson] = await Promise.all([
    readProjectFile('public/index.html'),
    readProjectFile('public/catalog.html'),
    readProjectFile('public/detail.html'),
    readProjectFile('public/css/style.css'),
    readProjectFile('data/songs.json'),
]);
const songs = JSON.parse(songsJson);

const desktopPages = [
    ['homepage', homepage, 'index.html'],
    ['catalog', catalog, 'catalog.html'],
    ['detail', detail, 'catalog.html'],
];

test('desktop pages expose the shared mockup navigation and responsive boundary', () => {
    for (const [name, html, expectedActiveLink] of desktopPages) {
        assert.match(html, /class="desktop-nav"/, `${name} harus memiliki navigasi desktop`);
        assert.match(html, /href="index\.html">Beranda</, `${name} harus memiliki link Beranda`);
        assert.match(html, /href="catalog\.html">Katalog</, `${name} harus memiliki link Katalog`);
        assert.match(html, /href="artists\.html">Artis</, `${name} harus memiliki link Artis`);
        assert.match(html, /href="contact\.html">Request Chord</, `${name} harus memiliki link Request Chord`);
        assert.match(html, new RegExp(`class="active" href="${expectedActiveLink}"`), `${name} harus menandai halaman aktif`);
    }

    assert.match(desktopStyles, /@media \(min-width: 761px\)/, 'desktop layout harus memiliki media query eksplisit');
    assert.match(desktopStyles, /@media \(max-width: 760px\)/, 'mobile boundary harus dipertahankan');
    assert.match(desktopStyles, /\.detail-page \.detail-layout\s*\{[^}]*display: grid/s, 'detail desktop harus menggunakan grid dua kolom');
    assert.match(desktopStyles, /\.catalog-page \.catalog-shell\s*\{[^}]*background: #fff/s, 'katalog desktop harus menggunakan surface card');
});

test('desktop pages keep required mockup sections available to the runtime', () => {
    assert.match(homepage, /id="heroSearchInput"/, 'homepage harus memiliki pencarian hero');
    assert.match(homepage, /id="popularSongsList"/, 'homepage harus memiliki daftar lagu populer');
    assert.match(homepage, /id="newSongList"/, 'homepage harus memiliki daftar lagu terbaru');
    assert.match(catalog, /class="catalog-hero-search"/, 'katalog harus memiliki pencarian utama');
    assert.match(catalog, /id="songList"/, 'katalog harus memiliki target render lagu');
    assert.match(detail, /id="lirik"/, 'detail harus memiliki area lirik');
    assert.match(detail, /id="relatedSongs"/, 'detail harus memiliki sidebar lagu terkait');
});

test('desktop asset budgets stay within the performance envelope', async () => {
    const budgets = [
        ['public/css/style.min.css', 50_000],
        ['public/js/main.js', 60_000],
        ['public/js/core.js', 25_000],
        ['public/js/performance-cache.js', 2_000],
    ];
    for (const [path, maxBytes] of budgets) {
        const bytes = await fileSize(path);
        assert.ok(bytes <= maxBytes, `${path} berukuran ${bytes} bytes, melebihi budget ${maxBytes} bytes`);
    }
});

test('repeated desktop search remains within the client-side performance budget', () => {
    const iterations = 2_000;
    const start = performance.now();
    let resultCount = 0;
    for (let index = 0; index < iterations; index += 1) {
        resultCount += filterSongs(songs, index % 2 === 0 ? 'dewa' : 'pupus', 'All').length;
    }
    const elapsed = performance.now() - start;

    assert.ok(resultCount > 0, 'benchmark harus benar-benar menjalankan pencarian');
    assert.ok(elapsed < 1_000, `pencarian berulang membutuhkan ${elapsed.toFixed(2)} ms; budget 1000 ms`);
});
