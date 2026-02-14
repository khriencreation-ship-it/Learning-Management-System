-- Ensure the 'courses' bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('courses', 'courses', true)
ON CONFLICT (id) DO NOTHING;

-- Remove existing restrictive policies if any
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Manage" ON storage.objects;

-- Create robust policies for the 'courses' bucket

-- 1. Allow public read access to all objects in the 'courses' bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'courses' );

-- 2. Allow all authenticated users to manage (upload, update, delete) objects in the 'courses' bucket
CREATE POLICY "Authenticated Manage Access"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'courses' )
WITH CHECK ( bucket_id = 'courses' );
