// PowerChord Chord Diagram Generator (using svguitar v2.6.0)
// Format svguitar v2.x: { strings: [fret1, fret2, fret3, fret4, fret5, fret6], fingers: [finger1, finger2, ...], barre: fretNumber }
// Senar: [E tinggi (1), B (2), G (3), D (4), A (5), E rendah (6)]
// Note: null = muted string, 0 = open string
// IMPORTANT: svguitar uses strings in order: [e, B, G, D, A, E] (high to low)

export const CHORD_DATABASE = {
  'C': { strings: [0, 1, 0, 2, 3, null], fingers: [null, 1, null, 2, 3, null], barre: null },
  'Cm': { strings: [3, 4, 5, 5, 3, null], fingers: [1, 2, 3, 4, 1, null], barre: 3 },
  'C7': { strings: [0, 1, 3, 2, 3, null], fingers: [null, 1, 4, 2, 3, null], barre: null },
  'Cmaj7': { strings: [0, 0, 0, 2, 3, null], fingers: [null, null, null, 2, 3, null], barre: null },
  'D': { strings: [2, 3, 2, 0, null, null], fingers: [3, 1, 2, null, null, null], barre: null },
  'Dm': { strings: [1, 3, 2, 0, null, null], fingers: [1, 3, 2, null, null, null], barre: null },
  'D7': { strings: [2, 1, 2, 0, null, null], fingers: [3, 1, 2, null, null, null], barre: null },
  'E': { strings: [0, 0, 1, 2, 2, 0], fingers: [null, null, 1, 3, 2, null], barre: null },
  'Em': { strings: [0, 0, 0, 2, 2, 0], fingers: [null, null, null, 2, 3, null], barre: null },
  'E7': { strings: [0, 0, 1, 0, 2, 0], fingers: [null, null, 1, null, 2, null], barre: null },
  'F': { strings: [1, 1, 2, 3, 3, 1], fingers: [1, 1, 2, 4, 3, 1], barre: 1 },
  'Fm': { strings: [1, 1, 1, 3, 3, 1], fingers: [1, 1, 1, 4, 3, 1], barre: 1 },
  'G': { strings: [3, 0, 0, 0, 2, 3], fingers: [3, null, null, null, 1, 2], barre: null },
  'Gm': { strings: [3, 3, 3, 3, 5, 3], fingers: [1, 1, 1, 1, 3, 1], barre: 3 },
  'A': { strings: [0, 2, 2, 2, 0, null], fingers: [null, 3, 2, 1, null, null], barre: null },
  'Am': { strings: [0, 1, 2, 2, 0, null], fingers: [null, 1, 4, 3, null, null], barre: null },
  'B': { strings: [2, 4, 4, 4, 2, null], fingers: [1, 4, 3, 2, 1, null], barre: 2 },
  'Bm': { strings: [2, 3, 4, 4, 2, null], fingers: [1, 2, 4, 3, 1, null], barre: 2 },
  'C#': { strings: [4, 6, 6, 6, 4, null], fingers: [1, 3, 4, 2, 1, null], barre: 4 },
  'C#m': { strings: [4, 5, 6, 6, 4, null], fingers: [1, 2, 4, 3, 1, null], barre: 4 },
  'D#': { strings: [3, 3, 3, 5, 6, 6], fingers: [1, 1, 1, 2, 3, 4], barre: 3 },
  'D#m': { strings: [3, 4, 3, 5, 6, 6], fingers: [1, 2, 1, 3, 4, 4], barre: 3 },
  'F#': { strings: [2, 2, 3, 4, 4, 2], fingers: [1, 1, 2, 3, 4, 1], barre: 2 },
  'F#m': { strings: [2, 2, 2, 4, 4, 2], fingers: [1, 1, 1, 3, 4, 1], barre: 2 },
  'G#': { strings: [4, 4, 5, 6, 6, 4], fingers: [1, 1, 2, 3, 4, 1], barre: 4 },
  'G#m': { strings: [4, 4, 4, 6, 6, 4], fingers: [1, 1, 1, 3, 4, 1], barre: 4 },
  'Bb': { strings: [1, 3, 3, 3, 1, null], fingers: [1, 3, 4, 2, 1, null], barre: 1 },
  'Bbm': { strings: [1, 2, 3, 3, 1, null], fingers: [1, 2, 4, 3, 1, null], barre: 1 },
};

for (const definition of Object.values(CHORD_DATABASE)) {
  definition.frets = definition.strings;
}

const ENHARMONIC_ALIASES = {
  'Db': 'C#', 'Dbm': 'C#m', 'Eb': 'D#', 'Ebm': 'D#m',
  'Gb': 'F#', 'Gbm': 'F#m', 'Ab': 'G#', 'Abm': 'G#m',
  'A#': 'Bb', 'A#m': 'Bbm'
};

export function getChordDefinition(chordName) {
  if (!chordName || typeof chordName !== 'string') return null;
  const cleaned = chordName.trim();
  if (CHORD_DATABASE[cleaned]) return { name: cleaned, ...CHORD_DATABASE[cleaned] };

  const enharmonic = ENHARMONIC_ALIASES[cleaned];
  if (enharmonic && CHORD_DATABASE[enharmonic]) {
    return { name: cleaned, ...CHORD_DATABASE[enharmonic] };
  }

  if (cleaned.includes('/')) {
    const [base] = cleaned.split('/');
    const baseChord = getChordDefinition(base);
    if (baseChord) return { ...baseChord, name: cleaned, isSlash: true };
  }

  const baseType = cleaned.replace(/^(?:[A-G](?:#|b)?)/, '');
  const root = cleaned.slice(0, cleaned.length - baseType.length);
  if (baseType.startsWith('m') && CHORD_DATABASE[`${root}m`]) {
    return { name: cleaned, ...CHORD_DATABASE[`${root}m`] };
  }
  if (CHORD_DATABASE[root]) return { name: cleaned, ...CHORD_DATABASE[root] };
  return null;
}

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[character]));

function fallbackChordSVG(chordName, chord, options) {
  const width = Number(options.width) || 90;
  const height = Number(options.height) || 110;
  const left = 16;
  const top = 25;
  const spacingX = (width - left * 2) / 5;
  const spacingY = Math.max(10, (height - top - 18) / 4);
  const strings = chord.strings.map((fret, index) => {
    const x = left + index * spacingX;
    const marker = fret === null
      ? `<text x="${x}" y="18" text-anchor="middle">×</text>`
      : fret === 0
        ? `<circle cx="${x}" cy="18" r="3" fill="none"/>`
        : `<circle cx="${x}" cy="${top + Math.min(fret - 1, 3) * spacingY}" r="4"/>`;
    return `<line x1="${x}" y1="${top}" x2="${x}" y2="${height - 10}"/>${marker}`;
  }).join('');
  const frets = Array.from({ length: 5 }, (_, index) =>
    `<line x1="${left}" y1="${top + index * spacingY}" x2="${width - left}" y2="${top + index * spacingY}"/>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-label="${escapeXml(chordName)} chord diagram"><title>${escapeXml(chordName)}</title><text x="${width / 2}" y="${height - 1}" text-anchor="middle">${escapeXml(chordName)}</text><g stroke="currentColor" fill="currentColor" stroke-width="1">${frets}${strings}</g></svg>`;
}

export function generateChordSVG(chordName, options = {}) {
  const chord = getChordDefinition(chordName);
  if (!chord) {
    return `<span style="font-size:10px;color:var(--muted)">Chord "${escapeXml(chordName)}" tidak ditemukan</span>`;
  }

  const config = {
    strings: chord.strings,
    fingers: chord.fingers,
    barre: chord.barre,
    width: options.width || 90,
    height: options.height || 110,
    showTitle: false,
    showFretNumbers: false,
    ...options
  };
  const svguitar = globalThis.SVGuitar;
  if (svguitar?.ChordDiagram) {
    try {
      return new svguitar.ChordDiagram(config).render();
    } catch (error) {
      console.error('Error rendering chord diagram:', error);
    }
  }
  return fallbackChordSVG(chord.name, chord, config);
}

export function extractSongChords(lirikList = []) {
  const chords = new Set();
  (Array.isArray(lirikList) ? lirikList : []).forEach((line) => {
    if (typeof line?.chord === 'string' && line.chord.trim()) {
      line.chord.trim().split(/\s+/).forEach((c) => { if (c) chords.add(c); });
    }
  });
  return Array.from(chords);
}
