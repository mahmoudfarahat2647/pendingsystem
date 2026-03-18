-- Drop old authenticated-only write policies
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Allow anonymous INSERT
CREATE POLICY "Anon users can upload files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK ( bucket_id = 'attachments' );

-- Allow anonymous UPDATE
CREATE POLICY "Anon users can update files"
ON storage.objects FOR UPDATE
TO anon
USING ( bucket_id = 'attachments' );

-- Allow anonymous DELETE
CREATE POLICY "Anon users can delete files"
ON storage.objects FOR DELETE
TO anon
USING ( bucket_id = 'attachments' );
