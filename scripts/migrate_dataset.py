import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / 'data' / 'songs.json'
data = json.loads(path.read_text(encoding='utf-8'))
for song in data:
    song['title'] = song.pop('judul')
    song['artist'] = song.pop('artis')
    song['key'] = song.pop('kunci')
    song['lyrics'] = [
        {'chord': line.get('chord', ''), 'text': line.get('teks', '')}
        for line in song.pop('lirik', [])
    ]
    song['capo'] = song.get('capo', 0)
    song['status'] = song.get('status', 'published')
    song['updated_at'] = song.get('updated_at', '2026-09-14T00:00:00Z')
    ordered = {key: song[key] for key in ('id', 'title', 'artist', 'genre', 'key', 'capo', 'lyrics', 'status', 'updated_at') if key in song}
    if song.get('popular') is True:
        ordered['popular'] = True
    song.clear()
    song.update(ordered)
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'MIGRATED {len(data)} songs')
