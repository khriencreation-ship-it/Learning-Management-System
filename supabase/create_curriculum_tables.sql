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
  content text, 
  video_url text,
  duration integer,
  order_index integer default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.module_items enable row level security;

create policy "Items viewable by everyone" on module_items for select using (true);
create policy "Admins/Tutors manage items" on module_items for all using (
  exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') )
);
