// PowerChord Chord Diagram Generator (using svguitar v2.6.0)
// Format svguitar v2.x: { strings: [fret1, fret2, fret3, fret4, fret5, fret6], fingers: [finger1, finger2, ...], barre: fretNumber }
// Senar: [E tinggi (1), B (2), G (3), D (4), A (5), E rendah (6)]
// Note: null = muted string, 0 = open string
// IMPORTANT: svguitar uses strings in order: [e, B, G, D, A, E] (high to low)

// Chord Database untuk svguitar v2.6.0
export const CHORD_DATABASE = {
  // --- CHORD NATURAL MAJOR & MINOR & 7th ---
  // C: e=0, B=1, G=0, D=2, A=3, E=X
  'C': { strings: [0, 1, 0, 2, 3, null], fingers: [null, 1, null, 2, 3, null], barre: null },
  // Cm: e=3, B=4, G=5, D=5, A=3, E=X, barre=3
  'Cm': { strings: [3, 4, 5, 5, 3, null], fingers: [1, 2, 3, 4, 1, null], barre: 3 },
  // C7: e=0, B=1, G=3, D=2, A=3, E=X
  'C7': { strings: [0, 1, 3, 2, 3, null], fingers: [null, 1, 4, 2, 3, null], barre: null },
  // Cmaj7: e=0, B=0, G=0, D=2, A=3, E=X
  'Cmaj7': { strings: [0, 0, 0, 2, 3, null], fingers: [null, null, null, 2, 3, null], barre: null },
  
  // D: e=2, B=3, G=2, D=0, A=X, E=X
  'D': { strings: [2, 3, 2, 0, null, null], fingers: [3, 1, 2, null, null, null], barre: null },
  // Dm: e=1, B=3, G=2, D=0, A=X, E=X
  'Dm': { strings: [1, 3, 2, 0, null, null], fingers: [1, 3, 2, null, null, null], barre: null },
  // D7: e=2, B=1, G=2, D=0, A=X, E=X
  'D7': { strings: [2, 1, 2, 0, null, null], fingers: [3, 1, 2, null, null, null], barre: null },
  
  // E: e=0, B=0, G=1, D=2, A=2, E=0
  'E': { strings: [0, 0, 1, 2, 2, 0], fingers: [null, null, 1, 3, 2, null], barre: null },
  // Em: e=0, B=0, G=0, D=2, A=2, E=0
  'Em': { strings: [0, 0, 0, 2, 2, 0], fingers: [null, null, null, 2, 3, null], barre: null },
  // E7: e=0, B=0, G=1, D=0, A=2, E=0
  'E7': { strings: [0, 0, 1, 0, 2, 0], fingers: [null, null, 1, null, 2, null], barre: null },
  
  // F: e=1, B=1, G=2, D=3, A=3, E=1, barre=1
  'F': { strings: [1, 1, 2, 3, 3, 1], fingers: [1, 1, 2, 4, 3, 1], barre: 1 },
  // Fm: e=1, B=1, G=1, D=3, A=3, E=1, barre=1
  'Fm': { strings: [1, 1, 1, 3, 3, 1], fingers: [1, 1, 1, 4, 3, 1], barre: 1 },
  
  // G: e=3, B=0, G=0, D=0, A=2, E=3
  'G': { strings: [3, 0, 0, 0, 2, 3], fingers: [3, null, null, null, 1, 2], barre: null },
  // Gm: e=3, B=3, G=3, D=3, A=5, E=3, barre=3
  'Gm': { strings: [3, 3, 3, 3, 5, 3], fingers: [1, 1, 1, 1, 3, 1], barre: 3 },
  
  // A: e=0, B=2, G=2, D=2, A=0, E=X
  'A': { strings: [0, 2, 2, 2, 0, null], fingers: [null, 3, 2, 1, null, null], barre: null },
  // Am: e=0, B=1, G=2, D=2, A=0, E=X
  'Am': { strings: [0, 1, 2, 2, 0, null], fingers: [null, 1, 4, 3, null, null], barre: null },
  
  // B: e=2, B=4, G=4, D=4, A=2, E=X, barre=2
  'B': { strings: [2, 4, 4, 4, 2, null], fingers: [1, 4, 3, 2, 1, null], barre: 2 },
  // Bm: e=2, B=3, G=4, D=4, A=2, E=X, barre=2
  'Bm': { strings: [2, 3, 4, 4, 2, null], fingers: [1, 2, 4, 3, 1, null], barre: 2 },
};

// Enharmonic Aliases (chord yang sama dengan nama berbeda)
const ENHARMONIC_ALIASES = {
  'Db': 'C#', 'Dbm': 'C#m', 'Eb': 'D#', 'Ebm': 'D#m',
  'Gb': 'F#', 'Gbm': 'F#m', 'Ab': 'G#', 'Abm': 'G#m',
  'A#': 'Bb', 'A#m': 'Bbm'
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
