-- Ensure the 'media-library' bucket exists and has a large enough limit (e.g., 500MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('media-library', 'media-library', true, 524288000)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 524288000;

-- Remove existing policies for media-library to make script idempotent
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Manage" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Manage Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Manage Access Media" ON storage.objects;

-- Create robust policies for the 'media-library' bucket

-- 1. Allow public read access to all objects in the 'media-library' bucket
CREATE POLICY "Public Read Access Media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'media-library' );

-- 2. Allow all authenticated users to manage (upload, update, delete) objects in the 'media-library' bucket
-- This is necessary for client-side uploads from the Media Library
CREATE POLICY "Authenticated Manage Access Media"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'media-library' )
WITH CHECK ( bucket_id = 'media-library' );
