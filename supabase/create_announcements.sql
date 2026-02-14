-- Create table for Course Announcements
create table public.course_announcements (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.course_announcements enable row level security;

-- Policies
create policy "Announcements viewable by everyone" on course_announcements for select using (true);
create policy "Admins/Tutors manage announcements" on course_announcements for all using (
  exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') )
);
