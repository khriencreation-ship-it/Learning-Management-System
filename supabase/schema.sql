-- Create a table for public profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  role text check (role in ('student', 'tutor', 'admin')) default 'student',
  identifier text unique, -- For student/tutor IDs like STU-2025-001
  status text default 'active'
);

-- Set up Row Level Security (RLS) for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a table for Cohorts
create table public.cohorts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  batch text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  status text check (status in ('active', 'completed', 'upcoming')) default 'upcoming'
);

-- RLS for Cohorts
alter table public.cohorts enable row level security;

create policy "Cohorts are viewable by everyone."
  on cohorts for select
  using ( true );

create policy "Admins can insert cohorts."
  on cohorts for insert
  with check ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can update cohorts."
  on cohorts for update
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

-- Create a table for Courses
create table public.courses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  instructor text, -- Store name for now, or could link to profile
  code text unique,
  image text,
  topics_count integer default 0,
  lessons_count integer default 0,
  quizzes_count integer default 0,
  assignments_count integer default 0,
  published_at timestamp with time zone,
  status text check (status in ('active', 'draft', 'archived')) default 'draft'
);

-- RLS for Courses
alter table public.courses enable row level security;

create policy "Courses are viewable by everyone."
  on courses for select
  using ( true );

create policy "Admins and Tutors can insert courses."
  on courses for insert
  with check ( exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') ) );

create policy "Admins and Tutors can update courses."
  on courses for update
  using ( exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') ) );

-- Junction table for Cohort Students
create table public.cohort_students (
  cohort_id uuid references public.cohorts(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  start_date timestamp with time zone default timezone('utc'::text, now()),
  primary key (cohort_id, student_id)
);

alter table public.cohort_students enable row level security;

-- Junction table for Cohort Tutors
create table public.cohort_tutors (
  cohort_id uuid references public.cohorts(id) on delete cascade,
  tutor_id uuid references public.profiles(id) on delete cascade,
  primary key (cohort_id, tutor_id)
);

alter table public.cohort_tutors enable row level security;

-- Function to handle new user creation automatically
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, identifier)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 
          coalesce(new.raw_user_meta_data->>'role', 'student'),
          new.raw_user_meta_data->>'identifier');
  return new;
end;
$$;

-- Trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- STORAGE SETUP
-- Create a public bucket for courses
insert into storage.buckets (id, name, public) values ('courses', 'courses', true);

-- Allow public access to read
create policy "Public Access" on storage.objects for select using ( bucket_id = 'courses' );

-- Allow authenticated users to upload (or restrict to admin if strict)
create policy "Authenticated Upload" on storage.objects for insert with check ( bucket_id = 'courses' and auth.role() = 'authenticated' );

-- COURSE CURRICULUM TABLES

-- Table for Course Modules (Topics)
create table public.course_modules (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  summary text,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.course_modules enable row level security;

create policy "Modules viewable by everyone" on course_modules for select using (true);
create policy "Admins/Tutors manage modules" on course_modules for all using (
  exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') )
);

-- Table for Module Items (Lessons, Quizzes, etc.)
create table public.module_items (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references public.course_modules(id) on delete cascade not null,
  type text check (type in ('lesson', 'quiz', 'assignment', 'live-class')) default 'lesson',
  title text not null,
  summary text,
  content text, -- Markdown content or description
  video_url text,
  duration integer, -- in minutes
  order_index integer default 0,
  metadata jsonb default '{}'::jsonb, -- Store quiz questions, assignment details here
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.module_items enable row level security;

create policy "Items viewable by everyone" on module_items for select using (true);
create policy "Admins/Tutors manage items" on module_items for all using (
  exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') )
);
