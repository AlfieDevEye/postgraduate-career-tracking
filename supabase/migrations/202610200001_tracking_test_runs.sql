-- Isolated audit trail for admin-triggered reminder simulations and test sends.
-- Production tracking dates and notification records are not written by simulation mode.
create table if not exists public.tracking_test_runs (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  student_id uuid not null,
  tracking_id uuid not null,
  frequency_months integer not null check (frequency_months in (3, 6, 9)),
  mode text not null check (mode in ('simulate', 'send')),
  result text not null,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.tracking_test_runs enable row level security;
revoke all on public.tracking_test_runs from anon, authenticated;
grant all on public.tracking_test_runs to service_role;

-- Normalize the existing settings before adding the interval validation.
update public.tracking_settings set frequency_months = 3 where frequency_months not in (3, 6, 9);
update public.tracking_settings set tracking_period_years = 5 where tracking_period_years is distinct from 5;

-- Add interval validation to the existing settings table without recreating it.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'tracking_settings_frequency_months_check') then
    alter table public.tracking_settings add constraint tracking_settings_frequency_months_check check (frequency_months in (3, 6, 9));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tracking_settings_tracking_period_years_check') then
    alter table public.tracking_settings add constraint tracking_settings_tracking_period_years_check check (tracking_period_years = 5);
  end if;
end $$;

-- Use an existing active settings row where present; otherwise establish the documented defaults.
insert into public.tracking_settings (frequency_months, tracking_period_years, is_active)
select 3, 5, true
where not exists (select 1 from public.tracking_settings where is_active = true);

-- Initialize missing schedule dates only. Existing student dates are preserved.
update public.student_tracking st
set tracking_end_date = (st.tracking_start_date + interval '5 years')::date
where st.tracking_start_date is not null and st.tracking_end_date is null;

update public.student_tracking st
set next_update_date = (
  coalesce(st.last_update_date, st.tracking_start_date)
  + make_interval(months => coalesce((
      select ts.frequency_months from public.tracking_settings ts where ts.is_active = true limit 1
    ), 3))
)::date
where st.next_update_date is null
  and coalesce(st.last_update_date, st.tracking_start_date) is not null;

-- Keep dates consistent when an existing workflow creates tracking or records a response.
create or replace function public.set_student_tracking_schedule_dates()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  configured_frequency integer;
  configured_years integer;
  schedule_base date;
begin
  select ts.frequency_months, ts.tracking_period_years
    into configured_frequency, configured_years
  from public.tracking_settings ts
  where ts.is_active = true
  order by ts.id
  limit 1;

  configured_frequency := case when configured_frequency in (3, 6, 9) then configured_frequency else 3 end;
  configured_years := case when configured_years = 5 then configured_years else 5 end;

  if new.tracking_start_date is not null and new.tracking_end_date is null then
    new.tracking_end_date := (new.tracking_start_date + make_interval(years => configured_years))::date;
  end if;

  schedule_base := coalesce(new.last_update_date, new.tracking_start_date);
  if schedule_base is not null and (
    tg_op = 'INSERT'
    or new.last_update_date is distinct from old.last_update_date
    or new.tracking_start_date is distinct from old.tracking_start_date
  ) then
    new.next_update_date := (schedule_base + make_interval(months => configured_frequency))::date;
  end if;
  return new;
end;
$$;

revoke all on function public.set_student_tracking_schedule_dates() from public, anon, authenticated;

drop trigger if exists student_tracking_schedule_dates on public.student_tracking;
create trigger student_tracking_schedule_dates
before insert or update of tracking_start_date, last_update_date
on public.student_tracking
for each row execute function public.set_student_tracking_schedule_dates();
