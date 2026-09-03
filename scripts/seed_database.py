#!/usr/bin/env python3
"""Create or refresh the local PowerChord SQLite database from data/songs.json."""
from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_FILE = ROOT / "database" / "schema.sql"
DATA_FILE = ROOT / "data" / "songs.json"
DEFAULT_DB_FILE = ROOT / "database" / "powerchord.sqlite3"


def load_songs() -> list[dict]:
    with DATA_FILE.open(encoding="utf-8") as handle:
        songs = json.load(handle)
    if not isinstance(songs, list):
        raise ValueError("data/songs.json harus berisi array lagu")
    return songs


def seed(db_file: Path) -> tuple[int, int]:
    songs = load_songs()
    db_file.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(db_file) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript(SCHEMA_FILE.read_text(encoding="utf-8"))
        connection.execute("DELETE FROM song_lines")
        connection.execute("DELETE FROM songs")

        for song in songs:
            connection.execute(
                """
                INSERT INTO songs (id, title, artist, genre, key_signature)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    song["id"],
                    song["judul"],
                    song["artis"],
                    song["genre"],
                    song["kunci"],
                ),
            )
            connection.executemany(
                """
                INSERT INTO song_lines (song_id, line_number, chord, lyrics)
                VALUES (?, ?, ?, ?)
                """,
                [
                    (song["id"], index, line.get("chord", ""), line.get("teks", ""))
                    for index, line in enumerate(song["lirik"], start=1)
                ],
            )

        song_count = connection.execute("SELECT COUNT(*) FROM songs").fetchone()[0]
        line_count = connection.execute("SELECT COUNT(*) FROM song_lines").fetchone()[0]
    return song_count, line_count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_FILE, help="path database SQLite output")
    args = parser.parse_args()
    song_count, line_count = seed(args.db)
    print(f"DATABASE OK: {song_count} lagu dan {line_count} baris lirik -> {args.db}")


if __name__ == "__main__":
    main()
