-- 1. Add image and description columns to cohorts (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cohorts' AND column_name='image') THEN
        ALTER TABLE public.cohorts ADD COLUMN image text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cohorts' AND column_name='description') THEN
        ALTER TABLE public.cohorts ADD COLUMN description text;
    END IF;
END $$;

-- 2. Create bucket (only if it doesn't exist)
-- Note: My API may have already created this, so we use a check.
INSERT INTO storage.buckets (id, name, public)
SELECT 'cohorts', 'cohorts', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'cohorts'
);

-- 3. Policies (using DO block to avoid 'already exists' error for policies)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to Cohort Images') THEN
        CREATE POLICY "Public Access to Cohort Images" ON storage.objects FOR SELECT USING ( bucket_id = 'cohorts' );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload to Cohort Images') THEN
        CREATE POLICY "Authenticated Upload to Cohort Images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'cohorts' AND auth.role() = 'authenticated' );
    END IF;
END $$;
