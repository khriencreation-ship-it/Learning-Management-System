-- Add video_url to courses table
alter table public.courses add column if not exists video_url text;
