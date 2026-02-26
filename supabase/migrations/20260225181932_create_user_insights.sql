create table user_insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  insights jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);