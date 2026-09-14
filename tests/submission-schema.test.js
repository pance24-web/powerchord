import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migration = await readFile(new URL('../database/migrations/20260914_song_submissions.sql', import.meta.url), 'utf8');

test('submission migration defines moderated storage and owner/admin RLS', () => {
    assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.song_submissions/);
    assert.match(migration, /status text NOT NULL DEFAULT 'review'/);
    assert.match(migration, /status IN \('draft', 'review', 'published', 'rejected'\)/);
    assert.match(migration, /auth\.uid\(\) = submitted_by/);
    assert.match(migration, /app_metadata.*role/);
    assert.match(migration, /CREATE POLICY "Admins can moderate submissions"/);
});
