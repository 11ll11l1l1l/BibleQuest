alter table public.bible_group_encouragements
  add column if not exists dedupe_bucket date;

create unique index if not exists bible_group_encouragements_daily_unique_idx
  on public.bible_group_encouragements(group_id,sender_id,coalesce(recipient_id,'00000000-0000-0000-0000-000000000000'::uuid),kind,dedupe_bucket)
  where dedupe_bucket is not null;

comment on column public.bible_group_encouragements.dedupe_bucket is
  'Server-assigned UTC day used to reject identical v3 encouragement sends; retained rows may be null for v2 compatibility.';
