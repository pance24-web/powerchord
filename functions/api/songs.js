import { errorResponse, json, loadSongs } from '../lib/songs.js';

export async function onRequestOptions() {
    return json(null, { status: 204 });
}

export async function onRequestGet(context) {
    try {
        const songs = await loadSongs(context);
        const url = new URL(context.request.url);
        const query = (url.searchParams.get('q') || '').trim().toLocaleLowerCase();
        const genre = (url.searchParams.get('genre') || '').trim().toLocaleLowerCase();
        const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '50', 10);
        const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
        const offset = Math.max(Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);
        const filtered = songs
            .filter((song) => !genre || song.genre.toLocaleLowerCase() === genre)
            .filter((song) => !query || `${song.title} ${song.artist}`.toLocaleLowerCase().includes(query))
            .sort((left, right) => left.title.localeCompare(right.title) || left.artist.localeCompare(right.artist));
        const items = filtered.slice(offset, offset + limit);
        return json({ data: items, meta: { total: filtered.length, limit, offset } });
    } catch (error) {
        console.error('GET /api/songs failed', error);
        return errorResponse('DATA_SOURCE_UNAVAILABLE', 'Data lagu tidak tersedia.', 503);
    }
}
