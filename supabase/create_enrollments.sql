-- Create table for Course Enrollments (Direct Student Enrollment)
create table public.course_enrollments (
  course_id uuid references public.courses(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'active', -- active, completed, dropped
  progress integer default 0,
  primary key (course_id, student_id)
);

alter table public.course_enrollments enable row level security;
create policy "Enrollments viewable by everyone" on course_enrollments for select using (true);
create policy "Admins/Tutors manage enrollments" on course_enrollments for all using (
  exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') )
);

-- Create table for Course Cohort Assignments
create table public.course_cohorts (
  course_id uuid references public.courses(id) on delete cascade not null,
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (course_id, cohort_id)
);

alter table public.course_cohorts enable row level security;
create policy "Course Cohorts viewable by everyone" on course_cohorts for select using (true);
create policy "Admins/Tutors manage course cohorts" on course_cohorts for all using (
  exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') )
);
