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

export function normalizeSearchQuery(value = '') {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ');
}

function editDistance(left, right) {
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let row = 1; row <= left.length; row += 1) {
        const current = [row];
        for (let column = 1; column <= right.length; column += 1) {
            const cost = left[row - 1] === right[column - 1] ? 0 : 1;
            current[column] = Math.min(
                current[column - 1] + 1,
                previous[column] + 1,
                previous[column - 1] + cost,
            );
            if (row > 1 && column > 1
                && left[row - 1] === right[column - 2]
                && left[row - 2] === right[column - 1]) {
                current[column] = Math.min(current[column], previous[column - 2] + 1);
            }
        }
        for (let column = 0; column <= right.length; column += 1) previous[column] = current[column];
    }
    return previous[right.length];
}

function hasAdjacentTransposition(left, right) {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length - 1; index += 1) {
        if (left[index] === right[index + 1]
            && left[index + 1] === right[index]
            && left.slice(0, index) === right.slice(0, index)
            && left.slice(index + 2) === right.slice(index + 2)) return true;
    }
    return false;
}

function tokenMatches(queryTokens, fieldTokens) {
    return queryTokens.filter((queryToken) => fieldTokens.some((fieldToken) => {
        if (fieldToken.includes(queryToken)) return true;
        if (queryToken.length < 4 || fieldToken.length < 4) return false;
        return editDistance(queryToken, fieldToken) <= 1 || hasAdjacentTransposition(queryToken, fieldToken);
    })).length;
}

export function rankSong(song, query = '') {
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) return { score: 0, matchType: 'all' };
    const title = normalizeSearchQuery(song?.judul);
    const artist = normalizeSearchQuery(song?.artis);
    const queryTokens = normalizedQuery.split(' ').filter(Boolean);
    const titleTokens = title.split(' ').filter(Boolean);
    const artistTokens = artist.split(' ').filter(Boolean);
    const titleMatches = tokenMatches(queryTokens, titleTokens);
    const artistMatches = tokenMatches(queryTokens, artistTokens);
    const exactTitle = title === normalizedQuery;
    const titlePhrase = title.includes(normalizedQuery);
    const artistPhrase = artist.includes(normalizedQuery);
    const allTitleTokens = titleMatches === queryTokens.length;
    const allArtistTokens = artistMatches === queryTokens.length;
    const typoTitle = titleMatches > 0 && titleMatches === queryTokens.length && !titlePhrase;
    const typoArtist = artistMatches > 0 && artistMatches === queryTokens.length && !artistPhrase;

    if (exactTitle) return { score: 0, matchType: 'exact-title' };
    if (titlePhrase) return { score: 100, matchType: 'title' };
    if (allTitleTokens) return { score: typoTitle ? 180 : 120, matchType: typoTitle ? 'title-typo' : 'title' };
    if (artistPhrase) return { score: 200, matchType: 'artist' };
    if (allArtistTokens) return { score: typoArtist ? 280 : 220, matchType: typoArtist ? 'artist-typo' : 'artist' };
    if (titleMatches > 0) return { score: 320 - titleMatches, matchType: 'partial-title' };
    if (artistMatches > 0) return { score: 420 - artistMatches, matchType: 'partial-artist' };
    return { score: 999, matchType: 'none' };
}

export function searchSongs(songs, query = '', activeGenre = 'All') {
    const normalizedQuery = normalizeSearchQuery(query);
    return songs
        .filter((song) => matchesGenre(song, activeGenre))
        .map((song, index) => ({ song, index, ranking: rankSong(song, normalizedQuery) }))
        .filter(({ ranking }) => !normalizedQuery || ranking.matchType !== 'none')
        .sort((left, right) => left.ranking.score - right.ranking.score
            || normalizeSearchQuery(left.song.judul).localeCompare(normalizeSearchQuery(right.song.judul))
            || normalizeSearchQuery(left.song.artis).localeCompare(normalizeSearchQuery(right.song.artis))
            || left.index - right.index)
        .map(({ song }) => song);
}

export function filterSongs(songs, query = '', activeGenre = 'All') {
    return searchSongs(songs, query, activeGenre);
}

export function transposeChord(chord, offset = 0) {
    if (typeof chord !== 'string' || !chord) return '';
    if (offset === 0) return chord;
    return chord.replace(/[A-G](?:#|b)?/g, (root) => {
        const normalized = ENHARMONIC[root] || root;
        const rootIndex = CHROMATIC.indexOf(normalized);
        if (rootIndex < 0) return root;
        const newIndex = (rootIndex + (offset % 12) + 12) % 12;
        return CHROMATIC[newIndex];
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
