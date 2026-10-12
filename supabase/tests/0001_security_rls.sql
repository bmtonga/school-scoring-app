begin;

select plan(1);

do $$
declare
  test_class_id uuid;
  other_class_id uuid;
  numeracy_program_id uuid;
  literacy_program_id uuid;
  test_student_id uuid := gen_random_uuid();
  numeracy_draw_id uuid := gen_random_uuid();
  literacy_draw_id uuid := gen_random_uuid();
begin
  select id into test_class_id from public.classes order by grade, name limit 1;
  select id into other_class_id
  from public.classes
  where id <> test_class_id
  order by grade, name
  limit 1;
  select id into numeracy_program_id from public.programs where name = 'numeracy';
  select id into literacy_program_id from public.programs where name = 'literacy';

  if test_class_id is null or other_class_id is null or numeracy_program_id is null or literacy_program_id is null then
    raise exception 'Required test fixture class or programme is missing';
  end if;

  insert into public.students (id, name, class_id)
  values (test_student_id, 'RLS test student', test_class_id);

  insert into public.draws (id, program_id, class_id, student_id, draw_date)
  values
    (numeracy_draw_id, numeracy_program_id, test_class_id, test_student_id, current_date),
    (literacy_draw_id, literacy_program_id, test_class_id, test_student_id, current_date);

  insert into public.scores (id, draw_id, points)
  values
    (gen_random_uuid(), numeracy_draw_id, 7),
    (gen_random_uuid(), literacy_draw_id, 11);

  perform set_config('test.student_id', test_student_id::text, true);
  perform set_config('test.other_class_id', other_class_id::text, true);
  perform set_config('test.numeracy_program_id', numeracy_program_id::text, true);
  perform set_config('test.literacy_program_id', literacy_program_id::text, true);
  perform set_config('test.numeracy_draw_id', numeracy_draw_id::text, true);
  perform set_config('test.literacy_draw_id', literacy_draw_id::text, true);
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['classes', 'students', 'programs', 'draws', 'scores']
  loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = table_name
        and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', table_name;
    end if;
  end loop;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'class_totals'
      and c.reloptions @> array['security_invoker=true']
  ) then
    raise exception 'class_totals is not configured as a security-invoker view';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claims = '{"app_metadata":{"role":"numeracy"}}';

do $$
declare
  visible_count integer;
  deleted_rows integer;
  archived_rows integer;
  cross_program_insert_denied boolean := false;
  duplicate_draw_denied boolean := false;
  duplicate_score_denied boolean := false;
  negative_score_denied boolean := false;
  mismatched_class_denied boolean := false;
begin
  select count(*) into visible_count from public.draws;
  if visible_count <> 1 then
    raise exception 'Numeracy should see exactly one draw; saw %', visible_count;
  end if;

  select count(*) into visible_count from public.scores;
  if visible_count <> 1 then
    raise exception 'Numeracy should see exactly one score; saw %', visible_count;
  end if;

  select count(*) into visible_count
  from public.class_totals
  where program_id = current_setting('test.numeracy_program_id')::uuid;
  if visible_count <> 1 then
    raise exception 'Numeracy should see its leaderboard total; saw % rows', visible_count;
  end if;

  delete from public.students
  where id = current_setting('test.student_id')::uuid;
  get diagnostics deleted_rows = ROW_COUNT;
  if deleted_rows <> 0 then
    raise exception 'A student with draw history was deleted';
  end if;

  update public.students
  set archived_at = now()
  where id = current_setting('test.student_id')::uuid;
  get diagnostics archived_rows = ROW_COUNT;
  if archived_rows <> 1 then
    raise exception 'Authorized staff could not archive the test student';
  end if;

  select count(*) into visible_count
  from public.students
  where id = current_setting('test.student_id')::uuid
    and archived_at is not null;
  if visible_count <> 1 then
    raise exception 'Archived student record is not visible to authorized staff';
  end if;

  select count(*) into visible_count
  from public.draws
  where student_id = current_setting('test.student_id')::uuid;
  if visible_count <> 1 then
    raise exception 'Archiving removed the programme draw or exposed another programme history';
  end if;

  update public.students
  set archived_at = null
  where id = current_setting('test.student_id')::uuid;
  get diagnostics archived_rows = ROW_COUNT;
  if archived_rows <> 1 then
    raise exception 'Authorized staff could not restore the test student';
  end if;

  begin
    insert into public.draws (id, program_id, class_id, student_id, draw_date)
    select gen_random_uuid(),
      current_setting('test.literacy_program_id')::uuid,
      class_id,
      current_setting('test.student_id')::uuid,
      current_date
    from public.draws
    where id = current_setting('test.numeracy_draw_id')::uuid;
  exception when insufficient_privilege then
    cross_program_insert_denied := true;
  end;

  if not cross_program_insert_denied then
    raise exception 'Numeracy was able to insert a Literacy draw';
  end if;

  begin
    insert into public.draws (id, program_id, class_id, student_id, draw_date)
    values (
      gen_random_uuid(),
      current_setting('test.numeracy_program_id')::uuid,
      (select class_id from public.draws where id = current_setting('test.numeracy_draw_id')::uuid),
      current_setting('test.student_id')::uuid,
      current_date
    );
  exception when unique_violation then
    duplicate_draw_denied := true;
  end;
  if not duplicate_draw_denied then
    raise exception 'A duplicate draw for the same programme, class, and date was accepted';
  end if;

  begin
    insert into public.scores (id, draw_id, points)
    values (gen_random_uuid(), current_setting('test.numeracy_draw_id')::uuid, 3);
  exception when unique_violation then
    duplicate_score_denied := true;
  end;
  if not duplicate_score_denied then
    raise exception 'A second score for the same draw was accepted';
  end if;

  begin
    insert into public.scores (id, draw_id, points)
    values (gen_random_uuid(), current_setting('test.numeracy_draw_id')::uuid, -1);
  exception when check_violation then
    negative_score_denied := true;
  end;
  if not negative_score_denied then
    raise exception 'A negative score was accepted';
  end if;

  begin
    insert into public.draws (id, program_id, class_id, student_id, draw_date)
    values (
      gen_random_uuid(),
      current_setting('test.numeracy_program_id')::uuid,
      current_setting('test.other_class_id')::uuid,
      current_setting('test.student_id')::uuid,
      current_date
    );
  exception when foreign_key_violation then
    mismatched_class_denied := true;
  end;
  if not mismatched_class_denied then
    raise exception 'A draw assigning a student to a different class was accepted';
  end if;
end;
$$;

set local request.jwt.claims = '{"app_metadata":{"role":"literacy"}}';

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count from public.draws;
  if visible_count <> 1 then
    raise exception 'Literacy should see exactly one draw; saw %', visible_count;
  end if;

  select count(*) into visible_count from public.scores;
  if visible_count <> 1 then
    raise exception 'Literacy should see exactly one score; saw %', visible_count;
  end if;
end;
$$;

set local request.jwt.claims = '{"app_metadata":{"role":"principal"}}';

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count from public.draws;
  if visible_count <> 2 then
    raise exception 'Principal should see both programme draws; saw %', visible_count;
  end if;

  select count(*) into visible_count from public.scores;
  if visible_count <> 2 then
    raise exception 'Principal should see both programme scores; saw %', visible_count;
  end if;
end;
$$;

set local request.jwt.claims = '{"app_metadata":{"role":"unauthorized"}}';

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count from public.classes;
  if visible_count <> 0 then
    raise exception 'A user with an invalid role can read classes';
  end if;

  select count(*) into visible_count from public.students;
  if visible_count <> 0 then
    raise exception 'A user with an invalid role can read students';
  end if;
end;
$$;

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count from public.classes;
  if visible_count <> 0 then
    raise exception 'An anonymous user can read classes';
  end if;
end;
$$;

reset role;
select pass('RLS, role isolation, secure view, and student history checks passed');
select * from finish();

rollback;