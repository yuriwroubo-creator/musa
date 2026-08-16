BEGIN;

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_comments_select_public" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_insert_own" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_update_own" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_delete_own" ON public.post_comments;

CREATE POLICY "post_comments_select_public"
  ON public.post_comments
  FOR SELECT
  USING (true);

CREATE POLICY "post_comments_insert_own"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

CREATE POLICY "post_comments_update_own"
  ON public.post_comments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_comments_delete_own"
  ON public.post_comments
  FOR DELETE
  USING (user_id = auth.uid());

COMMIT;
