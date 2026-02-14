-- Table for tracking individual student progress on module items
create table public.student_progress (
  student_id uuid references public.profiles(id) on delete cascade not null,
  item_id uuid references public.module_items(id) on delete cascade not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (student_id, item_id)
);

-- RLS for progress tracking
alter table public.student_progress enable row level security;

create policy "Progress viewable by everyone" on student_progress for select using (true);
create policy "Users can mark their own progress" on student_progress for insert with check ( auth.uid() = student_id );
create policy "Admins/Tutors manage all progress" on student_progress for all using (
  exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'tutor') )
);
