export const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const ENHARMONIC = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

export function getSongId(song, index = 0) {
    return typeof song?.id === 'string' && song.id ? song.id : `song-${index}`;
}

export function getSongHref(song, index = 0) {
    return `detail.html?id=${encodeURIComponent(getSongId(song, index))}`;
}

export function getDifficulty(song) {
    const chords = new Set(
        (Array.isArray(song?.lirik) ? song.lirik : [])
            .map((line) => typeof line?.chord === 'string' ? line.chord.trim() : '')
            .filter(Boolean),
    );
    if (chords.size <= 4) return 'Easy';
    if (chords.size <= 7) return 'Intermediate';
    return 'Advanced';
}

export function matchesGenre(song, activeGenre = 'All') {
    if (activeGenre === 'All') return true;
    const genre = typeof song?.genre === 'string' ? song.genre.toLowerCase() : '';
    return genre.includes(activeGenre.toLowerCase());
}

export function filterSongs(songs, query = '', activeGenre = 'All') {
    const normalizedQuery = query.trim().toLowerCase();
    return songs.filter((song) => {
        if (!matchesGenre(song, activeGenre)) return false;
        if (!normalizedQuery) return true;
        const title = typeof song?.judul === 'string' ? song.judul.toLowerCase() : '';
        const artist = typeof song?.artis === 'string' ? song.artis.toLowerCase() : '';
        return title.includes(normalizedQuery) || artist.includes(normalizedQuery);
    });
}

export function transposeChord(chord, offset = 0) {
    if (typeof chord !== 'string' || !chord) return '';
    return chord.replace(/[A-G](?:#|b)?/g, (root) => {
        const normalized = ENHARMONIC[root] || root;
        const rootIndex = CHROMATIC.indexOf(normalized);
        if (rootIndex < 0) return root;
        return CHROMATIC[(rootIndex + offset + 12) % 12];
    });
}

export function parseSongReference(value, songs) {
    if (!Array.isArray(songs)) return null;
    const reference = String(value ?? '').trim();
    if (!reference) return null;
    const byId = songs.find((song) => song?.id === reference);
    if (byId) return byId;
    if (/^\d+$/.test(reference)) return songs[Number(reference)] || null;
    return null;
}
