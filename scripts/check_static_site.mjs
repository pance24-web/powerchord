import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (message) => {
    throw new Error(`STATIC VALIDATION FAILED: ${message}`);
};
const exists = async (relativePath) => {
    try {
        await access(join(root, relativePath));
        return true;
    } catch {
        return false;
    }
};

const entries = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && extname(entry.name) === '.html')
    .map((entry) => entry.name)
    .sort();
if (!entries.length) fail('tidak ada halaman HTML');

for (const filename of entries) {
    const html = await readFile(join(root, filename), 'utf8');
    if (!/<html\b[^>]*\blang="id"/.test(html)) fail(`${filename} tidak memiliki lang="id"`);
    if (!/<meta\b[^>]*name="viewport"/.test(html)) fail(`${filename} tidak memiliki viewport meta`);
    if (!/<link\b[^>]*rel="stylesheet"[^>]*href="css\/style(?:\.min)?\.css"/.test(html)) fail(`${filename} tidak memuat css/style.css atau style.min.css`);    if (!/<script\b[^>]*src="js\/main\.js"[^>]*defer/.test(html)) fail(`${filename} tidak memuat js/main.js dengan defer`);
    if ((html.match(/<h1\b/g) || []).length !== 1) fail(`${filename} harus memiliki tepat satu h1`);
    if (/\b(?:style|on[a-z]+)="/i.test(html)) fail(`${filename} memiliki inline style atau event handler`);

    const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    for (const reference of references) {
        if (/^(?:https?:|mailto:|tel:|#)/i.test(reference)) continue;
        const path = reference.split('#')[0].split('?')[0];
        if (!path || path.endsWith('/')) continue;
        if (!await exists(path)) fail(`${filename} mereferensikan file yang tidak ada: ${path}`);
    }
}

if (!await exists('data/songs.json')) fail('data/songs.json tidak ditemukan');
if (!await exists('asset/favicon.png')) fail('asset/favicon.png tidak ditemukan');
if (!await exists('robots.txt')) fail('robots.txt tidak ditemukan');
if (!await exists('_headers')) fail('_headers tidak ditemukan');

const css = await readFile(join(root, 'css/style.css'), 'utf8');
if ((css.match(/{/g) || []).length !== (css.match(/}/g) || []).length) {
    fail('css/style.css memiliki kurung blok yang tidak seimbang');
}
const headers = await readFile(join(root, '_headers'), 'utf8');
for (const header of ['X-Content-Type-Options:', 'Referrer-Policy:', 'Content-Security-Policy:']) {
    if (!headers.includes(header)) fail(`_headers tidak memiliki ${header}`);
}
console.log(`STATIC CHECK OK: ${entries.length} halaman HTML, CSS, data, asset, dan security config tervalidasi`);
