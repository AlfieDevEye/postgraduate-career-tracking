-- Already applied manually to the live database. Kept as a record. Idempotent.

drop policy if exists "Students can update own skills" on public.student_skills;
create policy "Students can update own skills"
  on public.student_skills
  for update to authenticated
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);
