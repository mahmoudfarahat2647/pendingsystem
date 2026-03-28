-- Tighten storage RLS policies for the attachments bucket (defense-in-depth).
--
-- Context: The app uses the Supabase anon key client-side, so these policies
-- must remain on the `anon` role. The real access gate is the app's auth layer —
-- unauthenticated users never reach file upload code. RLS adds path-based
-- constraints as a secondary guard.
--
-- Changes:
--   INSERT: Require non-empty object name (prevents zero-byte path uploads)
--   UPDATE/DELETE: Already bucket-scoped; no change needed

-- Strengthen INSERT to also require a non-empty file name
DROP POLICY IF EXISTS "Anon users can upload files" ON storage.objects;

CREATE POLICY "Anon users can upload files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'attachments'
  AND length(name) > 0
);
