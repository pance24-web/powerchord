import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('Python dataset validator passes on the repository dataset', () => {
    const result = spawnSync('python3', ['scripts/validate_data.py'], {
        cwd: new URL('..', import.meta.url),
        encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /VALIDATION OK: \d+ lagu tervalidasi/, 'Validator harus mengembalikan pesan validasi yang benar');
});
