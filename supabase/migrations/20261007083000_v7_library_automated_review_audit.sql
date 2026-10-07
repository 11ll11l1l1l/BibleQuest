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
  second_pass jsonb not null default '{}'::jsonb check (jsonb_typeof(second_pass) = 'object'),
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
        and d.second_pass ->> 'result' = 'pass'
        and d.second_pass ->> 'revision' = new.id::text
        and nullif(btrim(d.second_pass ->> 'evaluator'),'') is not null
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
grant select on public.v7_library_review_decisions to authenticated;

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



create or replace function public.bible_v7_apply_human_library_review(
  p_item_id uuid,
  p_revision_id uuid,
  p_decision text,
  p_decided_at timestamptz,
  p_note text default null
)
returns public.v7_library_review_decisions
language plpgsql
security definer
set search_path = ''
as $bq$
declare
  actor_id uuid := (select auth.uid());
  target_item public.v7_library_items%rowtype;
  target_revision public.v7_library_revisions%rowtype;
  inserted public.v7_library_review_decisions%rowtype;
begin
  if actor_id is null then
    raise exception 'Library review requires an authenticated reviewer';
  end if;
  if p_decision not in ('approved','request_changes','rejected') then
    raise exception 'Unsupported human Library review decision';
  end if;
  if p_decided_at is null then
    raise exception 'Human Library review requires a decision timestamp';
  end if;
  if p_note is not null and char_length(p_note) > 4000 then
    raise exception 'Human Library review note is too long';
  end if;

  select * into target_item
  from public.v7_library_items i
  where i.id = p_item_id
  for update;
  if target_item.id is null then
    raise exception 'V7 Library item is unavailable';
  end if;

  select * into target_revision
  from public.v7_library_revisions r
  where r.id = p_revision_id and r.item_id = p_item_id
  for update;
  if target_revision.id is null then
    raise exception 'V7 Library revision is unavailable';
  end if;
  if target_item.current_revision_id is distinct from p_revision_id then
    raise exception 'Human Library review must target the current revision';
  end if;
  if not private.bible_can_review_content(target_item.congregation_id) then
    raise exception 'Library review is not authorized for this item';
  end if;

  insert into public.v7_library_review_decisions (
    item_id,
    revision_id,
    content_type,
    reviewer_type,
    decision,
    policy_id,
    policy_version,
    reviewer_id,
    criteria,
    second_pass,
    evidence_refs,
    note,
    decided_at
  ) values (
    p_item_id,
    p_revision_id,
    target_item.content_type,
    'human',
    p_decision,
    null,
    null,
    actor_id,
    '[]'::jsonb,
    '{}'::jsonb,
    '[]'::jsonb,
    p_note,
    p_decided_at
  )
  returning * into inserted;

  if p_decision = 'approved' then
    update public.v7_library_revisions
    set review_status = 'approved',
        reviewer_type = 'human',
        reviewer_id = actor_id,
        review_policy_id = null,
        review_policy_version = null,
        review_evidence = jsonb_build_object('humanDecisionId', inserted.id),
        reviewed_at = p_decided_at,
        publication_state = 'published',
        withdrawal_reason = null
    where id = p_revision_id and item_id = p_item_id;

    update public.v7_library_items
    set current_revision_id = p_revision_id,
        publication_state = 'published',
        updated_at = p_decided_at
    where id = p_item_id;
  elsif p_decision = 'request_changes' then
    update public.v7_library_revisions
    set review_status = 'pending_review',
        reviewer_type = 'human',
        reviewer_id = actor_id,
        review_policy_id = null,
        review_policy_version = null,
        review_evidence = jsonb_build_object('humanDecisionId', inserted.id),
        reviewed_at = p_decided_at,
        publication_state = 'pending_review',
        withdrawal_reason = null
    where id = p_revision_id and item_id = p_item_id;

    update public.v7_library_items
    set publication_state = 'pending_review',
        updated_at = p_decided_at
    where id = p_item_id;
  else
    update public.v7_library_revisions
    set review_status = 'rejected',
        reviewer_type = 'human',
        reviewer_id = actor_id,
        review_policy_id = null,
        review_policy_version = null,
        review_evidence = jsonb_build_object('humanDecisionId', inserted.id),
        reviewed_at = p_decided_at,
        publication_state = 'withdrawn',
        withdrawal_reason = coalesce(nullif(btrim(p_note),''),'Rejected in Content Review')
    where id = p_revision_id and item_id = p_item_id;

    update public.v7_library_items
    set publication_state = 'withdrawn',
        updated_at = p_decided_at
    where id = p_item_id;
  end if;

  return inserted;
end;
$bq$;

revoke all on function public.bible_v7_apply_human_library_review(uuid,uuid,text,timestamptz,text)
  from public,anon;
grant execute on function public.bible_v7_apply_human_library_review(uuid,uuid,text,timestamptz,text)
  to authenticated;

comment on function public.bible_v7_apply_human_library_review(uuid,uuid,text,timestamptz,text) is
  'Authenticated protected Content Review override: append immutable human audit history and atomically publish, requeue, or withdraw the exact current Library revision.';

create or replace function public.bible_v7_apply_automated_library_review(
  p_item_id uuid,
  p_revision_id uuid,
  p_decision text,
  p_policy_id text,
  p_policy_version text,
  p_criteria jsonb,
  p_second_pass jsonb,
  p_evidence_refs jsonb,
  p_decided_at timestamptz,
  p_note text default null
)
returns public.v7_library_review_decisions
language plpgsql
security definer
set search_path = ''
as $bq$
declare
  target_item public.v7_library_items%rowtype;
  target_revision public.v7_library_revisions%rowtype;
  required_ids text[] := array[
    'source_identity',
    'provenance',
    'permitted_use_rights',
    'source_fidelity',
    'scripture_reference_validity',
    'scripture_context',
    'theological_fidelity',
    'editorial_coherence',
    'audience_suitability',
    'duplicate_fragment_detection',
    'emotion_need_relevance',
    'catalog_diversity',
    'revision_integrity',
    'metadata_integrity',
    'adversarial_qa'
  ];
  required_count integer;
  matched_count integer;
  inserted public.v7_library_review_decisions%rowtype;
begin
  if p_decision not in ('auto_approved','needs_repair','rejected') then
    raise exception 'Unsupported automated Library decision';
  end if;
  if nullif(btrim(p_policy_id),'') is null or nullif(btrim(p_policy_version),'') is null then
    raise exception 'Automated Library review requires policy identity and version';
  end if;
  if p_decided_at is null then
    raise exception 'Automated Library review requires a decision timestamp';
  end if;
  if jsonb_typeof(p_criteria) is distinct from 'array'
     or jsonb_typeof(p_second_pass) is distinct from 'object'
     or jsonb_typeof(p_evidence_refs) is distinct from 'array' then
    raise exception 'Automated Library review evidence has an invalid shape';
  end if;

  select * into target_item
  from public.v7_library_items i
  where i.id = p_item_id
  for update;
  if target_item.id is null then raise exception 'V7 Library item is unavailable'; end if;

  select * into target_revision
  from public.v7_library_revisions r
  where r.id = p_revision_id and r.item_id = p_item_id
  for update;
  if target_revision.id is null then raise exception 'V7 Library revision is unavailable'; end if;

  if target_item.current_revision_id is not null and target_item.current_revision_id is distinct from p_revision_id then
    raise exception 'Automated review must target the current V7 Library revision';
  end if;

  if target_item.content_type = 'devotional' then
    required_ids := required_ids || array[
      'translation_completeness',
      'translation_semantic_fidelity',
      'translation_naturalness'
    ];
  end if;
  required_count := cardinality(required_ids);

  if p_decision = 'auto_approved' then
    if target_revision.rights_status <> 'verified'
       or target_revision.source_kind = 'fixture'
       or jsonb_array_length(target_revision.allowed_uses) = 0 then
      raise exception 'Auto-publication requires verified rights, permitted use and a non-fixture source';
    end if;
    if jsonb_array_length(p_criteria) <> required_count then
      raise exception 'Auto-publication requires every policy criterion exactly once';
    end if;

    select count(distinct criterion ->> 'id') into matched_count
    from jsonb_array_elements(p_criteria) criterion
    where criterion ->> 'id' = any(required_ids);
    if matched_count <> required_count then
      raise exception 'Auto-publication criteria do not match the required policy inventory';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(p_criteria) criterion
      where criterion ->> 'result' is distinct from 'pass'
        or nullif(btrim(criterion ->> 'evaluator'),'') is null
        or nullif(btrim(criterion ->> 'evaluatedAt'),'') is null
        or jsonb_typeof(criterion -> 'evidenceRefs') is distinct from 'array'
        or jsonb_array_length(criterion -> 'evidenceRefs') = 0
    ) then
      raise exception 'Auto-publication requires passing timestamped evidence for every criterion';
    end if;

    perform (criterion ->> 'evaluatedAt')::timestamptz
    from jsonb_array_elements(p_criteria) criterion;

    if p_second_pass ->> 'result' is distinct from 'pass'
       or p_second_pass ->> 'revision' is distinct from p_revision_id::text
       or nullif(btrim(p_second_pass ->> 'evaluator'),'') is null
       or nullif(btrim(p_second_pass ->> 'evaluatedAt'),'') is null
       or jsonb_typeof(p_second_pass -> 'evidenceRefs') is distinct from 'array'
       or jsonb_array_length(p_second_pass -> 'evidenceRefs') = 0 then
      raise exception 'Auto-publication requires a passing exact-revision second pass with evidence';
    end if;

    perform (p_second_pass ->> 'evaluatedAt')::timestamptz;

    if exists (
      select 1
      from jsonb_array_elements(p_criteria) criterion
      where criterion ->> 'evaluator' = p_second_pass ->> 'evaluator'
    ) then
      raise exception 'Auto-publication second pass must be independent from primary evaluators';
    end if;

    if jsonb_array_length(p_evidence_refs) = 0 then
      raise exception 'Auto-publication requires decision evidence';
    end if;
  end if;

  insert into public.v7_library_review_decisions (
    item_id,
    revision_id,
    content_type,
    reviewer_type,
    decision,
    policy_id,
    policy_version,
    reviewer_id,
    criteria,
    second_pass,
    evidence_refs,
    note,
    decided_at
  ) values (
    p_item_id,
    p_revision_id,
    target_item.content_type,
    'automated_policy',
    p_decision,
    p_policy_id,
    p_policy_version,
    null,
    p_criteria,
    p_second_pass,
    p_evidence_refs,
    p_note,
    p_decided_at
  )
  returning * into inserted;

  if p_decision = 'auto_approved' then
    update public.v7_library_revisions
    set review_status = 'approved',
        reviewer_type = 'automated_policy',
        reviewer_id = null,
        review_policy_id = p_policy_id,
        review_policy_version = p_policy_version,
        review_evidence = jsonb_build_object(
          'decisionId', inserted.id,
          'criteria', p_criteria,
          'secondPass', p_second_pass,
          'evidenceRefs', p_evidence_refs
        ),
        reviewed_at = p_decided_at,
        publication_state = 'published'
    where id = p_revision_id and item_id = p_item_id;

    update public.v7_library_items
    set current_revision_id = p_revision_id,
        publication_state = 'published',
        updated_at = p_decided_at
    where id = p_item_id;
  end if;

  return inserted;
end;
$bq$;

revoke all on function public.bible_v7_apply_automated_library_review(uuid,uuid,text,text,text,jsonb,jsonb,jsonb,timestamptz,text)
  from public,anon,authenticated;
grant execute on function public.bible_v7_apply_automated_library_review(uuid,uuid,text,text,text,jsonb,jsonb,jsonb,timestamptz,text)
  to service_role;

comment on function public.bible_v7_apply_automated_library_review(uuid,uuid,text,text,text,jsonb,jsonb,jsonb,timestamptz,text) is
  'Service-role Lane B transition: persist automated review evidence and publish only exact-revision all-pass V7 Library content.';

comment on table public.v7_library_review_decisions is
  'Immutable global/tenant V7 Library audit history. Automated rows are system-authored; browser reviewers may insert only truthful human overrides.';
comment on column public.v7_library_revisions.reviewer_type is
  'Final publication reviewer identity: human or automated_policy. Legacy human approvals may remain null when reviewer_id is populated.';
comment on column public.v7_library_revisions.review_evidence is
  'Exact-revision publication evidence summary; detailed immutable history lives in v7_library_review_decisions.';
