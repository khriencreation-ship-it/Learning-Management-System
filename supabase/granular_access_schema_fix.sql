-- Migration: Granular Access Control (Robust Fix)

DO $$ 
DECLARE
    default_cohort_id uuid;
BEGIN
    -- 1. Add cohort_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_enrollments' AND column_name = 'cohort_id') THEN
        ALTER TABLE public.course_enrollments 
        ADD COLUMN cohort_id uuid references public.cohorts(id) on delete cascade;
    END IF;

    -- 2. Backfill existing data
    -- Check if we have any nulls
    IF EXISTS (SELECT 1 FROM public.course_enrollments WHERE cohort_id IS NULL) THEN
        -- Check if we have ANY cohort
        SELECT id INTO default_cohort_id FROM public.cohorts LIMIT 1;
        
        -- If no cohort exists, create a "Legacy Migration" cohort
        IF default_cohort_id IS NULL THEN
            INSERT INTO public.cohorts (name, batch, start_date, end_date, status)
            VALUES ('Legacy Migration Cohort', 'Batch 0', now(), now() + interval '1 year', 'active')
            RETURNING id INTO default_cohort_id;
        END IF;

        -- Update all NULL enrollments
        UPDATE public.course_enrollments 
        SET cohort_id = default_cohort_id 
        WHERE cohort_id IS NULL;
        
        RAISE NOTICE 'Backfilled enrollments with cohort_id: %', default_cohort_id;
    END IF;

    -- 3. Now that we are sure there are no NULLs, we can recreate the PK
    -- Drop old PK
    ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_pkey;

    -- Set NOT NULL (required for PK)
    ALTER TABLE public.course_enrollments ALTER COLUMN cohort_id SET NOT NULL;

    -- Create new composite PK
    ALTER TABLE public.course_enrollments 
    ADD PRIMARY KEY (course_id, student_id, cohort_id);

    -- 4. Create Cohort Courses table if missing
    CREATE TABLE IF NOT EXISTS public.cohort_courses (
      cohort_id uuid references public.cohorts(id) on delete cascade not null,
      course_id uuid references public.courses(id) on delete cascade not null,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      primary key (cohort_id, course_id)
    );

    -- RLS for Cohort Courses
    ALTER TABLE public.cohort_courses ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Cohort Courses viewable by everyone" ON cohort_courses;
    CREATE POLICY "Cohort Courses viewable by everyone" ON cohort_courses FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Admins/Tutors manage cohort courses" ON cohort_courses;
    CREATE POLICY "Admins/Tutors manage cohort courses" ON cohort_courses FOR ALL USING (
      exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') )
    );
    
END $$;

-- 5. Update RLS Policies (Outside DO block for standard SQL execution)

-- COURSES: Students can ONLY view courses they are explicitly enrolled in
DROP POLICY IF EXISTS "Courses are viewable by everyone." ON public.courses;
DROP POLICY IF EXISTS "Students view enrolled courses" ON public.courses;

CREATE POLICY "Students view enrolled courses"
ON public.courses FOR SELECT
USING (
  -- Admin/Tutor bypass
  (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor')))
  OR
  -- Student Check: Must be in course_enrollments
  (exists (
    select 1 from course_enrollments 
    where course_enrollments.course_id = courses.id 
    and course_enrollments.student_id = auth.uid()
  ))
);

-- MODULES
DROP POLICY IF EXISTS "Modules viewable by everyone" ON public.course_modules;
DROP POLICY IF EXISTS "Student view modules if enrolled" ON public.course_modules;

CREATE POLICY "Student view modules if enrolled"
ON public.course_modules FOR SELECT
USING (
  -- Admin/Tutor
  (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor')))
  OR
  -- Check Course Enrollment
  (exists (
    select 1 from course_enrollments 
    where course_enrollments.course_id = course_modules.course_id 
    and course_enrollments.student_id = auth.uid()
  ))
);

-- ITEMS
DROP POLICY IF EXISTS "Items viewable by everyone" ON public.module_items;
DROP POLICY IF EXISTS "Student view items if enrolled" ON public.module_items;

CREATE POLICY "Student view items if enrolled"
ON public.module_items FOR SELECT
USING (
  -- Admin/Tutor
  (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor')))
  OR
  -- Check Course Enrollment via Module
  (exists (
    select 1 
    from course_modules
    join course_enrollments on course_enrollments.course_id = course_modules.course_id
    where course_modules.id = module_items.module_id
    and course_enrollments.student_id = auth.uid()
  ))
);
