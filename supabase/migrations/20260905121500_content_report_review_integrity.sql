create or replace function private.bible_guard_content_report_review_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.congregation_id is distinct from old.congregation_id
     or new.reporter_id is distinct from old.reporter_id
     or new.content_key is distinct from old.content_key
     or new.content_type is distinct from old.content_type
     or new.content_source is distinct from old.content_source
     or new.content_ref is distinct from old.content_ref
     or new.content_text is distinct from old.content_text
     or new.content_payload is distinct from old.content_payload
     or new.reason is distinct from old.reason
     or new.note is distinct from old.note
     or new.created_at is distinct from old.created_at then
    raise exception 'submitted content report fields are immutable';
  end if;

  if (select auth.uid()) is not null
     and new.reviewed_by is distinct from (select auth.uid()) then
    raise exception 'reviewed_by must match the authenticated reviewer';
  end if;

  return new;
end;
$$;

revoke all on function private.bible_guard_content_report_review_update() from public, anon, authenticated;

drop trigger if exists bible_content_reports_review_integrity on public.bible_content_reports;
create trigger bible_content_reports_review_integrity
before update on public.bible_content_reports
for each row execute function private.bible_guard_content_report_review_update();

drop policy if exists "content reports reviewer update" on public.bible_content_reports;
create policy "content reports reviewer update"
on public.bible_content_reports for update
to authenticated
using (private.bible_can_review_content(congregation_id))
with check (
  private.bible_can_review_content(congregation_id)
  and reviewed_by = (select auth.uid())
);
