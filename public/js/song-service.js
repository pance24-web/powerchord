const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KEY_PATTERN = /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus)?(?:[0-9]+)?$/;

function text(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeLyrics(rawLyrics) {
    if (!Array.isArray(rawLyrics)) return [];
    return rawLyrics
        .filter((line) => line && typeof line === 'object')
        .map((line) => ({ chord: text(line.chord), text: text(line.text ?? line.teks) }))
        .filter((line) => line.chord || line.text);
}

export function normalizeSong(rawSong, index = 0) {
    if (!rawSong || typeof rawSong !== 'object') return null;
    const id = text(rawSong.id ?? rawSong.slug ?? rawSong.source_id) || `song-${index}`;
    const title = text(rawSong.title ?? rawSong.judul);
    const artist = text(rawSong.artist ?? rawSong.artis);
    const lyrics = normalizeLyrics(rawSong.lyrics ?? rawSong.lirik);
    if (!title || !artist || !lyrics.length) return null;
    return {
        id,
        ...(Number.isInteger(rawSong.legacy_id) ? { legacy_id: rawSong.legacy_id } : {}),
        title,
        artist,
        genre: text(rawSong.genre) || 'Uncategorized',
        key: text(rawSong.key ?? rawSong.kunci) || 'C',
        capo: Number.isInteger(rawSong.capo) && rawSong.capo >= 0 ? rawSong.capo : 0,
        lyrics,
        status: text(rawSong.status) || 'published',
        updated_at: text(rawSong.updated_at) || null,
        ...(rawSong.popular === true ? { popular: true } : {}),
    };
}

export function validateCanonicalSong(song) {
    if (!song || typeof song !== 'object') return { valid: false, error: 'song bukan object' };
    if (!ID_PATTERN.test(song.id)) return { valid: false, error: 'id tidak valid' };
    for (const field of ['title', 'artist', 'genre', 'key', 'status']) {
        if (!text(song[field])) return { valid: false, error: `${field} wajib diisi` };
    }
    if (!KEY_PATTERN.test(song.key)) return { valid: false, error: 'key tidak valid' };
    if (!Array.isArray(song.lyrics) || !song.lyrics.length) return { valid: false, error: 'lyrics wajib berisi baris' };
    if (song.status !== 'published') return { valid: false, error: 'hanya lagu published yang boleh tampil' };
    if (song.lyrics.some((line) => !line || typeof line.chord !== 'string' || typeof line.text !== 'string')) {
        return { valid: false, error: 'format lyrics tidak valid' };
    }
    return { valid: true, error: null };
}

export function normalizeAndValidateSongs(rawSongs) {
    if (!Array.isArray(rawSongs)) throw new Error('Format data lagu harus berupa array');
    const songs = rawSongs.map(normalizeSong).filter(Boolean);
    const ids = new Set();
    for (const song of songs) {
        const result = validateCanonicalSong(song);
        if (!result.valid) throw new Error(`Data lagu tidak valid (${song.id}): ${result.error}`);
        if (ids.has(song.id)) throw new Error(`Duplikasi ID lagu: ${song.id}`);
        ids.add(song.id);
    }
    return songs;
}

export async function fetchLocalSongs({ signal, path = 'data/songs.json' } = {}) {
    const response = await fetch(path, { signal });
    if (!response.ok) throw new Error(`Fallback HTTP error: ${response.status}`);
    return normalizeAndValidateSongs(await response.json());
}
