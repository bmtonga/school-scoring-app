do $$
begin
  if exists (
    select 1
    from public.draws
    group by program_id, class_id, draw_date
    having count(*) > 1
  ) then
    raise exception 'Cannot enforce one draw per programme, class, and date: duplicate draws already exist';
  end if;

  if exists (
    select 1
    from public.scores
    group by draw_id
    having count(*) > 1
  ) then
    raise exception 'Cannot enforce one score per draw: duplicate scores already exist';
  end if;

  if exists (select 1 from public.scores where points < 0) then
    raise exception 'Cannot enforce nonnegative scores: negative scores already exist';
  end if;

  if exists (
    select 1
    from public.draws d
    join public.students s on s.id = d.student_id
    where s.class_id <> d.class_id
  ) then
    raise exception 'Cannot enforce draw/class consistency: mismatched historical draws exist';
  end if;
end;
$$;

create unique index if not exists draws_one_per_program_class_date_key
  on public.draws (program_id, class_id, draw_date);

create unique index if not exists scores_one_per_draw_key
  on public.scores (draw_id);

alter table public.scores
  add constraint scores_points_nonnegative_check
  check (points >= 0);

create unique index if not exists students_id_class_id_key
  on public.students (id, class_id);

alter table public.draws
  drop constraint if exists draws_student_id_fkey;

alter table public.draws
  add constraint draws_student_class_fkey
  foreign key (student_id, class_id)
  references public.students (id, class_id)
  on delete restrict;
