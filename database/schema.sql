PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    genre TEXT NOT NULL,
    key_signature TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(title, artist)
);

CREATE TABLE IF NOT EXISTS song_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id TEXT NOT NULL,
    line_number INTEGER NOT NULL CHECK (line_number > 0),
    chord TEXT NOT NULL DEFAULT '',
    lyrics TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    UNIQUE(song_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_song_lines_song_id_line_number ON song_lines(song_id, line_number);

CREATE VIEW IF NOT EXISTS song_catalog AS
SELECT
    s.id,
    s.title,
    s.artist,
    s.genre,
    s.key_signature,
    COUNT(sl.id) AS line_count
FROM songs AS s
LEFT JOIN song_lines AS sl ON sl.song_id = s.id
GROUP BY s.id, s.title, s.artist, s.genre, s.key_signature;
