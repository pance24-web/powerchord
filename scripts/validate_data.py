import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / 'data' / 'songs.json'
REQUIRED_SONG_KEYS = {'id', 'judul', 'artis', 'genre', 'kunci', 'lirik'}
ALLOWED_GENRES = {
    'Dangdut',
    'Folk',
    'Folk Rock',
    'Indie Folk',
    'Indie Retro',
    'Indie Rock',
    'Pop',
    'Pop Melayu',
    'Pop Minang',
    'Pop Rock',
    'Reggae',
    'Rock',
    'Ska',
    'Slow Rock',
}
ID_PATTERN = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
KEY_PATTERN = re.compile(r'^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus)?(?:[0-9]+)?$')
MAX_TEXT_LENGTH = 300


def fail(message):
    raise SystemExit(f'VALIDATION FAILED: {message}')


try:
    songs = json.loads(DATA_FILE.read_text(encoding='utf-8'))
except (OSError, json.JSONDecodeError) as error:
    fail(f'data/songs.json tidak dapat dibaca: {error}')

if not isinstance(songs, list) or not songs:
    fail('dataset harus berupa array yang tidak kosong')

identities = set()
ids = set()
for index, song in enumerate(songs):
    if not isinstance(song, dict):
        fail(f'item {index} bukan object')
    missing = REQUIRED_SONG_KEYS - song.keys()
    if missing:
        fail(f'item {index} kehilangan field: {sorted(missing)}')

    song_id = song['id']
    if not isinstance(song_id, str) or not ID_PATTERN.fullmatch(song_id):
        fail(f'item {index} memiliki id yang tidak valid')
    if song_id in ids:
        fail(f'duplikasi id: {song_id}')
    ids.add(song_id)

    for field in ('judul', 'artis', 'genre', 'kunci'):
        value = song[field]
        if not isinstance(value, str) or not value.strip():
            fail(f'item {index} memiliki {field} yang tidak valid')
        if len(value) > MAX_TEXT_LENGTH:
            fail(f'item {index} memiliki {field} terlalu panjang')
        if value != value.strip():
            fail(f'item {index} memiliki whitespace di sekitar {field}')

    if song['genre'] not in ALLOWED_GENRES:
        fail(f'item {index} memiliki genre tidak dikenal: {song["genre"]}')
    keys = [part.strip() for part in song['kunci'].split(',')]
    if not keys or any(not KEY_PATTERN.fullmatch(part) for part in keys):
        fail(f'item {index} memiliki kunci tidak valid: {song["kunci"]}')

    if not isinstance(song['lirik'], list) or not song['lirik']:
        fail(f'item {index} memiliki lirik yang tidak valid')
    for line_index, line in enumerate(song['lirik']):
        if not isinstance(line, dict):
            fail(f'item {index}, baris {line_index} bukan object')
        if not isinstance(line.get('chord'), str) or not isinstance(line.get('teks'), str):
            fail(f'item {index}, baris {line_index} harus memiliki chord dan teks string')
        if not line['chord'].strip() and not line['teks'].strip():
            fail(f'item {index}, baris {line_index} tidak boleh kosong')
        if len(line['chord']) > MAX_TEXT_LENGTH or len(line['teks']) > MAX_TEXT_LENGTH:
            fail(f'item {index}, baris {line_index} terlalu panjang')

    identity = (song['judul'].casefold(), song['artis'].casefold())
    if identity in identities:
        fail(f'duplikasi lagu: {song["judul"]} - {song["artis"]}')
    identities.add(identity)

print(f'VALIDATION OK: {len(songs)} lagu tervalidasi')
