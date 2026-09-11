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

-- Row Level Security (RLS) Setup
-- Mengamankan tabel songs dan artists dari akses anon tak terkontrol
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Izinkan pembacaan publik (anon / authenticated) hanya untuk lagu yang berstatus 'published'
DROP POLICY IF EXISTS "Public can view published songs" ON public.songs;
CREATE POLICY "Public can view published songs"
    ON public.songs
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Izinkan pembacaan publik untuk artis
DROP POLICY IF EXISTS "Public can view artists" ON public.artists;
CREATE POLICY "Public can view artists"
    ON public.artists
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Catatan Keamanan: Tidak ada policy INSERT/UPDATE/DELETE untuk role anon.
-- Mutasi data katalog hanya dapat dilakukan lewat Service Role atau authenticated admin.

