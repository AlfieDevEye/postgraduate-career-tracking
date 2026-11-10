create table if not exists public.job_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  employer text not null,
  location text,
  description text,
  application_url text,
  closes_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.job_opportunities add column if not exists location text;
alter table public.job_opportunities add column if not exists description text;
alter table public.job_opportunities add column if not exists application_url text;
alter table public.job_opportunities add column if not exists closes_at date;
alter table public.job_opportunities add column if not exists is_active boolean not null default true;
alter table public.job_opportunities add column if not exists created_at timestamptz not null default now();
alter table public.job_opportunities enable row level security;
drop policy if exists "Students can view active job opportunities" on public.job_opportunities;
create policy "Students can view active job opportunities" on public.job_opportunities for select to authenticated using (is_active = true);
-- No insert/update/delete policies: admins write through the service-role API routes only.
