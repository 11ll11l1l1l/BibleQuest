-- V7 RESET Lane B: global Library review decisions and automated-policy publication identity.
-- Keeps congregation Recall moderation separate from the V7 Library audit trail.

alter table public.v7_library_revisions
  add column if not exists reviewer_type text,
  add column if not exists review_policy_id text,
  add column if not exists review_policy_version text,
  add column if not exists review_evidence jsonb not null default '{}'::jsonb;

do $bq$
declare constraint_row record;
begin
  for constraint_row in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.v7_library_revisions'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%publication_state%'
      and pg_get_constraintdef(c.oid) ilike '%reviewer_id%'
  loop
    execute format(
      'alter table public.v7_library_revisions drop constraint %I',
      constraint_row.conname
    );
  end loop;
end
$bq$;

alter table public.v7_library_revisions
  drop constraint if exists v7_library_revisions_reviewer_type_check,
  add constraint v7_library_revisions_reviewer_type_check
    check (reviewer_type is null or reviewer_type in ('automated_policy','human')),
  drop constraint if exists v7_library_revisions_review_evidence_object_check,
  add constraint v7_library_revisions_review_evidence_object_check
    check (jsonb_typeof(review_evidence) = 'object'),
  drop constraint if exists v7_library_revisions_publication_review_check,
  add constraint v7_library_revisions_publication_review_check
    check (
      publication_state <> 'published'
      or (
        rights_status = 'verified'
        and review_status = 'approved'
        and reviewed_at is not null
        and source_kind <> 'fixture'
        and (
          (
            coalesce(reviewer_type,'human') = 'human'
            and reviewer_id is not null
            and nullif(btrim(review_policy_id),'') is null
            and nullif(btrim(review_policy_version),'') is null
          )
          or (
            reviewer_type = 'automated_policy'
            and reviewer_id is null
            and nullif(btrim(review_policy_id),'') is not null
            and nullif(btrim(review_policy_version),'') is not null
          )
        )
      )
    );

create table if not exists public.v7_library_review_decisions (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.v7_library_items(id) on delete cascade,
  revision_id uuid not null references public.v7_library_revisions(id) on delete cascade,
  content_type text not null check (content_type in ('book','devotional','past_teaching')),
  reviewer_type text not null check (reviewer_type in ('automated_policy','human')),
  decision text not null check (decision in ('auto_approved','needs_repair','approved','request_changes','rejected')),
  policy_id text,
  policy_version text,
  reviewer_id uuid references auth.users(id) on delete set null,
  criteria jsonb not null default '[]'::jsonb check (jsonb_typeof(criteria) = 'array'),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  note text check (note is null or char_length(note) <= 4000),
  decided_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (revision_id,item_id) references public.v7_library_revisions(id,item_id) on delete cascade,
  check (
    (
      reviewer_type = 'automated_policy'
      and reviewer_id is null
      and decision in ('auto_approved','needs_repair','rejected')
      and nullif(btrim(policy_id),'') is not null
      and nullif(btrim(policy_version),'') is not null
    )
    or
    (
      reviewer_type = 'human'
      and reviewer_id is not null
      and decision in ('approved','request_changes','rejected')
      and nullif(btrim(policy_id),'') is null
      and nullif(btrim(policy_version),'') is null
    )
  )
);

create index if not exists v7_library_review_decisions_revision_history_idx
  on public.v7_library_review_decisions(revision_id,decided_at desc,id desc);
create index if not exists v7_library_review_decisions_item_history_idx
  on public.v7_library_review_decisions(item_id,decided_at desc,id desc);
create index if not exists v7_library_review_decisions_outcome_idx
  on public.v7_library_review_decisions(reviewer_type,decision,decided_at desc);

create or replace function private.v7_guard_library_review_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $bq$
declare
  target_item public.v7_library_items%rowtype;
  target_revision public.v7_library_revisions%rowtype;
begin
  select * into target_item
  from public.v7_library_items i
  where i.id = new.item_id;

  select * into target_revision
  from public.v7_library_revisions r
  where r.id = new.revision_id and r.item_id = new.item_id;

  if target_item.id is null or target_revision.id is null then
    raise exception 'V7 Library review target is unavailable';
  end if;
  if target_item.content_type is distinct from new.content_type then
    raise exception 'V7 Library review content type does not match the item';
  end if;

  if new.reviewer_type = 'human' then
    if (select auth.uid()) is null or new.reviewer_id is distinct from (select auth.uid()) then
      raise exception 'Human Library review identity must match the authenticated reviewer';
    end if;
    if not private.bible_can_review_content(target_item.congregation_id) then
      raise exception 'Library review is not authorized for this item';
    end if;
  end if;

  return new;
end;
$bq$;

revoke all on function private.v7_guard_library_review_decision() from public,anon,authenticated;

drop trigger if exists v7_library_review_decision_guard on public.v7_library_review_decisions;
create trigger v7_library_review_decision_guard
before insert on public.v7_library_review_decisions
for each row execute function private.v7_guard_library_review_decision();

create or replace function private.v7_library_review_decision_immutable()
returns trigger
language plpgsql
set search_path = ''
as $bq$
begin
  raise exception 'V7 Library review decisions are immutable audit history';
end;
$bq$;

revoke all on function private.v7_library_review_decision_immutable() from public,anon,authenticated;

drop trigger if exists v7_library_review_decision_immutable on public.v7_library_review_decisions;
create trigger v7_library_review_decision_immutable
before update or delete on public.v7_library_review_decisions
for each row execute function private.v7_library_review_decision_immutable();

create or replace function private.v7_guard_library_automated_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $bq$
begin
  if new.publication_state = 'published'
     and old.publication_state is distinct from 'published'
     and new.reviewer_type = 'automated_policy' then
    if not exists (
      select 1
      from public.v7_library_review_decisions d
      where d.item_id = new.item_id
        and d.revision_id = new.id
        and d.reviewer_type = 'automated_policy'
        and d.decision = 'auto_approved'
        and d.policy_id = new.review_policy_id
        and d.policy_version = new.review_policy_version
        and d.decided_at = new.reviewed_at
        and jsonb_array_length(d.criteria) > 0
        and jsonb_array_length(d.evidence_refs) > 0
    ) then
      raise exception 'Automated V7 Library publication requires an exact auditable auto-approved decision';
    end if;
  end if;
  return new;
end;
$bq$;

revoke all on function private.v7_guard_library_automated_publication() from public,anon,authenticated;

drop trigger if exists v7_library_automated_publication_guard on public.v7_library_revisions;
create trigger v7_library_automated_publication_guard
before update on public.v7_library_revisions
for each row execute function private.v7_guard_library_automated_publication();

alter table public.v7_library_review_decisions enable row level security;
revoke all on public.v7_library_review_decisions from public,anon,authenticated;
grant select,insert on public.v7_library_review_decisions to authenticated;

drop policy if exists "v7 library review authorized read" on public.v7_library_review_decisions;
create policy "v7 library review authorized read"
on public.v7_library_review_decisions for select
to authenticated
using (
  exists (
    select 1
    from public.v7_library_items i
    where i.id = public.v7_library_review_decisions.item_id
      and private.bible_can_review_content(i.congregation_id)
  )
);

drop policy if exists "v7 library human review insert" on public.v7_library_review_decisions;
create policy "v7 library human review insert"
on public.v7_library_review_decisions for insert
to authenticated
with check (
  reviewer_type = 'human'
  and reviewer_id = (select auth.uid())
  and exists (
    select 1
    from public.v7_library_items i
    where i.id = public.v7_library_review_decisions.item_id
      and private.bible_can_review_content(i.congregation_id)
  )
);

comment on table public.v7_library_review_decisions is
  'Immutable global/tenant V7 Library audit history. Automated rows are system-authored; browser reviewers may insert only truthful human overrides.';
comment on column public.v7_library_revisions.reviewer_type is
  'Final publication reviewer identity: human or automated_policy. Legacy human approvals may remain null when reviewer_id is populated.';
comment on column public.v7_library_revisions.review_evidence is
  'Exact-revision publication evidence summary; detailed immutable history lives in v7_library_review_decisions.';
