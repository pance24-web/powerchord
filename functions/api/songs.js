import { errorResponse, json, loadSongs } from '../lib/songs.js';
import { requireUser } from '../lib/supabase.js';

const KEY_PATTERN = /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus)?(?:[0-9]+)?$/;

function validateSubmission(body) {
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const artist = typeof body?.artist === 'string' ? body.artist.trim() : '';
    const genre = typeof body?.genre === 'string' && body.genre.trim() ? body.genre.trim() : 'Uncategorized';
    const key = typeof body?.key === 'string' && body.key.trim() ? body.key.trim() : 'C';
    const capo = Number.isInteger(body?.capo) ? body.capo : 0;
    const lyrics = Array.isArray(body?.lyrics)
        ? body.lyrics.map((line) => ({
            chord: typeof line?.chord === 'string' ? line.chord.trim() : '',
            text: typeof line?.text === 'string' ? line.text.trim() : '',
        }))
        : [];
    if (!title || title.length > 200) return { error: 'title wajib diisi dan maksimal 200 karakter.' };
    if (!artist || artist.length > 200) return { error: 'artist wajib diisi dan maksimal 200 karakter.' };
    if (!KEY_PATTERN.test(key)) return { error: 'key tidak valid.' };
    if (!Number.isInteger(capo) || capo < 0 || capo > 24) return { error: 'capo harus berada pada 0 sampai 24.' };
    if (!lyrics.length || lyrics.length > 1000) return { error: 'lyrics wajib berisi 1 sampai 1000 baris.' };
    if (lyrics.some((line) => !line.chord && !line.text || line.chord.length > 300 || line.text.length > 300)) {
        return { error: 'Setiap baris lyrics harus valid dan maksimal 300 karakter.' };
    }
    return { value: { title, artist, genre, key, capo, lyrics } };
}

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

export async function onRequestPost(context) {
    const auth = await requireUser(context);
    if (auth.response) return auth.response;
    let body;
    try {
        body = await context.request.json();
    } catch {
        return errorResponse('INVALID_JSON', 'Body harus berupa JSON valid.', 400);
    }
    const parsed = validateSubmission(body);
    if (parsed.error) return errorResponse('INVALID_SUBMISSION', parsed.error, 400);
    try {
        const response = await fetch(`${auth.baseUrl}/rest/v1/song_submissions`, {
            method: 'POST',
            headers: {
                apikey: auth.publicKey,
                Authorization: `Bearer ${auth.token}`,
                'content-type': 'application/json',
                Prefer: 'return=representation',
            },
            body: JSON.stringify([{ ...parsed.value, status: 'review', submitted_by: auth.user.id }]),
        });
        if (response.status === 401) return errorResponse('INVALID_TOKEN', 'Token autentikasi tidak valid.', 401);
        if (response.status === 403) return errorResponse('FORBIDDEN', 'Tidak diizinkan membuat submission.', 403);
        if (!response.ok) return errorResponse('SUBMISSION_CREATE_FAILED', 'Submission tidak dapat disimpan.', 502);
        return json({ data: (await response.json())[0] }, { status: 201 });
    } catch (error) {
        console.error('POST /api/songs failed', error);
        return errorResponse('SUBMISSION_CREATE_FAILED', 'Submission tidak dapat disimpan.', 503);
    }
}
