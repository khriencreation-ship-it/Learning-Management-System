-- Table for handling student assignment submissions
create table public.assignment_submissions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  item_id uuid references public.module_items(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  
  -- Status: submitted, graded, resubmission_requested
  status text not null default 'submitted',
  
  -- Submission content
  submission_data jsonb default '{
    "files": [],
    "links": [],
    "student_notes": ""
  }'::jsonb,
  
  -- Grading content
  grade_data jsonb default '{
    "points": null,
    "feedback": "",
    "tutor_id": null,
    "graded_at": null
  }'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indices for performance
create index idx_submissions_student on assignment_submissions(student_id);
create index idx_submissions_item on assignment_submissions(item_id);
create index idx_submissions_course on assignment_submissions(course_id);

-- RLS
alter table public.assignment_submissions enable row level security;

-- Students view their own submissions
create policy "Students view own submissions" on assignment_submissions for select
  using ( auth.uid() = student_id );

-- Students can create submissions
create policy "Students can submit assignments" on assignment_submissions for insert
  with check ( auth.uid() = student_id );

-- Tutors and Admins view all submissions for courses they manage
create policy "Tutors/Admins view and manage submissions" on assignment_submissions for all
  using (
    exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') )
  );
