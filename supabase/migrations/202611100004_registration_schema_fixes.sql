-- Already applied manually to the live database. Kept as a record. Idempotent.

create unique index if not exists student_profiles_student_id_key
  on public.student_profiles (student_id);

create unique index if not exists student_skills_student_skill_key
  on public.student_skills (student_id, skill_id);

create table if not exists public.student_skill_preferences (
  student_id uuid primary key references auth.users (id) on delete cascade,
  no_side_skills boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.student_skill_preferences
  add column if not exists updated_at timestamptz not null default now();
alter table public.student_skill_preferences enable row level security;

drop policy if exists "Students manage their own skill preference"
  on public.student_skill_preferences;
drop policy if exists "student_skill_preferences_select_own"
  on public.student_skill_preferences;
create policy "student_skill_preferences_select_own"
  on public.student_skill_preferences
  for select to authenticated
  using (auth.uid() = student_id);

drop policy if exists "student_skill_preferences_insert_own"
  on public.student_skill_preferences;
create policy "student_skill_preferences_insert_own"
  on public.student_skill_preferences
  for insert to authenticated
  with check (auth.uid() = student_id);

drop policy if exists "student_skill_preferences_update_own"
  on public.student_skill_preferences;
create policy "student_skill_preferences_update_own"
  on public.student_skill_preferences
  for update to authenticated
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

alter table public.student_academic_records
  drop constraint if exists student_academic_records_student_id_fkey;
alter table public.student_academic_records
  add constraint student_academic_records_student_id_fkey
  foreign key (student_id) references auth.users (id) on delete cascade;

alter table public.student_skills
  drop constraint if exists student_skills_student_id_fkey;
alter table public.student_skills
  add constraint student_skills_student_id_fkey
  foreign key (student_id) references auth.users (id) on delete cascade;

alter table public.employment_history
  drop constraint if exists employment_history_student_id_fkey;
alter table public.employment_history
  add constraint employment_history_student_id_fkey
  foreign key (student_id) references auth.users (id) on delete cascade;
