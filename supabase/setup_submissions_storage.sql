-- Create 'submissions' bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users (Students) to upload files
-- We use drop policy if exists to avoid errors on re-run
DROP POLICY IF EXISTS "Authenticated Submission Upload" ON storage.objects;
CREATE POLICY "Authenticated Submission Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'submissions' );

-- Policy: Allow authenticated users to view files
DROP POLICY IF EXISTS "Authenticated Submission Select" ON storage.objects;
CREATE POLICY "Authenticated Submission Select"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'submissions' );

-- Policy: Allow users to update/delete their own files (Optional but good for corrections)
DROP POLICY IF EXISTS "Individual Submission Update" ON storage.objects;
CREATE POLICY "Individual Submission Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'submissions' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'submissions' AND auth.uid() = owner );
