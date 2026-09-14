-- PowerChord Milestone 4: private favorites.
-- Jalankan setelah Supabase Auth tersedia. Tidak ada policy untuk anon tanpa JWT.

CREATE TABLE IF NOT EXISTS public.user_favorites (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id text NOT NULL REFERENCES public.songs(source_id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, song_id)
);

CREATE INDEX IF NOT EXISTS user_favorites_user_created_idx
    ON public.user_favorites(user_id, created_at DESC);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
CREATE POLICY "Users can view their own favorites"
    ON public.user_favorites FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add their own favorites" ON public.user_favorites;
CREATE POLICY "Users can add their own favorites"
    ON public.user_favorites FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.user_favorites;
CREATE POLICY "Users can remove their own favorites"
    ON public.user_favorites FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Favorit hanya boleh menunjuk ke lagu yang dapat dibaca oleh pengguna.
DROP POLICY IF EXISTS "Favorites reference published songs" ON public.songs;
CREATE POLICY "Favorites reference published songs"
    ON public.songs FOR SELECT TO authenticated
    USING (status = 'published');
