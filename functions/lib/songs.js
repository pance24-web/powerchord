const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(value) {
    return typeof value === 'string' ? value.trim() : '';
}

export function normalizeSong(rawSong, index = 0) {
    if (!rawSong || typeof rawSong !== 'object') return null;
    const id = text(rawSong.id ?? rawSong.slug ?? rawSong.source_id) || `song-${index}`;
    const title = text(rawSong.title ?? rawSong.judul);
    const artist = text(rawSong.artist ?? rawSong.artis);
    const lyrics = rawSong.lyrics ?? rawSong.lirik;
    if (!title || !artist || !Array.isArray(lyrics) || !lyrics.length) return null;
    return {
        id,
        ...(Number.isInteger(rawSong.legacy_id) ? { legacy_id: rawSong.legacy_id } : {}),
        title,
        artist,
        genre: text(rawSong.genre) || 'Uncategorized',
        key: text(rawSong.key ?? rawSong.kunci) || 'C',
        capo: Number.isInteger(rawSong.capo) && rawSong.capo >= 0 ? rawSong.capo : 0,
        lyrics: lyrics.map((line) => ({ chord: text(line?.chord), text: text(line?.text ?? line?.teks) }))
            .filter((line) => line.chord || line.text),
        status: text(rawSong.status) || 'published',
        updated_at: text(rawSong.updated_at) || null,
        ...(rawSong.popular === true ? { popular: true } : {}),
    };
}

export function normalizeSongs(rawSongs) {
    if (!Array.isArray(rawSongs)) throw new Error('Dataset lagu harus berupa array');
    const ids = new Set();
    return rawSongs.map(normalizeSong).filter(Boolean).filter((song) => {
        if (!ID_PATTERN.test(song.id) || song.status !== 'published' || ids.has(song.id)) return false;
        ids.add(song.id);
        return true;
    });
}

export async function loadSongs(context) {
    const response = await context.env.ASSETS.fetch(new URL('/data/songs.json', context.request.url));
    if (!response.ok) throw new Error(`Dataset HTTP error: ${response.status}`);
    return normalizeSongs(await response.json());
}

export function json(data, init = {}) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'public, max-age=60, stale-while-revalidate=300',
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET, POST, DELETE, PATCH, OPTIONS',
            'access-control-allow-headers': 'authorization, content-type, prefer',
            ...init.headers,
        },
    });
}

export function errorResponse(code, message, status) {
    return json({ error: { code, message } }, { status });
}
