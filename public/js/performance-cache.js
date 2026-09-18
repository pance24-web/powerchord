const normalizedSongCache = new WeakMap();
const difficultyCache = new WeakMap();

export function getCachedSongSearchFields(song, normalize) {
    if (!song || typeof song !== 'object') {
        return { title: '', artist: '', titleTokens: [], artistTokens: [] };
    }
    let fields = normalizedSongCache.get(song);
    if (!fields) {
        const title = normalize(song.title ?? song.judul ?? '');
        const artist = normalize(song.artist ?? song.artis ?? '');
        fields = {
            title,
            artist,
            titleTokens: title.split(' ').filter(Boolean),
            artistTokens: artist.split(' ').filter(Boolean),
        };
        normalizedSongCache.set(song, fields);
    }
    return fields;
}

export function getCachedDifficulty(song, calculate) {
    if (!song || typeof song !== 'object') return calculate(song);
    if (!difficultyCache.has(song)) difficultyCache.set(song, calculate(song));
    return difficultyCache.get(song);
}
