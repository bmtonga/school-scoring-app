update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', raw_user_meta_data ->> 'role')
where raw_user_meta_data ->> 'role' in ('principal', 'numeracy', 'literacy', 'just_a_minute')
  and raw_app_meta_data ->> 'role' is null;

create schema if not exists private;

create or replace function private.student_has_draw_history(student_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.draws d
    where d.student_id = student_uuid
  );
$$;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
revoke all on function private.student_has_draw_history(uuid) from public, anon;
grant execute on function private.student_has_draw_history(uuid) to authenticated;

alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.programs enable row level security;
alter table public.draws enable row level security;
alter table public.scores enable row level security;

drop policy if exists "program role can select draws" on public.draws;
drop policy if exists "program role can insert draws" on public.draws;
drop policy if exists "program role can update draws" on public.draws;
drop policy if exists "principal can select draws" on public.draws;
drop policy if exists "program role can select scores" on public.scores;
drop policy if exists "program role can insert scores" on public.scores;
drop policy if exists "program role can update scores" on public.scores;
drop policy if exists "principal can select scores" on public.scores;

create policy "authorized staff can select classes"
on public.classes
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('principal', 'numeracy', 'literacy', 'just_a_minute'));

create policy "principal can insert classes"
on public.classes
for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'principal');

create policy "authorized staff can select students"
on public.students
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('principal', 'numeracy', 'literacy', 'just_a_minute'));

create policy "authorized staff can insert students"
on public.students
for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('principal', 'numeracy', 'literacy', 'just_a_minute'));

create policy "staff can remove students without draw history"
on public.students
for delete
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('principal', 'numeracy', 'literacy', 'just_a_minute')
  and not private.student_has_draw_history(id)
);

alter table public.draws
  drop constraint if exists draws_student_id_fkey;
alter table public.draws
  add constraint draws_student_id_fkey
  foreign key (student_id) references public.students(id) on delete restrict;

create policy "program role can select draws"
on public.draws
for select
to authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = draws.program_id
      and p.name = (auth.jwt() -> 'app_metadata' ->> 'role')
  )
);

create policy "program role can insert draws"
on public.draws
for insert
to authenticated
with check (
  exists (
    select 1
    from public.programs p
    where p.id = draws.program_id
      and p.name = (auth.jwt() -> 'app_metadata' ->> 'role')
  )
);

create policy "program role can update draws"
on public.draws
for update
to authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = draws.program_id
      and p.name = (auth.jwt() -> 'app_metadata' ->> 'role')
  )
)
with check (
  exists (
    select 1
    from public.programs p
    where p.id = draws.program_id
      and p.name = (auth.jwt() -> 'app_metadata' ->> 'role')
  )
);

create policy "principal can select draws"
on public.draws
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'principal');

create policy "program role can select scores"
on public.scores
for select
to authenticated
using (
  exists (
    select 1
    from public.draws d
    join public.programs p on p.id = d.program_id
    where d.id = scores.draw_id
      and p.name = (auth.jwt() -> 'app_metadata' ->> 'role')
  )
);

create policy "program role can insert scores"
on public.scores
for insert
to authenticated
with check (
  exists (
    select 1
    from public.draws d
    join public.programs p on p.id = d.program_id
    where d.id = scores.draw_id
      and p.name = (auth.jwt() -> 'app_metadata' ->> 'role')
  )
);

create policy "program role can update scores"
on public.scores
for update
to authenticated
using (
  exists (
    select 1
    from public.draws d
    join public.programs p on p.id = d.program_id
    where d.id = scores.draw_id
      and p.name = (auth.jwt() -> 'app_metadata' ->> 'role')
  )
)
with check (
  exists (
    select 1
    from public.draws d
    join public.programs p on p.id = d.program_id
    where d.id = scores.draw_id
      and p.name = (auth.jwt() -> 'app_metadata' ->> 'role')
  )
);

create policy "principal can select scores"
on public.scores
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'principal');

create policy "authorized staff can select programs"
on public.programs
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('principal', 'numeracy', 'literacy', 'just_a_minute'));

create or replace view public.class_totals
with (security_invoker = true)
as
select
  d.class_id,
  c.grade,
  c.name as class_name,
  c.level,
  d.program_id,
  p.name as program_name,
  sum(s.points) as total_points
from public.scores s
join public.draws d on d.id = s.draw_id
join public.classes c on c.id = d.class_id
join public.programs p on p.id = d.program_id
group by d.class_id, c.grade, c.name, c.level, d.program_id, p.name;
