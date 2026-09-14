import { errorResponse, json } from '../lib/songs.js';
import { mutationResponse, requireUser, supabaseRequest } from '../lib/supabase.js';

function songIdFromBody(body) {
    const value = typeof body?.song_id === 'string' ? body.song_id.trim() : '';
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : '';
}

export async function onRequestOptions() {
    return json(null, { status: 204 });
}

export async function onRequestGet(context) {
    try {
        const result = await supabaseRequest(
            context,
            'user_favorites?select=song_id,created_at&order=created_at.desc&limit=100',
            { method: 'GET' },
        );
        if (result.response && result.response.status === 401) return result.response;
        if (result.response?.ok !== true) return errorResponse('FAVORITES_UNAVAILABLE', 'Favorit tidak dapat dimuat.', 503);
        return mutationResponse(await result.response.json());
    } catch (error) {
        console.error('GET /api/favorites failed', error);
        return errorResponse('FAVORITES_UNAVAILABLE', 'Favorit tidak dapat dimuat.', 503);
    }
}

export async function onRequestPost(context) {
    let body;
    try {
        body = await context.request.json();
    } catch {
        return errorResponse('INVALID_JSON', 'Body harus berupa JSON valid.', 400);
    }
    const songId = songIdFromBody(body);
    if (!songId) return errorResponse('INVALID_SONG_ID', 'song_id harus berupa slug yang valid.', 400);

    try {
        const auth = await requireUser(context);
        if (auth.response) return auth.response;
        const response = await fetch(`${auth.baseUrl}/rest/v1/user_favorites`, {
            method: 'POST',
            headers: {
                apikey: auth.publicKey,
                Authorization: `Bearer ${auth.token}`,
                'content-type': 'application/json',
                Prefer: 'return=representation',
            },
            body: JSON.stringify([{ user_id: auth.user.id, song_id: songId }]),
        });
        if (response.status === 401) return errorResponse('INVALID_TOKEN', 'Token autentikasi tidak valid.', 401);
        if (response.status === 409) return errorResponse('FAVORITE_EXISTS', 'Lagu sudah ada di favorit.', 409);
        if (response.status === 403) return errorResponse('FORBIDDEN', 'Tidak diizinkan mengubah favorit ini.', 403);
        if (!response.ok) return errorResponse('FAVORITE_CREATE_FAILED', 'Favorit tidak dapat disimpan.', 502);
        return mutationResponse((await response.json())[0], 201);
    } catch (error) {
        console.error('POST /api/favorites failed', error);
        return errorResponse('FAVORITE_CREATE_FAILED', 'Favorit tidak dapat disimpan.', 503);
    }
}

export async function onRequestDelete(context) {
    const songId = songIdFromBody(await context.request.json().catch(() => null));
    if (!songId) return errorResponse('INVALID_SONG_ID', 'song_id harus berupa slug yang valid.', 400);
    try {
        const result = await supabaseRequest(
            context,
            `user_favorites?song_id=eq.${encodeURIComponent(songId)}`,
            { method: 'DELETE', headers: { Prefer: 'return=representation' } },
        );
        if (result.response?.status === 401) return result.response;
        if (result.response?.status === 403) return errorResponse('FORBIDDEN', 'Tidak diizinkan menghapus favorit ini.', 403);
        if (result.response?.ok !== true) return errorResponse('FAVORITE_DELETE_FAILED', 'Favorit tidak dapat dihapus.', 502);
        return mutationResponse((await result.response.json())[0] || null);
    } catch (error) {
        console.error('DELETE /api/favorites failed', error);
        return errorResponse('FAVORITE_DELETE_FAILED', 'Favorit tidak dapat dihapus.', 503);
    }
}
