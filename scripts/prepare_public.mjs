import { copyFile, mkdir, cp, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(root, 'public');

// Fungsi untuk mengecek apakah file/folder ada
const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

// Salin file statis (robots.txt, manifest.json, _headers) jika ada di root
await mkdir(resolve(publicDir, 'data'), { recursive: true });

const staticFiles = [
  { from: 'data/songs.json', to: 'data/songs.json' },
  { from: 'robots.txt', to: 'robots.txt' },
  { from: '_headers', to: '_headers' },
  { from: 'manifest.json', to: 'manifest.json' }
];

for (const { from, to } of staticFiles) {
  const source = resolve(root, from);
  const dest = resolve(publicDir, to);
  if (await exists(source)) {
    await copyFile(source, dest);
  }
}

// Salin file HTML, CSS, JS, dan asset dari root ke public/ jika ada
const filesToCopy = [
  'index.html', 'about.html', 'artists.html', 'catalog.html', 'collection.html',
  'contact.html', 'detail.html', 'disclaimer.html', 'dmca.html', 'history.html', 'privacy.html'
];

for (const file of filesToCopy) {
  const source = resolve(root, file);
  const dest = resolve(publicDir, file);
  if (await exists(source)) {
    await copyFile(source, dest);
  }
}

// Salin folder css/, js/, asset/ ke public/ jika ada di root
const dirsToCopy = ['css', 'js', 'asset'];
for (const dir of dirsToCopy) {
  const source = resolve(root, dir);
  const dest = resolve(publicDir, dir);
  if (await exists(source)) {
    await cp(source, dest, { recursive: true, force: true });
  }
}

console.log('PUBLIC PREPARED: file statis disalin ke public/');
