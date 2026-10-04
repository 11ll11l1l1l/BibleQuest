-- V7 shared Library and ONE 2 ONE data foundation.
-- Pair-private messaging is intentionally excluded pending the accepted-contract reconciliation.
create schema if not exists private;

create table if not exists public.v7_library_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('book','devotional','past_teaching')),
  congregation_id uuid references public.bible_congregations(id) on delete cascade,
  publication_state text not null default 'draft' check (publication_state in ('draft','pending_review','published','withdrawn')),
  current_revision_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (publication_state <> 'published' or current_revision_id is not null)
);

create table if not exists public.v7_library_revisions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.v7_library_items(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  source_locale text not null,
  title text not null check (char_length(title) between 1 and 240),
  summary text not null default '',
  body jsonb not null default '{}'::jsonb,
  reading_minutes integer check (reading_minutes is null or reading_minutes between 1 and 1440),
  source_kind text not null check (source_kind in ('first_party','external','licensed','fixture')),
  source_title text not null,
  source_uri text,
  source_catalog_id text,
  source_revision text,
  source_date timestamptz,
  source_checksum text,
  creator text,
  originating_organization text,
  rights_status text not null check (rights_status in ('verified','unknown')),
  rights_holder text,
  rights_basis text,
  attribution text not null default '',
  allowed_uses jsonb not null default '[]'::jsonb check (jsonb_typeof(allowed_uses)='array'),
  publication_state text not null default 'draft' check (publication_state in ('draft','pending_review','published','withdrawn')),
  review_status text not null default 'draft' check (review_status in ('draft','pending_review','approved','rejected')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  revision_history uuid[] not null default '{}',
  derivatives uuid[] not null default '{}',
  withdrawal_reason text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (item_id, revision_number),
  unique (id, item_id),
  check ((source_uri is null or source_uri ~ '^https://') and (source_uri is not null or source_catalog_id is not null or source_kind='fixture')),
  check (rights_status <> 'verified' or (nullif(btrim(rights_holder),'') is not null and nullif(btrim(rights_basis),'') is not null)),
  check (publication_state <> 'published' or (rights_status='verified' and review_status='approved' and reviewer_id is not null and reviewed_at is not null and source_kind <> 'fixture'))
);

alter table public.v7_library_items
  add constraint v7_library_items_current_revision_fk
  foreign key (current_revision_id, id)
  references public.v7_library_revisions(id, item_id)
  deferrable initially deferred;

create table if not exists public.v7_library_translations (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.v7_library_revisions(id) on delete cascade,
  locale text not null,
  title text not null check (char_length(title) between 1 and 240),
  summary text not null default '',
  body jsonb not null default '{}'::jsonb,
  translated_from_revision_id uuid not null references public.v7_library_revisions(id) on delete restrict,
  translator text not null,
  review_status text not null default 'draft' check (review_status in ('draft','reviewed','rejected')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (revision_id, locale),
  check (locale <> ''),
  check (review_status <> 'reviewed' or (reviewer_id is not null and reviewed_at is not null))
);

create table if not exists public.v7_library_taxonomy (
  id text primary key check (id ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  kind text not null check (kind in ('category','topic','tag')),
  labels jsonb not null check (jsonb_typeof(labels)='object' and labels <> '{}'::jsonb),
  congregation_id uuid references public.bible_congregations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.v7_library_revision_taxonomy (
  revision_id uuid not null references public.v7_library_revisions(id) on delete cascade,
  taxonomy_id text not null references public.v7_library_taxonomy(id) on delete restrict,
  display_order integer not null check (display_order >= 0),
  primary key (revision_id, taxonomy_id),
  unique (revision_id, display_order, taxonomy_id)
);

create table if not exists public.v7_tracks (
  id uuid primary key default gen_random_uuid(),
  congregation_id uuid references public.bible_congregations(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  summary text not null default '',
  locale text not null,
  audience text not null default '',
  revision_id uuid not null default gen_random_uuid() unique,
  publication_state text not null default 'draft' check (publication_state in ('draft','published','withdrawn')),
  display_order integer not null default 0 check (display_order >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.v7_modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.v7_tracks(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  summary text not null default '',
  revision_id uuid not null default gen_random_uuid() unique,
  display_order integer not null check (display_order >= 0),
  publication_state text not null default 'draft' check (publication_state in ('draft','published','withdrawn')),
  created_at timestamptz not null default now(),
  unique (track_id, display_order)
);

create table if not exists public.v7_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.v7_modules(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  revision_id uuid not null default gen_random_uuid() unique,
  display_order integer not null check (display_order >= 0),
  publication_state text not null default 'draft' check (publication_state in ('draft','published','withdrawn')),
  created_at timestamptz not null default now(),
  unique (module_id, display_order)
);

create table if not exists public.v7_lesson_revisions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.v7_lessons(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  locale text not null,
  summary text not null default '',
  published_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (lesson_id, revision_number),
  unique (id, lesson_id)
);

create table if not exists public.v7_lesson_steps (
  id uuid primary key default gen_random_uuid(),
  lesson_revision_id uuid not null references public.v7_lesson_revisions(id) on delete cascade,
  position smallint not null check (position between 0 and 6),
  step_type text not null check (step_type=case position when 0 then 'scripture' when 1 then 'understand' when 2 then 'discuss' when 3 then 'reflect' when 4 then 'apply' when 5 then 'pray' when 6 then 'action' end),
  content jsonb not null default '{}'::jsonb,
  scripture_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(scripture_refs)='array'),
  library_revision_id uuid references public.v7_library_revisions(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (lesson_revision_id, position),
  unique (id, lesson_revision_id)
);

create table if not exists public.v7_mentor_pairs (
  id uuid primary key default gen_random_uuid(),
  congregation_id uuid not null references public.bible_congregations(id) on delete cascade,
  mentor_id uuid not null references auth.users(id) on delete restrict,
  mentee_id uuid not null references auth.users(id) on delete restrict,
  initiated_by uuid not null references auth.users(id) on delete restrict,
  state text not null default 'invited' check (state in ('invited','active','declined','suspended','ended')),
  mentor_accepted_at timestamptz,
  mentee_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz,
  check (mentor_id <> mentee_id),
  check (initiated_by in (mentor_id, mentee_id)),
  unique (id, congregation_id)
);

create unique index if not exists v7_mentor_pairs_one_open_relationship_idx
  on public.v7_mentor_pairs(congregation_id, mentor_id, mentee_id)
  where state in ('invited','active','suspended');

create table if not exists public.v7_pair_events (
  id bigint generated always as identity primary key,
  pair_id uuid not null references public.v7_mentor_pairs(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('invited','accepted','declined','suspended','resumed','ended','assignment_created')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now()
);

create table if not exists public.v7_pair_assignments (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.v7_mentor_pairs(id) on delete cascade,
  lesson_revision_id uuid not null references public.v7_lesson_revisions(id) on delete restrict,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  due_at timestamptz,
  status text not null default 'assigned' check (status in ('assigned','started','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, pair_id, lesson_revision_id),
  unique (id, lesson_revision_id)
);

create table if not exists public.v7_learner_progress (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.v7_pair_assignments(id) on delete cascade,
  learner_id uuid not null references auth.users(id) on delete cascade,
  lesson_revision_id uuid not null,
  current_step_id uuid,
  foreign key (assignment_id, lesson_revision_id) references public.v7_pair_assignments(id, lesson_revision_id) on delete cascade,
  foreign key (current_step_id, lesson_revision_id) references public.v7_lesson_steps(id, lesson_revision_id) on delete restrict,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (assignment_id, learner_id),
  check ((status <> 'completed') or completed_at is not null)
);

create table if not exists public.v7_lesson_responses (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.v7_pair_assignments(id) on delete cascade,
  lesson_revision_id uuid not null references public.v7_lesson_revisions(id) on delete restrict,
  lesson_step_id uuid not null,
  learner_id uuid not null references auth.users(id) on delete cascade,
  response jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, lesson_step_id, learner_id),
  foreign key (lesson_step_id, lesson_revision_id) references public.v7_lesson_steps(id, lesson_revision_id) on delete restrict
);

create table if not exists public.v7_response_shares (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.v7_lesson_responses(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete restrict,
  share_state text not null default 'shared' check (share_state in ('shared','revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (response_id, recipient_id),
  check ((share_state='shared' and revoked_at is null) or (share_state='revoked' and revoked_at is not null))
);

create index if not exists v7_library_items_published_idx on public.v7_library_items(publication_state, content_type, updated_at desc);
create index if not exists v7_library_revisions_item_idx on public.v7_library_revisions(item_id, revision_number desc);
create index if not exists v7_lesson_steps_revision_idx on public.v7_lesson_steps(lesson_revision_id, position);
create index if not exists v7_pair_assignments_pair_idx on public.v7_pair_assignments(pair_id, created_at desc);
create index if not exists v7_progress_learner_updated_idx on public.v7_learner_progress(learner_id, updated_at desc);
create index if not exists v7_responses_learner_updated_idx on public.v7_lesson_responses(learner_id, updated_at desc);
create index if not exists v7_response_shares_recipient_idx on public.v7_response_shares(recipient_id, share_state);

create or replace function private.v7_pair_has_user(target_pair uuid, target_user uuid, require_active boolean)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.v7_mentor_pairs p
    where p.id=target_pair
      and target_user=(select auth.uid())
      and target_user in (p.mentor_id,p.mentee_id)
      and (not require_active or p.state='active')
  );
$$;
revoke all on function private.v7_pair_has_user(uuid,uuid,boolean) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.v7_pair_has_user(uuid,uuid,boolean) to authenticated;

create or replace function private.v7_response_is_owned(target_response uuid, target_user uuid)
returns boolean language sql stable security definer set search_path = ''
as $bq$
  select exists (select 1 from public.v7_lesson_responses r where r.id=target_response and target_user=(select auth.uid()) and r.learner_id=target_user);
$bq$;

create or replace function private.v7_response_shared_with(target_response uuid, target_user uuid)
returns boolean language sql stable security definer set search_path = ''
as $bq$
  select exists (select 1 from public.v7_response_shares s where s.response_id=target_response and target_user=(select auth.uid()) and s.recipient_id=target_user and s.share_state='shared');
$bq$;

create or replace function private.v7_response_share_authorized(target_response uuid, target_user uuid, target_recipient uuid, require_active boolean)
returns boolean language sql stable security definer set search_path = ''
as $bq$
  select exists (
    select 1
    from public.v7_lesson_responses r
    join public.v7_pair_assignments a on a.id=r.assignment_id
    join public.v7_mentor_pairs p on p.id=a.pair_id
    where r.id=target_response and target_user=(select auth.uid()) and r.learner_id=target_user and p.mentor_id=target_recipient
      and (not require_active or p.state='active')
  );
$bq$;

revoke all on function private.v7_response_is_owned(uuid,uuid) from public,anon;
revoke all on function private.v7_response_shared_with(uuid,uuid) from public,anon;
revoke all on function private.v7_response_share_authorized(uuid,uuid,uuid,boolean) from public,anon;
grant execute on function private.v7_response_is_owned(uuid,uuid) to authenticated;
grant execute on function private.v7_response_shared_with(uuid,uuid) to authenticated;
grant execute on function private.v7_response_share_authorized(uuid,uuid,uuid,boolean) to authenticated;

create or replace function private.v7_guard_published_library_revision()
returns trigger language plpgsql set search_path = ''
as $bq$
begin
  if old.publication_state='published' then
    raise exception 'Published V7 Library revisions are immutable';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$bq$;

create trigger v7_library_revision_immutable
before update or delete on public.v7_library_revisions
for each row execute function private.v7_guard_published_library_revision();

create or replace function private.v7_guard_published_lesson_revision()
returns trigger language plpgsql set search_path = ''
as $bq$
declare step_count bigint;
begin
  if tg_op='DELETE' then
    if old.published_at is not null then raise exception 'Published V7 lesson revisions are immutable'; end if;
    return old;
  end if;
  if tg_op='UPDATE' and old.published_at is not null then
    raise exception 'Published V7 lesson revisions are immutable';
  end if;
  if tg_op='INSERT' and new.published_at is not null then
    raise exception 'Create a draft lesson revision and publish it after its steps are complete';
  end if;
  if tg_op='UPDATE' and old.published_at is null and new.published_at is not null then
    select count(*) into step_count from public.v7_lesson_steps s where s.lesson_revision_id=new.id;
    if step_count <> 7 then raise exception 'A published lesson revision must contain all seven ordered steps'; end if;
  end if;
  return new;
end;
$bq$;

create trigger v7_lesson_revision_immutable
before insert or update or delete on public.v7_lesson_revisions
for each row execute function private.v7_guard_published_lesson_revision();

create or replace function private.v7_guard_lesson_step_revision()
returns trigger language plpgsql set search_path = ''
as $bq$
begin
  if tg_op <> 'INSERT' and exists (select 1 from public.v7_lesson_revisions r where r.id=old.lesson_revision_id and r.published_at is not null) then
    raise exception 'Steps in a published V7 lesson revision are immutable';
  end if;
  if tg_op <> 'DELETE' and exists (select 1 from public.v7_lesson_revisions r where r.id=new.lesson_revision_id and r.published_at is not null) then
    raise exception 'Steps in a published V7 lesson revision are immutable';
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$bq$;

create trigger v7_lesson_step_immutable
before insert or update or delete on public.v7_lesson_steps
for each row execute function private.v7_guard_lesson_step_revision();

alter table public.v7_library_items enable row level security;
alter table public.v7_library_revisions enable row level security;
alter table public.v7_library_translations enable row level security;
alter table public.v7_library_taxonomy enable row level security;
alter table public.v7_library_revision_taxonomy enable row level security;
alter table public.v7_tracks enable row level security;
alter table public.v7_modules enable row level security;
alter table public.v7_lessons enable row level security;
alter table public.v7_lesson_revisions enable row level security;
alter table public.v7_lesson_steps enable row level security;
alter table public.v7_mentor_pairs enable row level security;
alter table public.v7_pair_events enable row level security;
alter table public.v7_pair_assignments enable row level security;
alter table public.v7_learner_progress enable row level security;
alter table public.v7_lesson_responses enable row level security;
alter table public.v7_response_shares enable row level security;

create policy "v7 library published read" on public.v7_library_items for select to authenticated
using ((publication_state='published' and (congregation_id is null or private.is_bible_congregation_member(congregation_id))) or private.bible_can_review_content(congregation_id));
create policy "v7 library editor insert" on public.v7_library_items for insert to authenticated
with check (created_by=(select auth.uid()) and private.bible_can_review_content(congregation_id));
create policy "v7 library editor update" on public.v7_library_items for update to authenticated
using (private.bible_can_review_content(congregation_id))
with check (private.bible_can_review_content(congregation_id));

create policy "v7 library revision read" on public.v7_library_revisions for select to authenticated
using (exists (
  select 1 from public.v7_library_items i
  where i.id=item_id and ((i.current_revision_id=id and i.publication_state='published'
    and (i.congregation_id is null or private.is_bible_congregation_member(i.congregation_id))) or private.bible_can_review_content(i.congregation_id))
));
create policy "v7 library revision editor insert" on public.v7_library_revisions for insert to authenticated
with check (created_by=(select auth.uid()) and private.bible_can_review_content((select i.congregation_id from public.v7_library_items i where i.id=item_id)));
create policy "v7 library revision editor update" on public.v7_library_revisions for update to authenticated
using (publication_state<>'published' and private.bible_can_review_content((select i.congregation_id from public.v7_library_items i where i.id=item_id)))
with check (private.bible_can_review_content((select i.congregation_id from public.v7_library_items i where i.id=item_id)));
create policy "v7 library translation read" on public.v7_library_translations for select to authenticated
using (review_status='reviewed' and exists (
  select 1 from public.v7_library_revisions r join public.v7_library_items i on i.id=r.item_id
  where r.id=revision_id and i.current_revision_id=r.id and i.publication_state='published'
    and (i.congregation_id is null or private.is_bible_congregation_member(i.congregation_id))
));
create policy "v7 library translation editor" on public.v7_library_translations for all to authenticated
using (private.bible_can_review_content((select i.congregation_id from public.v7_library_revisions r join public.v7_library_items i on i.id=r.item_id where r.id=revision_id)))
with check (private.bible_can_review_content((select i.congregation_id from public.v7_library_revisions r join public.v7_library_items i on i.id=r.item_id where r.id=revision_id)));

create policy "v7 taxonomy read" on public.v7_library_taxonomy for select to authenticated
using (congregation_id is null or private.is_bible_congregation_member(congregation_id));
create policy "v7 taxonomy editor insert" on public.v7_library_taxonomy for insert to authenticated
with check (created_by=(select auth.uid()) and private.bible_can_review_content(congregation_id));
create policy "v7 taxonomy editor update" on public.v7_library_taxonomy for update to authenticated
using (private.bible_can_review_content(congregation_id))
with check (private.bible_can_review_content(congregation_id));
create policy "v7 revision taxonomy read" on public.v7_library_revision_taxonomy for select to authenticated
using (exists (select 1 from public.v7_library_revisions r join public.v7_library_items i on i.id=r.item_id
  where r.id=revision_id and i.current_revision_id=r.id and i.publication_state='published'
    and (i.congregation_id is null or private.is_bible_congregation_member(i.congregation_id))));
create policy "v7 revision taxonomy editor" on public.v7_library_revision_taxonomy for all to authenticated
using (exists (select 1 from public.v7_library_revisions r join public.v7_library_items i on i.id=r.item_id
  where r.id=revision_id and private.bible_can_review_content(i.congregation_id)))
with check (exists (select 1 from public.v7_library_revisions r join public.v7_library_items i on i.id=r.item_id
  where r.id=revision_id and private.bible_can_review_content(i.congregation_id)));

create policy "v7 tracks published read" on public.v7_tracks for select to authenticated
using ((publication_state='published' and (congregation_id is null or private.is_bible_congregation_member(congregation_id))) or private.bible_can_review_content(congregation_id));
create policy "v7 tracks editor insert" on public.v7_tracks for insert to authenticated
with check (created_by=(select auth.uid()) and private.bible_can_review_content(congregation_id));
create policy "v7 tracks editor update" on public.v7_tracks for update to authenticated
using (private.bible_can_review_content(congregation_id)) with check (private.bible_can_review_content(congregation_id));
create policy "v7 modules published read" on public.v7_modules for select to authenticated
using (publication_state='published' and exists (select 1 from public.v7_tracks t where t.id=track_id and t.publication_state='published'
  and (t.congregation_id is null or private.is_bible_congregation_member(t.congregation_id))));
create policy "v7 modules editor" on public.v7_modules for all to authenticated
using (exists (select 1 from public.v7_tracks t where t.id=track_id and private.bible_can_review_content(t.congregation_id)))
with check (exists (select 1 from public.v7_tracks t where t.id=track_id and private.bible_can_review_content(t.congregation_id)));
create policy "v7 lessons published read" on public.v7_lessons for select to authenticated
using (publication_state='published' and exists (select 1 from public.v7_modules m join public.v7_tracks t on t.id=m.track_id where m.id=module_id
  and m.publication_state='published' and t.publication_state='published'
  and (t.congregation_id is null or private.is_bible_congregation_member(t.congregation_id))));
create policy "v7 lessons editor" on public.v7_lessons for all to authenticated
using (exists (select 1 from public.v7_modules m join public.v7_tracks t on t.id=m.track_id where m.id=module_id and private.bible_can_review_content(t.congregation_id)))
with check (exists (select 1 from public.v7_modules m join public.v7_tracks t on t.id=m.track_id where m.id=module_id and private.bible_can_review_content(t.congregation_id)));
create policy "v7 lesson revision read" on public.v7_lesson_revisions for select to authenticated
using (published_at is not null and exists (select 1 from public.v7_lessons l join public.v7_modules m on m.id=l.module_id join public.v7_tracks t on t.id=m.track_id
  where l.id=lesson_id and l.publication_state='published' and m.publication_state='published' and t.publication_state='published'
  and (t.congregation_id is null or private.is_bible_congregation_member(t.congregation_id))));
create policy "v7 lesson revision editor" on public.v7_lesson_revisions for all to authenticated
using (exists (select 1 from public.v7_lessons l join public.v7_modules m on m.id=l.module_id join public.v7_tracks t on t.id=m.track_id
  where l.id=lesson_id and private.bible_can_review_content(t.congregation_id)))
with check (exists (select 1 from public.v7_lessons l join public.v7_modules m on m.id=l.module_id join public.v7_tracks t on t.id=m.track_id
  where l.id=lesson_id and private.bible_can_review_content(t.congregation_id)));
create policy "v7 lesson steps read" on public.v7_lesson_steps for select to authenticated
using (exists (select 1 from public.v7_lesson_revisions r join public.v7_lessons l on l.id=r.lesson_id join public.v7_modules m on m.id=l.module_id join public.v7_tracks t on t.id=m.track_id
  where r.id=lesson_revision_id and r.published_at is not null and l.publication_state='published' and m.publication_state='published' and t.publication_state='published'
  and (t.congregation_id is null or private.is_bible_congregation_member(t.congregation_id))));
create policy "v7 lesson steps editor" on public.v7_lesson_steps for all to authenticated
using (exists (select 1 from public.v7_lesson_revisions r join public.v7_lessons l on l.id=r.lesson_id join public.v7_modules m on m.id=l.module_id join public.v7_tracks t on t.id=m.track_id
  where r.id=lesson_revision_id and private.bible_can_review_content(t.congregation_id)))
with check (exists (select 1 from public.v7_lesson_revisions r join public.v7_lessons l on l.id=r.lesson_id join public.v7_modules m on m.id=l.module_id join public.v7_tracks t on t.id=m.track_id
  where r.id=lesson_revision_id and private.bible_can_review_content(t.congregation_id)));

create policy "v7 pair participant read" on public.v7_mentor_pairs for select to authenticated
using (private.v7_pair_has_user(id,(select auth.uid()),false));
create policy "v7 pair leader invitation" on public.v7_mentor_pairs for insert to authenticated
with check (
  initiated_by=(select auth.uid()) and state='invited'
  and private.bible_can_review_content(congregation_id)
  and exists (select 1 from public.bible_congregation_members m where m.congregation_id=public.v7_mentor_pairs.congregation_id and m.user_id=mentor_id and m.active)
  and exists (select 1 from public.bible_congregation_members m where m.congregation_id=public.v7_mentor_pairs.congregation_id and m.user_id=mentee_id and m.active)
);
create policy "v7 pair event participant read" on public.v7_pair_events for select to authenticated
using (private.v7_pair_has_user(pair_id,(select auth.uid()),false));
create policy "v7 pair assignments participant read" on public.v7_pair_assignments for select to authenticated
using (private.v7_pair_has_user(pair_id,(select auth.uid()),false));
create policy "v7 pair mentor assignment insert" on public.v7_pair_assignments for insert to authenticated
with check (assigned_by=(select auth.uid()) and exists (select 1 from public.v7_mentor_pairs p where p.id=pair_id and p.mentor_id=(select auth.uid()) and p.state='active'));
create policy "v7 pair assignment mentor update" on public.v7_pair_assignments for update to authenticated
using (exists (select 1 from public.v7_mentor_pairs p where p.id=pair_id and p.mentor_id=(select auth.uid()) and p.state='active'))
with check (exists (select 1 from public.v7_mentor_pairs p where p.id=pair_id and p.mentor_id=(select auth.uid()) and p.state='active'));
create policy "v7 progress pair participants read" on public.v7_learner_progress for select to authenticated
using (exists (select 1 from public.v7_pair_assignments a where a.id=assignment_id and private.v7_pair_has_user(a.pair_id,(select auth.uid()),true)));
create policy "v7 progress learner insert" on public.v7_learner_progress for insert to authenticated
with check (learner_id=(select auth.uid()) and exists (select 1 from public.v7_pair_assignments a join public.v7_mentor_pairs p on p.id=a.pair_id where a.id=assignment_id and p.mentee_id=(select auth.uid()) and p.state='active'));
create policy "v7 progress learner update" on public.v7_learner_progress for update to authenticated
using (learner_id=(select auth.uid())) with check (learner_id=(select auth.uid()) and exists (select 1 from public.v7_pair_assignments a join public.v7_mentor_pairs p on p.id=a.pair_id where a.id=assignment_id and p.mentee_id=(select auth.uid()) and p.state='active'));
create policy "v7 response learner read" on public.v7_lesson_responses for select to authenticated
using (learner_id=(select auth.uid()) or (private.v7_response_shared_with(id,(select auth.uid())) and exists (select 1 from public.v7_pair_assignments a where a.id=assignment_id and private.v7_pair_has_user(a.pair_id,(select auth.uid()),true))));
create policy "v7 response learner insert" on public.v7_lesson_responses for insert to authenticated
with check (learner_id=(select auth.uid()) and exists (select 1 from public.v7_pair_assignments a join public.v7_mentor_pairs p on p.id=a.pair_id where a.id=assignment_id and a.lesson_revision_id=public.v7_lesson_responses.lesson_revision_id and p.mentee_id=(select auth.uid()) and p.state='active'));
create policy "v7 response learner update" on public.v7_lesson_responses for update to authenticated
using (learner_id=(select auth.uid())) with check (learner_id=(select auth.uid()) and exists (select 1 from public.v7_pair_assignments a join public.v7_mentor_pairs p on p.id=a.pair_id where a.id=assignment_id and a.lesson_revision_id=public.v7_lesson_responses.lesson_revision_id and p.mentee_id=(select auth.uid()) and p.state='active'));
create policy "v7 response owner delete" on public.v7_lesson_responses for delete to authenticated
using (learner_id=(select auth.uid()));
create policy "v7 response share participant read" on public.v7_response_shares for select to authenticated
using (recipient_id=(select auth.uid()) or private.v7_response_is_owned(response_id,(select auth.uid())));
create policy "v7 response share owner insert" on public.v7_response_shares for insert to authenticated
with check (share_state='shared' and private.v7_response_share_authorized(response_id,(select auth.uid()),recipient_id,true));
create policy "v7 response share owner update" on public.v7_response_shares for update to authenticated
using (private.v7_response_share_authorized(response_id,(select auth.uid()),recipient_id,false))
with check (private.v7_response_share_authorized(response_id,(select auth.uid()),recipient_id,share_state='shared'));

revoke all on public.v7_library_items,public.v7_library_revisions,public.v7_library_translations,public.v7_library_taxonomy,public.v7_library_revision_taxonomy,public.v7_tracks,public.v7_modules,public.v7_lessons,public.v7_lesson_revisions,public.v7_lesson_steps,public.v7_mentor_pairs,public.v7_pair_events,public.v7_pair_assignments,public.v7_learner_progress,public.v7_lesson_responses,public.v7_response_shares from public,anon,authenticated;
grant select,insert,update on public.v7_library_items to authenticated;
grant select,insert,update on public.v7_library_revisions to authenticated;
grant select,insert,update,delete on public.v7_library_translations to authenticated;
grant select,insert,update,delete on public.v7_library_taxonomy to authenticated;
grant select,insert,update,delete on public.v7_library_revision_taxonomy to authenticated;
grant select,insert,update on public.v7_tracks,public.v7_modules,public.v7_lessons,public.v7_lesson_revisions,public.v7_lesson_steps to authenticated;
grant select,insert on public.v7_mentor_pairs to authenticated;
grant select on public.v7_pair_events to authenticated;
grant select,insert,update on public.v7_pair_assignments,public.v7_learner_progress to authenticated;
grant select,insert,update,delete on public.v7_lesson_responses to authenticated;
grant select,insert,update on public.v7_response_shares to authenticated;

revoke all on public.v7_pair_events from anon, authenticated;
grant select on public.v7_pair_events to authenticated;
