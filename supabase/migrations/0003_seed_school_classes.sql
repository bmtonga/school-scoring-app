create unique index if not exists classes_grade_name_key
on public.classes (grade, name);

do $$
declare
  grade_value int;
  class_name text;
begin
  foreach grade_value in array array[1, 2, 10, 11, 12]
  loop
    foreach class_name in array array['N', 'J', 'V', 'R']
    loop
      insert into public.classes (id, grade, name, level)
      values (
        gen_random_uuid(),
        grade_value,
        class_name,
        case when grade_value < 3 then 'junior' else 'senior' end
      )
      on conflict (grade, name) do nothing;
    end loop;
  end loop;
end $$;
