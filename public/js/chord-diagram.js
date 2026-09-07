// PowerChord Chord Diagram Generator (SVG Fretboard)
// Senar dari kiri ke kanan: 6 (E rendah), 5 (A), 4 (D), 3 (G), 2 (B), 1 (E tinggi)
// Frets: array 6 angka [s6, s5, s4, s3, s2, s1]. -1 = mute (x), 0 = open (o), 1+ = fret number
// baseFret: fret awal (default 1). Jika > 1, akan ditampilkan angka fret di samping.
// barres: array angka fret yang di-barre (opsional).

export const CHORD_DATABASE = {
  // --- CHORD NATURAL MAYOR & MINOR & 7th ---
  'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
  'Cm': { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [3] },
  'C7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1 },
  'Cmaj7': { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], baseFret: 1 },
  'C#': { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barres: [4] },
  'C#m': { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [4] },
  
  'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
  'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 },
  'D7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1 },
  'Dmaj7': { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1 },
  'D#': { frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6, barres: [6] },
  'D#m': { frets: [-1, 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barres: [6] },

  'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1 },
  'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 },
  'E7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  'Em7': { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], baseFret: 1 },

  'F': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [1] },
  'Fm': { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [1] },
  'F7': { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1] },
  'Fm6': { frets: [1, -1, 0, 1, 1, -1], fingers: [1, 0, 0, 2, 3, 0], baseFret: 1 },
  'F#': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barres: [2] },
  'F#m': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barres: [2] },
  'F#7': { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2, barres: [2] },

  'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 },
  'Gm': { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barres: [3] },
  'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  'G#': { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barres: [4] },
  'G#m': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barres: [4] },

  'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
  'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
  'A7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], baseFret: 1 },
  'Am7': { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1 },
  'A#': { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [1] },
  'A#m': { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },
  'Bb': { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [1] },
  'Bbm': { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },

  'B': { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [2] },
  'Bm': { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barres: [2] },
  'B7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1 }
};

const ENHARMONIC_ALIASES = {
  'Db': 'C#',
  'Dbm': 'C#m',
  'Eb': 'D#',
  'Ebm': 'D#m',
  'Gb': 'F#',
  'Gbm': 'F#m',
  'Ab': 'G#',
  'Abm': 'G#m',
  'A#': 'Bb',
  'A#m': 'Bbm'
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
    if (baseChord) {
      return { ...baseChord, name: cleaned, isSlash: true };
    }
  }

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

export function generateChordSVG(chordName, options = {}) {
  const chord = getChordDefinition(chordName);
  const width = options.width || 120;
  const height = options.height || 140;

  if (!chord) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="chord-diagram-svg chord-unknown" aria-label="Diagram chord ${chordName}">
      <text x="${width/2}" y="${height/2}" text-anchor="middle" font-size="12" fill="currentColor">${chordName}</text>
    </svg>`;
  }

  const numFrets = 4;
  const numStrings = 6;
  const marginX = 24;
  const marginTop = 36;
  const marginBottom = 18;
  const fretboardWidth = width - (marginX * 2);
  const fretboardHeight = height - marginTop - marginBottom;
  const stringSpacing = fretboardWidth / (numStrings - 1);
  const fretSpacing = fretboardHeight / numFrets;

  const baseFret = chord.baseFret || 1;
  const isNut = baseFret === 1;

  let svgContent = '';

  svgContent += `<text x="${width / 2}" y="18" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="currentColor">${chord.name}</text>`;

  if (!isNut) {
    svgContent += `<text x="${marginX - 8}" y="${marginTop + fretSpacing * 0.7}" text-anchor="end" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="currentColor">${baseFret}fr</text>`;
  }

  if (isNut) {
    svgContent += `<line x1="${marginX}" y1="${marginTop}" x2="${width - marginX}" y2="${marginTop}" stroke="currentColor" stroke-width="4" stroke-linecap="round" />`;
  } else {
    svgContent += `<line x1="${marginX}" y1="${marginTop}" x2="${width - marginX}" y2="${marginTop}" stroke="currentColor" stroke-width="1.5" />`;
  }

  for (let i = 1; i <= numFrets; i++) {
    const y = marginTop + (i * fretSpacing);
    svgContent += `<line x1="${marginX}" y1="${y}" x2="${width - marginX}" y2="${y}" stroke="currentColor" stroke-width="1" opacity="0.6" />`;
  }

  for (let s = 0; s < numStrings; s++) {
    const x = marginX + (s * stringSpacing);
    const strokeWidth = 1 + (0.3 * (5 - s));
    svgContent += `<line x1="${x}" y1="${marginTop}" x2="${x}" y2="${marginTop + fretboardHeight}" stroke="currentColor" stroke-width="${strokeWidth}" opacity="0.8" />`;
  }

  chord.frets.forEach((fret, stringIdx) => {
    const x = marginX + (stringIdx * stringSpacing);
    const y = marginTop - 8;
    if (fret === -1) {
      svgContent += `<text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="currentColor">✕</text>`;
    } else if (fret === 0) {
      svgContent += `<circle cx="${x}" cy="${y - 3}" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5" />`;
    }
  });

  if (Array.isArray(chord.barres)) {
    chord.barres.forEach((barreFret) => {
      const relFret = barreFret - baseFret + 1;
      if (relFret >= 1 && relFret <= numFrets) {
        const y = marginTop + (relFret - 0.5) * fretSpacing;
        let firstStr = 0;
        let lastStr = 5;
        chord.frets.forEach((f, idx) => {
          if (f === barreFret) {
            firstStr = Math.min(firstStr, idx);
            lastStr = Math.max(lastStr, idx);
          }
        });
        const x1 = marginX + (firstStr * stringSpacing);
        const x2 = marginX + (lastStr * stringSpacing);
        svgContent += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="var(--accent, #F97316)" stroke-width="8" stroke-linecap="round" opacity="0.9" />`;
      }
    });
  }

  chord.frets.forEach((fret, stringIdx) => {
    if (fret > 0) {
      const relFret = fret - baseFret + 1;
      if (relFret >= 1 && relFret <= numFrets) {
        const cx = marginX + (stringIdx * stringSpacing);
        const cy = marginTop + (relFret - 0.5) * fretSpacing;
        const finger = chord.fingers ? chord.fingers[stringIdx] : null;

        svgContent += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="var(--accent, #F97316)" />`;
        if (finger && finger > 0) {
          svgContent += `<text x="${cx}" y="${cy + 3.5}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#FFFFFF">${finger}</text>`;
        }
      }
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="chord-diagram-svg" aria-label="Diagram chord gitar ${chord.name}">
    ${svgContent}
  </svg>`;
}

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
