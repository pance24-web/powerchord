// Ambil Supabase URL dan Key dari environment variable
// Untuk deployment di Cloudflare Pages, set environment variable:
// SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY
const SUPABASE_URL = import.meta.env?.SUPABASE_URL || 'https://mddtzwkrhftfwsyeykps.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env?.SUPABASE_PUBLISHABLE_KEY || '';

function parseSongContent(content) {
    return String(content || '').split(/\r?\n/).reduce((lines, rawLine) => {
        const line = rawLine.trim();
        if (!line || /^\{(?:title|artist|key):/i.test(line)) return lines;
        const match = line.match(/^((?:\[[^\]]*\])+)?\s*(.*)$/);
        const chord = (match?.[1] || '').replace(/[\[\]]/g, '').trim();
        const text = (match?.[2] || '').trim();
        if (chord || text) lines.push({ chord, text });
        return lines;
    }, []);
}

function normalizeSong(row) {
    if (!row || typeof row !== 'object') return null;

    const id = typeof row.source_id === 'string' && row.source_id.trim()
        ? row.source_id.trim()
        : (typeof row.slug === 'string' && row.slug.trim() ? row.slug.trim() : '');

    const title = typeof row.title === 'string' ? row.title.trim() : '';
    if (!id || !title) return null;

    const artist = typeof row.artists?.name === 'string' && row.artists.name.trim()
        ? row.artists.name.trim()
        : 'Unknown Artist';

    const genre = typeof row.genre === 'string' && row.genre.trim()
        ? row.genre.trim()
        : 'Uncategorized';

    const key = typeof row.original_key === 'string' && row.original_key.trim()
        ? row.original_key.trim()
        : 'C';

    const lyrics = parseSongContent(row.content);
    if (!lyrics.length) return null;

    return {
        id,
        title,
        artist,
        genre,
        key,
        capo: 0,
        lyrics,
        status: 'published',
        updated_at: null,
    };
}

export async function fetchSongsFromSupabase({ signal, limit = 500 } = {}) {
    // Jika key tidak tersedia, lempar error untuk trigger fallback
    if (!SUPABASE_PUBLISHABLE_KEY) {
        throw new Error('Supabase publishable key tidak tersedia');
    }
    
    const params = new URLSearchParams({
        select: 'source_id,title,slug,original_key,content,genre,artists!inner(name)',
        status: 'eq.published',
        order: 'title.asc',
        limit: String(Number.isInteger(limit) && limit > 0 ? limit : 500),
    });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/songs?${params}`, {
        signal,
        headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
    });
    if (!response.ok) throw new Error(`Supabase HTTP error: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Format data Supabase tidak valid');
    return data.map(normalizeSong).filter(Boolean);
}
