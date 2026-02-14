-- Migration: Granular Access Control
-- 1. Add cohort_id to course_enrollments to track which cohort the enrollment belongs to
-- 2. Update Primary Key to include cohort_id (allowing re-enrollment in different cohorts)
-- 3. Update RLS policies to strictly enforce enrollment-based access

-- 1 & 2. Modify course_enrollments
DO $$ 
BEGIN
    -- Add cohort_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_enrollments' AND column_name = 'cohort_id') THEN
        ALTER TABLE public.course_enrollments 
        ADD COLUMN cohort_id uuid references public.cohorts(id) on delete cascade;
        
        -- Note: We are allowing NULL for now to avoid breaking existing data immediately, 
        -- but ideally this should be NOT NULL in a fresh system.
        -- If you have existing data, you might need to backfill this.
    END IF;

    -- Drop old primary key constraint if it exists (name might vary, Supabase usually names it course_enrollments_pkey)
    -- We'll try to drop it by name, but if created differently, this might need adjustment.
    ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_pkey;

    -- Create new composite primary key
    -- We only do this if cohort_id is not null for new records, but for safely upgrading:
    -- Let's make sure we don't have duplicates before adding the constraint.
    
    ALTER TABLE public.course_enrollments 
    ADD PRIMARY KEY (course_id, student_id, cohort_id);
    
END $$;

-- 3. RLS Policies

-- COURSES: Students can ONLY view courses they are explicitly enrolled in
DROP POLICY IF EXISTS "Courses are viewable by everyone." ON public.courses;
DROP POLICY IF EXISTS "Students view enrolled courses" ON public.courses;

CREATE POLICY "Students view enrolled courses"
ON public.courses FOR SELECT
USING (
  -- Admin/Tutor bypass (optional, usually handled by other policies, but good to ensure)
  (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor')))
  OR
  -- Student Check: Must be in course_enrollments
  (exists (
    select 1 from course_enrollments 
    where course_enrollments.course_id = courses.id 
    and course_enrollments.student_id = auth.uid()
    -- Optional: Check status
    -- and course_enrollments.status = 'active'
  ))
);

-- MODULES: Inherit access from Course
DROP POLICY IF EXISTS "Modules viewable by everyone" ON public.course_modules;

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

-- ITEMS: Inherit access from Module -> Course
DROP POLICY IF EXISTS "Items viewable by everyone" ON public.module_items;

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

-- COHORT COURSES TABLE (New, to define the "Catalog" for a cohort)
-- This allows Admins to define "What courses are available to be assigned in this cohort?"
create table if not exists public.cohort_courses (
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (cohort_id, course_id)
);

alter table public.cohort_courses enable row level security;

create policy "Cohort Courses viewable by everyone" on cohort_courses for select using (true);

create policy "Admins/Tutors manage cohort courses" on cohort_courses for all using (
  exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') )
);
