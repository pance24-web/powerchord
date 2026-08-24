import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / 'data' / 'songs.json'
REQUIRED_SONG_KEYS = {'judul', 'artis', 'genre', 'kunci', 'lirik'}


def fail(message):
    raise SystemExit(f'VALIDATION FAILED: {message}')


try:
    songs = json.loads(DATA_FILE.read_text(encoding='utf-8'))
except (OSError, json.JSONDecodeError) as error:
    fail(f'data/songs.json tidak dapat dibaca: {error}')

if not isinstance(songs, list) or not songs:
    fail('dataset harus berupa array yang tidak kosong')

identities = set()
for index, song in enumerate(songs):
    if not isinstance(song, dict):
        fail(f'item {index} bukan object')
    missing = REQUIRED_SONG_KEYS - song.keys()
    if missing:
        fail(f'item {index} kehilangan field: {sorted(missing)}')
    for field in ('judul', 'artis', 'genre', 'kunci'):
        if not isinstance(song[field], str) or not song[field].strip():
            fail(f'item {index} memiliki {field} yang tidak valid')
    if not isinstance(song['lirik'], list) or not song['lirik']:
        fail(f'item {index} memiliki lirik yang tidak valid')
    for line_index, line in enumerate(song['lirik']):
        if not isinstance(line, dict):
            fail(f'item {index}, baris {line_index} bukan object')
        if not isinstance(line.get('chord'), str) or not isinstance(line.get('teks'), str):
            fail(f'item {index}, baris {line_index} harus memiliki chord dan teks string')
    identity = (song['judul'].strip().casefold(), song['artis'].strip().casefold())
    if identity in identities:
        fail(f'duplikasi lagu: {song["judul"]} - {song["artis"]}')
    identities.add(identity)

print(f'VALIDATION OK: {len(songs)} lagu tervalidasi')
