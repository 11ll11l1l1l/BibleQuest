alter table public.bible_group_encouragements
  add column if not exists dedupe_bucket date;

create or replace function private.set_bible_group_encouragement_dedupe_bucket()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.dedupe_bucket := (now() at time zone 'UTC')::date;
  return new;
end;
$$;

revoke all on function private.set_bible_group_encouragement_dedupe_bucket() from public, anon, authenticated;

drop trigger if exists bible_group_encouragements_dedupe_bucket on public.bible_group_encouragements;
create trigger bible_group_encouragements_dedupe_bucket
before insert on public.bible_group_encouragements
for each row execute function private.set_bible_group_encouragement_dedupe_bucket();

create unique index if not exists bible_group_encouragements_daily_unique_idx
  on public.bible_group_encouragements(group_id,sender_id,coalesce(recipient_id,'00000000-0000-0000-0000-000000000000'::uuid),kind,dedupe_bucket)
  where dedupe_bucket is not null;

comment on column public.bible_group_encouragements.dedupe_bucket is
  'Database-assigned UTC day used to reject identical new encouragement sends; retained rows may be null for v2 compatibility.';
