
-- Fix missing course_id in student_progress
-- This block attempts to add the column if it doesn't exist.
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'student_progress' and column_name = 'course_id') then
    alter table public.student_progress add column course_id uuid references public.courses(id) on delete cascade;
  end if;
end $$;

-- Force schema cache reload (Supabase specific)
NOTIFY pgrst, 'reload config';
