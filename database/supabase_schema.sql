-- PowerChord Supabase catalog metadata migration.
-- Existing tables: public.artists and public.songs.
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS genre text;
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS source_id text;

UPDATE public.songs
SET genre = COALESCE(genre, 'Uncategorized')
WHERE genre IS NULL;

UPDATE public.songs
SET source_id = COALESCE(source_id, slug)
WHERE source_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS songs_source_id_unique
    ON public.songs(source_id)
    WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS songs_genre_idx
    ON public.songs(genre);
