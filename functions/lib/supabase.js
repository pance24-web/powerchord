import { errorResponse, json } from './songs.js';

function getBearerToken(request) {
    const header = request.headers.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || '';
}

export async function requireUser(context) {
    const token = getBearerToken(context.request);
    const baseUrl = context.env.SUPABASE_URL;
    const publicKey = context.env.SUPABASE_PUBLISHABLE_KEY;
    if (!token) return { response: errorResponse('AUTH_REQUIRED', 'Bearer token wajib diisi.', 401) };
    if (!baseUrl || !publicKey) {
        return { response: errorResponse('AUTH_NOT_CONFIGURED', 'Auth service belum dikonfigurasi.', 503) };
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/auth/v1/user`, {
        headers: { apikey: publicKey, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return { response: errorResponse('INVALID_TOKEN', 'Token autentikasi tidak valid.', 401) };
    const user = await response.json();
    if (!user?.id) return { response: errorResponse('INVALID_TOKEN', 'Identitas pengguna tidak ditemukan.', 401) };
    return { user, token, baseUrl: baseUrl.replace(/\/$/, ''), publicKey };
}

export async function supabaseRequest(context, path, options = {}) {
    const auth = await requireUser(context);
    if (auth.response) return auth;
    const response = await fetch(`${auth.baseUrl}/rest/v1/${path}`, {
        ...options,
        headers: {
            apikey: auth.publicKey,
            Authorization: `Bearer ${auth.token}`,
            'content-type': 'application/json',
            ...(options.headers || {}),
        },
    });
    return { ...auth, response };
}

export function mutationResponse(data, status = 200) {
    return json({ data }, { status, headers: { 'cache-control': 'no-store' } });
}
