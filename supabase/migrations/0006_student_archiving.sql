alter table public.students
  add column if not exists archived_at timestamptz;

create index if not exists students_active_class_idx
  on public.students (class_id)
  where archived_at is null;

revoke update on table public.students from authenticated;
grant update (archived_at) on table public.students to authenticated;

create policy "authorized staff can update student archive status"
on public.students
for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('principal', 'numeracy', 'literacy', 'just_a_minute'))
with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('principal', 'numeracy', 'literacy', 'just_a_minute'));
