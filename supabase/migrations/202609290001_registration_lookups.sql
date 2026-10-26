-- Registration lookup data and public read access. Existing application tables
-- are retained; inserts below are guarded so they can be applied more than once.

do $$
declare
  faculty_key uuid;
  department_key uuid;
begin
  select id into faculty_key
  from public.faculties
  where lower(name) = lower('Management Science')
  limit 1;

  if faculty_key is null then
    insert into public.faculties (name)
    values ('Management Science')
    returning id into faculty_key;
  end if;

  select id into department_key
  from public.departments
  where faculty_id = faculty_key
    and lower(name) = lower('Master of Business Administration (MBA)')
  limit 1;

  if department_key is null then
    insert into public.departments (faculty_id, name)
    values (faculty_key, 'Master of Business Administration (MBA)')
    returning id into department_key;
  end if;

  if not exists (
    select 1 from public.programmes
    where department_id = department_key and lower(degree_type) = 'mba'
  ) then
    insert into public.programmes (department_id, degree_type)
    values (department_key, 'MBA');
  end if;
end $$;

create table if not exists public.states (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'Nigeria',
  created_at timestamptz not null default now()
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references public.states(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.states (name, country)
select s.name, 'Nigeria'
from (values
  ('Abia'), ('Adamawa'), ('Akwa Ibom'), ('Anambra'), ('Bauchi'), ('Bayelsa'),
  ('Benue'), ('Borno'), ('Cross River'), ('Delta'), ('Ebonyi'), ('Edo'),
  ('Ekiti'), ('Enugu'), ('Federal Capital Territory'), ('Gombe'), ('Imo'),
  ('Jigawa'), ('Kaduna'), ('Kano'), ('Katsina'), ('Kebbi'), ('Kogi'),
  ('Kwara'), ('Lagos'), ('Nasarawa'), ('Niger'), ('Ogun'), ('Ondo'),
  ('Osun'), ('Oyo'), ('Plateau'), ('Rivers'), ('Sokoto'), ('Taraba'),
  ('Yobe'), ('Zamfara')
) as s(name)
where not exists (
  select 1 from public.states existing
  where lower(existing.name) = lower(s.name) and lower(existing.country) = 'nigeria'
);

insert into public.cities (state_id, name)
select st.id, c.name
from (values
  ('Abia','Umuahia'), ('Adamawa','Yola'), ('Akwa Ibom','Uyo'), ('Anambra','Awka'),
  ('Bauchi','Bauchi'), ('Bayelsa','Yenagoa'), ('Benue','Makurdi'), ('Borno','Maiduguri'),
  ('Cross River','Calabar'), ('Delta','Asaba'), ('Ebonyi','Abakaliki'), ('Edo','Benin City'),
  ('Ekiti','Ado-Ekiti'), ('Enugu','Enugu'), ('Federal Capital Territory','Abuja'), ('Gombe','Gombe'),
  ('Imo','Owerri'), ('Jigawa','Dutse'), ('Kaduna','Kaduna'), ('Kano','Kano'),
  ('Katsina','Katsina'), ('Kebbi','Birnin Kebbi'), ('Kogi','Lokoja'), ('Kwara','Ilorin'),
  ('Lagos','Ikeja'), ('Nasarawa','Lafia'), ('Niger','Minna'), ('Ogun','Abeokuta'),
  ('Ondo','Akure'), ('Osun','Osogbo'), ('Oyo','Ibadan'), ('Plateau','Jos'),
  ('Rivers','Port Harcourt'), ('Sokoto','Sokoto'), ('Taraba','Jalingo'),
  ('Yobe','Damaturu'), ('Zamfara','Gusau')
) as c(state_name, name)
join public.states st on lower(st.name) = lower(c.state_name) and lower(st.country) = 'nigeria'
where not exists (
  select 1 from public.cities existing
  where existing.state_id = st.id and lower(existing.name) = lower(c.name)
);

alter table public.states enable row level security;
alter table public.cities enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'states' and policyname = 'Public can read states') then
    create policy "Public can read states" on public.states for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cities' and policyname = 'Public can read cities') then
    create policy "Public can read cities" on public.cities for select to anon, authenticated using (true);
  end if;
end $$;

grant select on public.states, public.cities, public.faculties, public.departments,
  public.programmes, public.skill_categories, public.skills, public.employment_statuses
to anon, authenticated;

-- These tables only supply choices during public/student registration.
do $$
declare
  lookup_table text;
  policy_name text;
begin
  foreach lookup_table in array array['faculties', 'departments', 'programmes', 'skill_categories', 'skills', 'employment_statuses'] loop
    policy_name := 'Public can read ' || lookup_table;
    execute format('alter table public.%I enable row level security', lookup_table);
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = lookup_table and policyname = policy_name
    ) then
      execute format('create policy %I on public.%I for select to anon, authenticated using (true)', policy_name, lookup_table);
    end if;
  end loop;
end $$;
