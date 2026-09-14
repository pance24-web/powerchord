import { errorResponse, json } from '../lib/songs.js';
import { mutationResponse, requireUser, supabaseRequest } from '../lib/supabase.js';

function songSlugFromBody(body) {
    const value = typeof body?.song_id === 'string' ? body.song_id.trim() : '';
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : '';
}

async function resolveSong(context, slug) {
    const result = await supabaseRequest(
        context,
        `songs?select=id,slug&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`,
        { method: 'GET' },
    );
    if (result.response?.status === 401) return { response: result.response };
    if (!result.response?.ok) return { response: errorResponse('SONG_LOOKUP_FAILED', 'Lagu tidak dapat ditemukan.', 503) };
    const rows = await result.response.json();
    return { ...result, song: rows[0] || null };
}

export async function onRequestOptions() {
    return json(null, { status: 204 });
}

export async function onRequestGet(context) {
    try {
        const result = await supabaseRequest(
            context,
            'song_favorites?select=song_id,created_at,songs!inner(slug,title,artists(name))&order=created_at.desc&limit=100',
            { method: 'GET' },
        );
        if (result.response?.status === 401) return result.response;
        if (!result.response?.ok) return errorResponse('FAVORITES_UNAVAILABLE', 'Favorit tidak dapat dimuat.', 503);
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
    const slug = songSlugFromBody(body);
    if (!slug) return errorResponse('INVALID_SONG_ID', 'song_id harus berupa slug yang valid.', 400);

    try {
        const resolved = await resolveSong(context, slug);
        if (resolved.response) return resolved.response;
        if (!resolved.song) return errorResponse('SONG_NOT_FOUND', 'Lagu published tidak ditemukan.', 404);
        const auth = resolved;
        const response = await fetch(`${auth.baseUrl}/rest/v1/song_favorites`, {
            method: 'POST',
            headers: {
                apikey: auth.publicKey,
                Authorization: `Bearer ${auth.token}`,
                'content-type': 'application/json',
                Prefer: 'return=representation',
            },
            body: JSON.stringify([{ user_id: auth.user.id, song_id: auth.song.id }]),
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
    const slug = songSlugFromBody(await context.request.json().catch(() => null));
    if (!slug) return errorResponse('INVALID_SONG_ID', 'song_id harus berupa slug yang valid.', 400);
    try {
        const resolved = await resolveSong(context, slug);
        if (resolved.response) return resolved.response;
        if (!resolved.song) return errorResponse('SONG_NOT_FOUND', 'Lagu published tidak ditemukan.', 404);
        const response = await fetch(`${resolved.baseUrl}/rest/v1/song_favorites?song_id=eq.${encodeURIComponent(resolved.song.id)}`, {
            method: 'DELETE',
            headers: {
                apikey: resolved.publicKey,
                Authorization: `Bearer ${resolved.token}`,
                'content-type': 'application/json',
                Prefer: 'return=representation',
            },
        });
        if (response.status === 401) return errorResponse('INVALID_TOKEN', 'Token autentikasi tidak valid.', 401);
        if (response.status === 403) return errorResponse('FORBIDDEN', 'Tidak diizinkan menghapus favorit ini.', 403);
        if (!response.ok) return errorResponse('FAVORITE_DELETE_FAILED', 'Favorit tidak dapat dihapus.', 502);
        return mutationResponse((await response.json())[0] || null);
    } catch (error) {
        console.error('DELETE /api/favorites failed', error);
        return errorResponse('FAVORITE_DELETE_FAILED', 'Favorit tidak dapat dihapus.', 503);
    }
}
