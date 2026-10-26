-- Career opportunities are readable by authenticated students. No browser write policy is granted.
create table if not exists public.job_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  employer text not null,
  location text,
  description text,
  application_url text,
  closes_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.job_opportunities enable row level security;
grant select on public.job_opportunities to authenticated;
create policy "Authenticated users can read active opportunities"
  on public.job_opportunities for select to authenticated using (is_active = true);

-- Preflight guard: resolve any existing duplicates before applying this migration.
do $$
begin
  if exists (select 1 from public.student_academic_records group by student_id having count(*) > 1) then
    raise exception 'Resolve duplicate student_academic_records per student before applying unique index';
  end if;
  if exists (select 1 from public.employment_history where is_current = true group by student_id having count(*) > 1) then
    raise exception 'Resolve duplicate current employment_history per student before applying unique index';
  end if;
end $$;

create unique index if not exists student_academic_records_student_id_unique
  on public.student_academic_records (student_id);
create unique index if not exists employment_history_one_current_per_student
  on public.employment_history (student_id) where is_current = true;
