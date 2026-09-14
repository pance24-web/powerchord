import { errorResponse, json, loadSongs } from '../../lib/songs.js';

export async function onRequestOptions() {
    return json(null, { status: 204 });
}

export async function onRequestGet(context) {
    const reference = decodeURIComponent(context.params.id || '').trim();
    if (!reference) return errorResponse('INVALID_ID', 'ID lagu wajib diisi.', 400);
    try {
        const songs = await loadSongs(context);
        const song = /^\d+$/.test(reference)
            ? songs.find((candidate) => String(candidate.legacy_id) === reference)
            : songs.find((candidate) => candidate.id === reference);
        if (!song) return errorResponse('SONG_NOT_FOUND', 'Lagu tidak ditemukan.', 404);
        return json({ data: song });
    } catch (error) {
        console.error('GET /api/songs/:id failed', error);
        return errorResponse('DATA_SOURCE_UNAVAILABLE', 'Data lagu tidak tersedia.', 503);
    }
}
