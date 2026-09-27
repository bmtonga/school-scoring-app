create table if not exists public.classes (
  id uuid primary key,
  grade int not null,
  name text not null,
  level text not null check (level in ('junior', 'senior')),
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key,
  name text not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.draws (
  id uuid primary key,
  program_id uuid not null references public.programs(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  draw_date date not null,
  present boolean not null default true,
  redrawn boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key,
  draw_id uuid not null references public.draws(id) on delete cascade,
  points int not null,
  created_at timestamptz not null default now()
);

create or replace view public.class_totals as
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

insert into public.programs (id, name)
values
  ('11111111-1111-1111-1111-111111111111', 'numeracy'),
  ('22222222-2222-2222-2222-222222222222', 'literacy'),
  ('33333333-3333-3333-3333-333333333333', 'just_a_minute')
on conflict (name) do nothing;
