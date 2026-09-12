import assert from 'node:assert/strict';
import { test } from 'node:test';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const hasConfig = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const skipReason = 'Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to run the live RLS test';

function supabaseUrl(path, params = {}) {
    const url = new URL(`/rest/v1/${path}`, SUPABASE_URL);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return url;
}

async function fetchPublic(path, params) {
    const response = await fetch(supabaseUrl(path, params), {
        headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
    });
    const body = await response.text();
    assert.equal(response.ok, true, `Supabase REST request failed (${response.status})`);
    try {
        return JSON.parse(body);
    } catch {
        assert.fail('Supabase REST response was not valid JSON');
    }
}

test('public songs endpoint never exposes unpublished rows', { skip: !hasConfig && skipReason }, async () => {
    const rows = await fetchPublic('songs', {
        select: 'status',
        limit: '100',
    });

    assert.ok(Array.isArray(rows), 'songs response harus berupa array');
    assert.ok(
        rows.every((row) => row && row.status === 'published'),
        'RLS harus menyembunyikan semua lagu yang bukan published',
    );
});

test('public songs endpoint returns no rows for an unpublished status filter', { skip: !hasConfig && skipReason }, async () => {
    const rows = await fetchPublic('songs', {
        select: 'status',
        status: 'neq.published',
        limit: '100',
    });

    assert.deepEqual(rows, [], 'Status selain published tidak boleh dapat dibaca role publik');
});

test('public artists endpoint remains readable for catalog rendering', { skip: !hasConfig && skipReason }, async () => {
    const rows = await fetchPublic('artists', {
        select: 'id',
        limit: '1',
    });

    assert.ok(Array.isArray(rows), 'artists response harus berupa array');
});

if (!hasConfig) {
    console.warn(`Supabase RLS integration tests skipped: ${skipReason}`);
}
