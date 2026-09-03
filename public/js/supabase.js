const SUPABASE_URL = 'https://mddtzwkrhftfwsyeykps.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_QJLr7f5-rtpKtZwF6FPntQ_JsdyHM0i';

function parseSongContent(content) {
    return String(content || '').split(/\r?\n/).reduce((lines, rawLine) => {
        const line = rawLine.trim();
        if (!line || /^\{(?:title|artist|key):/i.test(line)) return lines;
        const match = line.match(/^((?:\[[^\]]*\])+)?\s*(.*)$/);
        const chord = (match?.[1] || '').replace(/[\[\]]/g, '').trim();
        const teks = (match?.[2] || '').trim();
        if (chord || teks) lines.push({ chord, teks });
        return lines;
    }, []);
}

function normalizeSong(row) {
    return {
        id: row.source_id || row.slug,
        judul: row.title,
        artis: row.artists?.name || 'Unknown Artist',
        genre: row.genre || 'Uncategorized',
        kunci: row.original_key || 'C',
        lirik: parseSongContent(row.content),
    };
}

export async function fetchSongsFromSupabase({ signal } = {}) {
    const params = new URLSearchParams({
        select: 'source_id,title,slug,original_key,content,genre,artists!inner(name)',
        status: 'eq.published',
        order: 'title.asc',
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
    return data.map(normalizeSong).filter((song) => song.id && song.judul && song.lirik.length);
}
