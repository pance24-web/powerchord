import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(root, 'public');

await mkdir(resolve(publicDir, 'data'), { recursive: true });
await copyFile(resolve(root, 'data', 'songs.json'), resolve(publicDir, 'data', 'songs.json'));
await copyFile(resolve(root, 'robots.txt'), resolve(publicDir, 'robots.txt'));
await copyFile(resolve(root, '_headers'), resolve(publicDir, '_headers'));
await copyFile(resolve(root, 'manifest.json'), resolve(publicDir, 'manifest.json'));

console.log('PUBLIC PREPARED: dataset, robots, headers, dan manifest disalin ke public/');
