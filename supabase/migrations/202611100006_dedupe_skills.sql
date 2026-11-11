begin;

create temporary table skill_dedupe on commit drop as
with counted as (
  select s.id, lower(btrim(s.name)) as key,
         (select count(*) from public.student_skills ss where ss.skill_id = s.id) as picked
  from public.skills s
), ranked as (
  select id,
         row_number() over (partition by key order by picked desc, id::text) as rn,
         first_value(id) over (partition by key order by picked desc, id::text) as keep_id
  from counted
)
select id as dup_id, keep_id from ranked where rn > 1;

-- a student who chose both copies keeps one pick
delete from public.student_skills ss
using skill_dedupe d
where ss.skill_id = d.dup_id
  and exists (select 1 from public.student_skills k where k.student_id = ss.student_id and k.skill_id = d.keep_id);

-- everyone else moves to the kept copy
update public.student_skills ss set skill_id = d.keep_id
from skill_dedupe d where ss.skill_id = d.dup_id;

delete from public.skills s using skill_dedupe d where s.id = d.dup_id;

-- stop duplicates coming back
create unique index if not exists skills_name_unique on public.skills (lower(btrim(name)));

commit;