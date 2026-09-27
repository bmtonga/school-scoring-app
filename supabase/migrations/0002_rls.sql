alter table public.draws enable row level security;
alter table public.scores enable row level security;

create policy "program role can select draws"
on public.draws
for select
to authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = draws.program_id
      and p.name = (auth.jwt() -> 'user_metadata' ->> 'role')
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
      and p.name = (auth.jwt() -> 'user_metadata' ->> 'role')
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
      and p.name = (auth.jwt() -> 'user_metadata' ->> 'role')
  )
)
with check (
  exists (
    select 1
    from public.programs p
    where p.id = draws.program_id
      and p.name = (auth.jwt() -> 'user_metadata' ->> 'role')
  )
);

create policy "principal can select draws"
on public.draws
for select
to authenticated
using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'principal');

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
      and p.name = (auth.jwt() -> 'user_metadata' ->> 'role')
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
      and p.name = (auth.jwt() -> 'user_metadata' ->> 'role')
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
      and p.name = (auth.jwt() -> 'user_metadata' ->> 'role')
  )
)
with check (
  exists (
    select 1
    from public.draws d
    join public.programs p on p.id = d.program_id
    where d.id = scores.draw_id
      and p.name = (auth.jwt() -> 'user_metadata' ->> 'role')
  )
);

create policy "principal can select scores"
on public.scores
for select
to authenticated
using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'principal');
