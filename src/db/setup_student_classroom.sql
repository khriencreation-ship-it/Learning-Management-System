
-- Create student_progress table
create table if not exists public.student_progress (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  cohort_id uuid references public.cohorts(id) on delete cascade, -- Nullable for backward compatibility/direct enrollment
  item_id text not null, -- ID of the module item (lesson/quiz/assignment)
  is_completed boolean default false,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(student_id, course_id, item_id, cohort_id)
);

-- Enable RLS for student_progress
alter table public.student_progress enable row level security;

-- Policy: Students can view and update their own progress
create policy "Students can view their own progress"
  on public.student_progress for select
  using (auth.uid() = student_id);

create policy "Students can update their own progress"
  on public.student_progress for insert
  with check (auth.uid() = student_id);

create policy "Students can update their own progress update"
  on public.student_progress for update
  using (auth.uid() = student_id);

-- Create quiz_submissions table
create table if not exists public.quiz_submissions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  quiz_id text not null, -- Linked to module_items.id
  score integer default 0,
  total_questions integer default 0,
  percentage float default 0,
  passed boolean default false,
  answers jsonb, -- Stores student's raw answers
  results jsonb, -- Stores graded results details
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for quiz_submissions
alter table public.quiz_submissions enable row level security;

-- Policy: Students can view their own submissions
create policy "Students can view their own submissions"
  on public.quiz_submissions for select
  using (auth.uid() = student_id);

-- Policy: Only server (via admin client) or specific logic typically inserts, 
-- but if we want to allow direct inserts from client (not recommended for grading), 
-- we usually stick to the API. However, for RLS completeness:
-- We'll rely on the API using service_role to insert, so RLS for insert might not be needed for student role 
-- if the API uses Supabase Admin.
-- The API I wrote uses `supabaseAdmin` (service role), so it bypasses RLS. 
-- Thus, we primarily need RLS for the user to READ their data if we ever fetch from client directly.

-- Create assignment_submissions table (if not exists)
create table if not exists public.assignment_submissions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  cohort_id uuid references public.cohorts(id) on delete cascade,
  item_id text not null,
  status text default 'submitted', -- submitted, graded, returned
  submission_data jsonb, -- { attachments: [], comment: '' }
  grade_data jsonb, -- { points: 0, feedback: '' }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.assignment_submissions enable row level security;

create policy "Students can view their own assignment submissions"
  on public.assignment_submissions for select
  using (auth.uid() = student_id);
