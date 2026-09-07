import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getChordDefinition,
  generateChordSVG,
  extractSongChords,
  CHORD_DATABASE
} from '../public/js/chord-diagram.js';

test('CHORD_DATABASE contains primary chords', () => {
  const essentials = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Dm', 'Em'];
  for (const chord of essentials) {
    assert.ok(CHORD_DATABASE[chord], `Chord ${chord} harus ada dalam database`);
    assert.equal(CHORD_DATABASE[chord].frets.length, 6, `Chord ${chord} harus mendefinisikan 6 senar`);
  }
});

test('getChordDefinition resolves exact, enharmonic, and slash chords', () => {
  const g = getChordDefinition('G');
  assert.equal(g.name, 'G');
  assert.equal(g.frets[0], 3);

  // Enharmonic alias Bb -> A#
  const bb = getChordDefinition('Bb');
  assert.ok(bb, 'Bb harus ditemukan via enharmonic');
  assert.equal(bb.name, 'Bb');

  // Slash chord D/F# -> basis D
  const slash = getChordDefinition('D/F#');
  assert.ok(slash, 'D/F# harus ter-resolve ke basis D');
  assert.equal(slash.isSlash, true);
});

test('generateChordSVG outputs valid SVG string', () => {
  const svg = generateChordSVG('Am');
  assert.ok(svg.startsWith('<svg'), 'SVG harus diawali dengan tag <svg');
  assert.ok(svg.includes('</svg>'), 'SVG harus ditutup dengan tag </svg>');
  assert.ok(svg.includes('Am'), 'SVG harus mencantumkan nama chord Am');
  assert.ok(svg.includes('circle'), 'SVG harus merender titik jari/senar terbuka');
});

test('extractSongChords extracts unique chords from lyrics', () => {
  const lirik = [
    { chord: 'G D Em', teks: 'Baris satu' },
    { chord: 'C G D', teks: 'Baris dua' },
    { chord: '  ', teks: 'Tanpa chord' }
  ];
  const chords = extractSongChords(lirik);
  assert.deepEqual(chords.sort(), ['C', 'D', 'Em', 'G']);
});
