undefined

/**
 * Parses a chord symbol and returns its shape (root, quality, fret positions, etc.)
 * @param {string} chordSymbol - The chord symbol (e.g., 'C', 'Am', 'C/Eb')
 * @returns {object|null} - Object with root, quality, baseFret, and positions, or null if invalid
 */
export function getChordShape(chordSymbol) {
    if (!chordSymbol || typeof chordSymbol !== 'string') return null;

    const cleanSymbol = chordSymbol.trim();
    if (!cleanSymbol) return null;

    // Check for invalid root notes (e.g., 'H')
    const rootMatch = cleanSymbol.match(/^[A-G](?:#|b)?/);
    if (!rootMatch) return null;

    const root = rootMatch[0];
    const quality = cleanSymbol.includes('m') ? 'minor' : 'major';

    // Default positions for common open chords
    const chordPositions = {
        'C': { root: 'C', quality: 'major', baseFret: 1, positions: ['x', 3, 2, 0, 1, 0] },
        'G': { root: 'G', quality: 'major', baseFret: 3, positions: ['3', 2, 0, 0, 0, 3] },
        'D': { root: 'D', quality: 'major', baseFret: 2, positions: ['x', 'x', 0, 2, 3, 2] },
        'A': { root: 'A', quality: 'major', baseFret: 0, positions: ['x', 0, 2, 2, 2, 0] },
        'E': { root: 'E', quality: 'major', baseFret: 0, positions: ['0', 2, 2, 1, 0, 0] },
        'Am': { root: 'A', quality: 'minor', baseFret: 0, positions: ['x', 0, 2, 2, 1, 0] },
        'Em': { root: 'E', quality: 'minor', baseFret: 0, positions: ['0', 2, 2, 0, 0, 0] },
        'Dm': { root: 'D', quality: 'minor', baseFret: 1, positions: ['x', 'x', 0, 2, 3, 1] },
    };

    // Lookup the chord in the predefined shapes
    const shape = chordPositions[cleanSymbol];
    if (shape) return shape;

    // Default fallback for unknown chords
    return {
        root,
        quality: cleanSymbol.includes('m') ? 'minor' : 'major',
        baseFret: 1,
        positions: ['x', 0, 0, 0, 0, 0]
    };
}
