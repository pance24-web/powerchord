-- PowerChord Milestone 4: private favorites.
-- Schema Supabase canonical sudah menyediakan public.song_favorites
-- dengan song_id uuid -> public.songs.id. Migration ini hanya memastikan
-- RLS per-user aktif dan tidak membuat tabel duplikat.

ALTER TABLE public.song_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User manage favorites" ON public.song_favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.song_favorites;
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.song_favorites;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.song_favorites;

CREATE POLICY "Users can view their own favorites"
    ON public.song_favorites FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
    ON public.song_favorites FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
    ON public.song_favorites FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
