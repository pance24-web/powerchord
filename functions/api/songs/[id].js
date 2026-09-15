import { errorResponse, json, loadSongs } from '../../lib/songs.js';
import { requireUser } from '../../lib/supabase.js';

export async function onRequestOptions() {
    return json(null, { status: 204 });
}

export async function onRequestGet(context) {
    let reference;
    try {
        reference = decodeURIComponent(context.params.id || '').trim();
    } catch {
        return errorResponse('INVALID_ID', 'ID lagu tidak valid.', 400);
    }
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

export async function onRequestPatch(context) {
    const auth = await requireUser(context);
    if (auth.response) return auth.response;
    const role = auth.user?.app_metadata?.role;
    if (!['admin', 'editor'].includes(role)) return errorResponse('FORBIDDEN', 'Hanya admin atau editor yang dapat memoderasi submission.', 403);
    const submissionId = context.params.id || '';
    if (!/^[0-9a-f-]{36}$/i.test(submissionId)) return errorResponse('INVALID_ID', 'ID submission tidak valid.', 400);

    let body;
    try {
        body = await context.request.json();
    } catch {
        return errorResponse('INVALID_JSON', 'Body harus berupa JSON valid.', 400);
    }
    const allowedStatuses = new Set(['draft', 'review', 'published', 'rejected']);
    const update = {};
    if (body?.status !== undefined) {
        if (typeof body.status !== 'string' || !allowedStatuses.has(body.status)) return errorResponse('INVALID_STATUS', 'Status moderasi tidak valid.', 400);
        update.status = body.status;
    }
    for (const field of ['title', 'artist', 'genre', 'key', 'review_note']) {
        if (body?.[field] !== undefined) {
            if (typeof body[field] !== 'string' || body[field].trim().length > 300) return errorResponse('INVALID_FIELD', `${field} tidak valid.`, 400);
            update[field] = body[field].trim();
        }
    }
    if (update.key !== undefined && !/^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus)?(?:[0-9]+)?$/.test(update.key)) {
        return errorResponse('INVALID_FIELD', 'key tidak valid.', 400);
    }
    if (body?.capo !== undefined) {
        if (!Number.isInteger(body.capo) || body.capo < 0 || body.capo > 24) return errorResponse('INVALID_CAPO', 'capo harus berada pada 0 sampai 24.', 400);
        update.capo = body.capo;
    }
    if (body?.lyrics !== undefined) {
        if (!Array.isArray(body.lyrics) || !body.lyrics.length || body.lyrics.length > 1000) return errorResponse('INVALID_LYRICS', 'lyrics harus berisi 1 sampai 1000 baris.', 400);
        if (body.lyrics.some((line) => !line || typeof line.chord !== 'string' || typeof line.text !== 'string' || line.chord.length > 300 || line.text.length > 300 || (!line.chord.trim() && !line.text.trim()))) {
            return errorResponse('INVALID_LYRICS', 'Setiap baris lyrics harus valid dan maksimal 300 karakter.', 400);
        }
        update.lyrics = body.lyrics;
    }
    if (update.status === 'published') update.reviewed_by = auth.user.id;
    if (!Object.keys(update).length) return errorResponse('EMPTY_UPDATE', 'Tidak ada perubahan yang dikirim.', 400);

    try {
        const response = await fetch(`${auth.baseUrl}/rest/v1/song_submissions?id=eq.${encodeURIComponent(submissionId)}`, {
            method: 'PATCH',
            headers: {
                apikey: auth.publicKey,
                Authorization: `Bearer ${auth.token}`,
                'content-type': 'application/json',
                Prefer: 'return=representation',
            },
            body: JSON.stringify(update),
        });
        if (response.status === 401) return errorResponse('INVALID_TOKEN', 'Token autentikasi tidak valid.', 401);
        if (response.status === 403) return errorResponse('FORBIDDEN', 'Tidak diizinkan memoderasi submission ini.', 403);
        if (!response.ok) return errorResponse('SUBMISSION_UPDATE_FAILED', 'Submission tidak dapat diperbarui.', 502);
        const rows = await response.json();
        if (!rows.length) return errorResponse('SUBMISSION_NOT_FOUND', 'Submission tidak ditemukan.', 404);
        return json({ data: rows[0] });
    } catch (error) {
        console.error('PATCH /api/songs/:id failed', error);
        return errorResponse('SUBMISSION_UPDATE_FAILED', 'Submission tidak dapat diperbarui.', 503);
    }
}
