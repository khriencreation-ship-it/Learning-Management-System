-- Create the announcements table
create table public.announcements (
  id uuid not null default gen_random_uuid(),
  title text not null,
  message text not null,
  target_type text not null check (target_type in ('cohort', 'course')),
  cohort_id uuid references public.cohorts(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  sender_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint announcements_pkey primary key (id)
);

-- Add indexes for better query performance
create index announcements_cohort_id_idx on public.announcements(cohort_id);
create index announcements_course_id_idx on public.announcements(course_id);

-- Enable Row Level Security (RLS)
alter table public.announcements enable row level security;

-- Policy: Admins can see and create everything (adjust depending on your role setup)
-- For now, allowing public read/write if you want to test quickly, BUT checking headers is better.
-- Assuming service role is used in API, RLS might be bypassed or we need a policy for it.
-- Let's stick effectively to "authenticated users can see" or similar if needed.
-- Since the API uses `supabaseAdmin`, it bypasses RLS. So this ensures the table exists.

-- Optional: If you want student client-side fetching later
create policy "Public read access"
  on public.announcements for select
  using (true);
