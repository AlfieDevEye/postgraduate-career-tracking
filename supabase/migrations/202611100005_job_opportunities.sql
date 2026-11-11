do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'job_opportunities' and column_name = 'company_name')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'job_opportunities' and column_name = 'employer') then
    alter table public.job_opportunities rename column company_name to employer;
  end if;
end $$;

alter table public.job_opportunities alter column title set not null;
alter table public.job_opportunities alter column employer set not null;
alter table public.job_opportunities alter column is_active set default true;
alter table public.job_opportunities alter column is_active set not null;

alter table public.job_opportunities enable row level security;
drop policy if exists "Students can view active job opportunities" on public.job_opportunities;
create policy "Students can view active job opportunities" on public.job_opportunities
  for select to authenticated using (is_active = true);

notify pgrst, 'reload schema';