create table if not exists public.student_profile_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index if not exists student_profile_deletion_requests_one_pending_per_student
  on public.student_profile_deletion_requests (student_id)
  where status = 'pending';

alter table public.student_profile_deletion_requests enable row level security;
grant select, insert on public.student_profile_deletion_requests to authenticated;

create policy "Students can view their own profile deletion requests"
  on public.student_profile_deletion_requests
  for select to authenticated
  using (auth.uid() = student_id);

create policy "Students can submit their own profile deletion requests"
  on public.student_profile_deletion_requests
  for insert to authenticated
  with check (auth.uid() = student_id);
