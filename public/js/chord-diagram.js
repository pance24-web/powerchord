// PowerChord Chord Diagram Generator (using svguitar)
// Format svguitar: { strings: [fretE, fretA, fretD, fretG, fretB, fretE], fingers: [finger1, finger2, ...], barre: fretNumber }
// Senar: [E (rendah), A, D, G, B, E (tinggi)]

// Chord Database untuk svguitar
// Format: { strings: [fretE, fretA, fretD, fretG, fretB, fretE], fingers: [jari1, jari2, ...], barre: fretBarre (opsional) }
export const CHORD_DATABASE = {
  // --- CHORD NATURAL MAJOR & MINOR & 7th ---
  'C': { strings: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], barre: null },
  'Cm': { strings: [0, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: 3 },
  'C7': { strings: [0, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], barre: null },
  'Cmaj7': { strings: [0, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], barre: null },
  'C#': { strings: [1, 4, 6, 6, 6, 4], fingers: [1, 1, 2, 3, 4, 1], barre: 4 },
  'C#m': { strings: [1, 4, 6, 6, 5, 4], fingers: [1, 1, 3, 4, 2, 1], barre: 4 },
  
  'D': { strings: [2, 3, 2, 0, 0, 0], fingers: [0, 1, 3, 0, 0, 0], barre: null },
  'Dm': { strings: [1, 3, 2, 0, 0, 0], fingers: [0, 1, 3, 0, 0, 0], barre: null },
  'D7': { strings: [2, 3, 2, 0, 1, 0], fingers: [0, 1, 2, 0, 3, 0], barre: null },
  'Dmaj7': { strings: [2, 3, 2, 0, 2, 0], fingers: [0, 1, 2, 0, 3, 0], barre: null },
  'D#': { strings: [3, 6, 4, 1, 1, 1], fingers: [1, 1, 2, 3, 1, 1], barre: 6 },
  'D#m': { strings: [3, 6, 4, 1, 2, 1], fingers: [1, 1, 3, 2, 4, 1], barre: 6 },
  
  'E': { strings: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], barre: null },
  'Em': { strings: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], barre: null },
  'E7': { strings: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], barre: null },
  'Em7': { strings: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], barre: null },
  
  'F': { strings: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: 1 },
  'Fm': { strings: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: 1 },
  'F7': { strings: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barre: 1 },
  'Fmaj7': { strings: [1, 3, 2, 0, 1, 0], fingers: [1, 3, 2, 0, 1, 0], barre: null },
  'F#': { strings: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barre: 2 },
  'F#m': { strings: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: 2 },
  'F#7': { strings: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], barre: 2 },
  
  'G': { strings: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], barre: null },
  'Gm': { strings: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: 3 },
  'G7': { strings: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], barre: null },
  'Gmaj7': { strings: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 4], barre: null },
  'G#': { strings: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], barre: 4 },
  'G#m': { strings: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], barre: 4 },
  
  'A': { strings: [0, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], barre: null },
  'Am': { strings: [0, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], barre: null },
  'A7': { strings: [0, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], barre: null },
  'Am7': { strings: [0, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], barre: null },
  'A#': { strings: [1, 1, 3, 3, 3, 1], fingers: [1, 1, 2, 3, 4, 1], barre: 1 },
  'A#m': { strings: [1, 1, 3, 3, 2, 1], fingers: [1, 1, 3, 4, 2, 1], barre: 1 },
  
  'Bb': { strings: [1, 1, 3, 3, 3, 1], fingers: [1, 1, 2, 3, 4, 1], barre: 1 },
  'Bbm': { strings: [1, 1, 3, 3, 2, 1], fingers: [1, 1, 3, 4, 2, 1], barre: 1 },
  'B': { strings: [2, 2, 4, 4, 4, 2], fingers: [1, 1, 2, 3, 4, 1], barre: 2 },
  'Bm': { strings: [2, 2, 4, 4, 3, 2], fingers: [1, 1, 3, 4, 2, 1], barre: 2 },
  'B7': { strings: [2, 2, 1, 2, 0, 2], fingers: [1, 2, 1, 3, 0, 4], barre: null },
  
  // --- CHORD 7th & EXTENDED ---
  'Cadd9': { strings: [0, 3, 2, 0, 3, 0], fingers: [0, 3, 2, 0, 4, 0], barre: null },
  'Dsus2': { strings: [0, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], barre: null },
  'Dsus4': { strings: [0, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0], barre: null },
  'Asus2': { strings: [0, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], barre: null },
  'Asus4': { strings: [0, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0], barre: null },
  'Esus4': { strings: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], barre: null },
  
  // --- CHORD MINOR 7th & MAJOR 7th ---
  'Cm7': { strings: [0, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 2, 4, 1], barre: 3 },
  'Dm7': { strings: [1, 3, 2, 0, 1, 1], fingers: [1, 3, 2, 0, 1, 1], barre: null },
  'Em7': { strings: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], barre: null },
  'Gm7': { strings: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: 3 },
  'Am7': { strings: [0, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], barre: null },
  'Bm7': { strings: [2, 2, 4, 4, 3, 2], fingers: [1, 1, 3, 4, 2, 1], barre: 2 },
};

// Enharmonic Aliases (chord yang sama dengan nama berbeda)
const ENHARMONIC_ALIASES = {
  'Db': 'C#', 'Dbm': 'C#m', 'Eb': 'D#', 'Ebm': 'D#m',
  'Gb': 'F#', 'Gbm': 'F#m', 'Ab': 'G#', 'Abm': 'G#m',
  'A#': 'Bb', 'A#m': 'Bbm', 'Bb': 'A#', 'Bbm': 'A#m'
};

// Dapatkan definisi chord (dengan enharmonic aliases)
export function getChordDefinition(chordName) {
  if (!chordName || typeof chordName !== 'string') return null;
  const cleaned = chordName.trim();
  
  // Cek langsung di database
  if (CHORD_DATABASE[cleaned]) {
    return { name: cleaned, ...CHORD_DATABASE[cleaned] };
  }
  
  // Cek enharmonic aliases
  const enharmonic = ENHARMONIC_ALIASES[cleaned];
  if (enharmonic && CHORD_DATABASE[enharmonic]) {
    return { name: cleaned, ...CHORD_DATABASE[enharmonic] };
  }
  
  // Cek chord dengan slash (misal: C/E)
  if (cleaned.includes('/')) {
    const [base] = cleaned.split('/');
    const baseChord = getChordDefinition(base);
    if (baseChord) {
      return { ...baseChord, name: cleaned, isSlash: true };
    }
  }
  
  // Cek chord dengan suffix (misal: Cmaj7, Cm7)
  const baseType = cleaned.replace(/^(?:[A-G](?:#|b)?)/, '');
  const root = cleaned.slice(0, cleaned.length - baseType.length);
  
  if (baseType.startsWith('m') && CHORD_DATABASE[`${root}m`]) {
    return { name: cleaned, ...CHORD_DATABASE[`${root}m`] };
  }
  if (CHORD_DATABASE[root]) {
    return { name: cleaned, ...CHORD_DATABASE[root] };
  }
  
  return null;
}

// Generate SVG chord diagram menggunakan svguitar
export function generateChordSVG(chordName, options = {}) {
  const chord = getChordDefinition(chordName);
  if (!chord) {
    return `<span style="font-size:10px;color:var(--muted)">Chord "${chordName}" tidak ditemukan</span>`;
  }
  
  // Konfigurasi default svguitar
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
  
  // Buat diagram chord menggunakan svguitar
  const diagram = new window.SVGuitar.ChordDiagram(config);
  return diagram.render();
}

// Ekstrak chord dari lirik
export function extractSongChords(lirikList = []) {
  const chords = new Set();
  (Array.isArray(lirikList) ? lirikList : []).forEach((line) => {
    if (typeof line?.chord === 'string' && line.chord.trim()) {
      line.chord.trim().split(/\s+/).forEach((c) => {
        if (c) chords.add(c);
      });
    }
  });
  return Array.from(chords);
}
