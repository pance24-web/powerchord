#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
songs = json.loads((ROOT / "data" / "songs.json").read_text(encoding="utf-8"))

def sql(value):
    return "NULL" if value is None else "'" + str(value).replace("'", "''") + "'"

def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")

artists = {}
for song in songs:
    artists[song["artis"]] = slug(song["artis"])

parts = ["BEGIN;"]
for name, artist_slug in artists.items():
    parts.append(
        "INSERT INTO public.artists (name, slug) VALUES "
        f"({sql(name)}, {sql(artist_slug)}) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;"
    )
for song in songs:
    content = "\n".join(
        f"[{line.get('chord', '').strip()}] {line.get('teks', '').strip()}".strip()
        for line in song["lirik"]
    )
    parts.append(
        "INSERT INTO public.songs "
        "(title, slug, artist_id, original_key, content, status, genre, source_id) "
        "SELECT "
        f"{sql(song['judul'])}, {sql(song['id'])}, a.id, {sql(song['kunci'])}, "
        f"{sql(content)}, 'published', {sql(song['genre'])}, {sql(song['id'])} "
        f"FROM public.artists a WHERE a.slug = {sql(slug(song['artis']))} "
        "ON CONFLICT (source_id) WHERE source_id IS NOT NULL DO UPDATE SET "
        "title = EXCLUDED.title, slug = EXCLUDED.slug, artist_id = EXCLUDED.artist_id, "
        "original_key = EXCLUDED.original_key, content = EXCLUDED.content, "
        "status = EXCLUDED.status, genre = EXCLUDED.genre, updated_at = now();"
    )
parts.append("COMMIT;")
query = "\n".join(parts)
out = ROOT / "database" / "supabase_seed.json"
out.write_text(json.dumps({"project_id":"mddtzwkrhftfwsyeykps", "query":query}, ensure_ascii=False), encoding="utf-8")
print(f"generated {len(songs)} songs and {len(artists)} artists")
