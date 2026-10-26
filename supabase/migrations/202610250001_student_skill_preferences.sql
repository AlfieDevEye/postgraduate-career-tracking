-- Stores the explicit skills-step choice that cannot be represented by an empty
-- student_skills relation (empty can also mean the step was never completed).
create table if not exists public.student_skill_preferences (
  student_id uuid primary key references auth.users(id) on delete cascade,
  no_side_skills boolean not null default false
);

alter table public.student_skill_preferences enable row level security;
grant select, insert, update on public.student_skill_preferences to authenticated;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'student_skill_preferences'
      and policyname = 'Students manage their own skill preference'
  ) then
    create policy "Students manage their own skill preference"
      on public.student_skill_preferences
      for all to authenticated
      using (auth.uid() = student_id)
      with check (auth.uid() = student_id);
  end if;
end $$;
