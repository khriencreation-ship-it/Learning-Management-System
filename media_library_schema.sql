-- Create media_folders table
create table public.media_folders (
  id uuid not null default gen_random_uuid (),
  name text not null,
  parent_id uuid null,
  path text null default ','::text,
  created_at timestamp with time zone not null default now(),
  constraint media_folders_pkey primary key (id),
  constraint media_folders_parent_id_fkey foreign key (parent_id) references media_folders (id) on delete cascade
);

-- Create media_files table
create table public.media_files (
  id uuid not null default gen_random_uuid (),
  filename text not null,
  url text not null,
  type text null,
  size bigint null,
  mime_type text null,
  bucket text null default 'media-library'::text,
  key text not null,
  folder_id uuid null,
  created_at timestamp with time zone not null default now(),
  constraint media_files_pkey primary key (id),
  constraint media_files_folder_id_fkey foreign key (folder_id) references media_folders (id) on delete set null
);

-- Enable RLS (Optional but recommended, verify policies later)
alter table public.media_folders enable row level security;
alter table public.media_files enable row level security;

-- Create simple policies for now (Allow all for service role / authenticated)
create policy "Allow all access for authenticated users" on public.media_folders
  for all using (true) with check (true);

create policy "Allow all access for authenticated users" on public.media_files
  for all using (true) with check (true);
