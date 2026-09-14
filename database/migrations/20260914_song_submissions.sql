-- PowerChord Milestone 5: moderated song submissions.
-- Submission dipisahkan dari public.songs agar tidak ada konten pengguna
-- yang terbit sebelum validasi dan review admin/editor.

CREATE TABLE IF NOT EXISTS public.song_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    artist text NOT NULL CHECK (char_length(artist) BETWEEN 1 AND 200),
    genre text NOT NULL DEFAULT 'Uncategorized',
    key text NOT NULL DEFAULT 'C',
    capo integer NOT NULL DEFAULT 0 CHECK (capo >= 0 AND capo <= 24),
    lyrics jsonb NOT NULL CHECK (jsonb_typeof(lyrics) = 'array'),
    status text NOT NULL DEFAULT 'review' CHECK (status IN ('draft', 'review', 'published', 'rejected')),
    submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    review_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS song_submissions_owner_idx
    ON public.song_submissions(submitted_by, created_at DESC);
CREATE INDEX IF NOT EXISTS song_submissions_status_idx
    ON public.song_submissions(status, updated_at DESC);

ALTER TABLE public.song_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own submissions" ON public.song_submissions;
CREATE POLICY "Users can create their own submissions"
    ON public.song_submissions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = submitted_by AND status IN ('draft', 'review'));

DROP POLICY IF EXISTS "Users can view their own submissions" ON public.song_submissions;
CREATE POLICY "Users can view their own submissions"
    ON public.song_submissions FOR SELECT TO authenticated
    USING (
        auth.uid() = submitted_by
        OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'editor')
    );

DROP POLICY IF EXISTS "Admins can moderate submissions" ON public.song_submissions;
CREATE POLICY "Admins can moderate submissions"
    ON public.song_submissions FOR UPDATE TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'editor'))
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'editor'));
