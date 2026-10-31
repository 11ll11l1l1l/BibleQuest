-- V8 central Drive metadata. Dark by default; no provider credentials or grants to browsers.
begin;
create table public.bible_v8_media_quota (
  provider text primary key check (provider = 'google_drive'),
  capacity_bytes bigint not null default 0 check (capacity_bytes >= 0),
  used_bytes bigint not null default 0 check (used_bytes >= 0),
  reserved_bytes bigint not null default 0 check (reserved_bytes >= 0),
  enabled boolean not null default false
);
insert into public.bible_v8_media_quota(provider) values ('google_drive');
create table public.bible_v8_media_assets (
  id uuid primary key default gen_random_uuid(),
  congregation_id uuid not null references public.bible_congregations(id),
  owner_user_id uuid not null references auth.users(id),
  idempotency_key text not null check (idempotency_key ~ '^[A-Za-z0-9_-]{16,100}$'),
  checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
  name text not null check (char_length(name) between 1 and 160),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','application/pdf')),
  byte_size bigint not null check (byte_size between 1 and 5242880),
  state text not null default 'uploading' check (state in ('uploading','upload_failed','pending_review','changes_requested','rejected','published','removed')),
  revision integer not null default 1 check (revision > 0),
  provider_status text not null default 'uploading' check (provider_status in ('uploading','ready','reconciliation','deleted')),
  object_id text,
  lease_id uuid not null default gen_random_uuid(),
  rights_verified boolean not null default false,
  safety_verified boolean not null default false,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(congregation_id,owner_user_id,idempotency_key),
  unique(object_id)
);
create index bible_v8_media_queue_idx on public.bible_v8_media_assets(congregation_id,state,created_at desc,id);
create table public.bible_v8_media_audit (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.bible_v8_media_assets(id),
  congregation_id uuid not null references public.bible_congregations(id),
  actor_user_id uuid not null references auth.users(id),
  action text not null,
  from_state text,
  to_state text not null,
  reason text not null default '' check (char_length(reason) <= 2000),
  created_at timestamptz not null default now()
);
create index bible_v8_media_audit_asset_idx on public.bible_v8_media_audit(asset_id,created_at);
alter table public.bible_v8_media_quota enable row level security;
alter table public.bible_v8_media_assets enable row level security;
alter table public.bible_v8_media_audit enable row level security;
revoke all on public.bible_v8_media_quota, public.bible_v8_media_assets, public.bible_v8_media_audit from public, anon, authenticated;
grant select,insert,update on public.bible_v8_media_quota, public.bible_v8_media_assets to service_role;
revoke all on public.bible_v8_media_audit from service_role;
grant select,insert on public.bible_v8_media_audit to service_role;

-- Service-only invoker RPC: caller role still controls table access. Authenticated actors
-- are rechecked inside the transaction; HTTP authorization alone is insufficient.
create function public.bq_v8_media_command(p_action text,p_actor uuid,p_congregation uuid,p_payload jsonb default '{}')
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  a public.bible_v8_media_assets;
  q public.bible_v8_media_quota;
  member_role text;
  target_state text;
  prior_state text;
  note text := btrim(coalesce(p_payload->>'reason',''));
  n bigint;
  is_reviewer boolean;
begin
  select role into member_role from public.bible_congregation_members
    where congregation_id=p_congregation and user_id=p_actor and active for share;
  if member_role is null then raise exception 'MEDIA_SCOPE_DENIED'; end if;
  is_reviewer := member_role in ('leader','pastor','admin');
  if p_action='reserve' then
    -- One provider row locks ALL tenants' reservations in a consistent order.
    select * into q from public.bible_v8_media_quota where provider='google_drive' for update;
    select * into a from public.bible_v8_media_assets where congregation_id=p_congregation
      and owner_user_id=p_actor and idempotency_key=p_payload->>'idempotencyKey';
    if found then
      if a.checksum <> p_payload->>'checksum' or a.name <> p_payload->>'name'
        or a.mime_type <> p_payload->>'mimeType' or a.byte_size <> (p_payload->>'byteSize')::bigint then
        raise exception 'MEDIA_IDEMPOTENCY_CONFLICT';
      end if;
      return jsonb_build_object('asset',to_jsonb(a),'acquired',false);
    end if;
    n := (p_payload->>'byteSize')::bigint;
    if n is null or n < 1 or n > 5242880 then raise exception 'MEDIA_FILE_SIZE'; end if;
    if not q.enabled or q.capacity_bytes <= 0 then raise exception 'MEDIA_UPLOADS_DISABLED'; end if;
    if q.used_bytes::numeric+q.reserved_bytes+n > floor(q.capacity_bytes::numeric*0.9) then raise exception 'MEDIA_QUOTA_EXHAUSTED'; end if;
    insert into public.bible_v8_media_assets(congregation_id,owner_user_id,idempotency_key,checksum,name,mime_type,byte_size)
      values(p_congregation,p_actor,p_payload->>'idempotencyKey',p_payload->>'checksum',p_payload->>'name',p_payload->>'mimeType',n) returning * into a;
    update public.bible_v8_media_quota set reserved_bytes=reserved_bytes+n where provider='google_drive';
    insert into public.bible_v8_media_audit(asset_id,congregation_id,actor_user_id,action,to_state)
      values(a.id,p_congregation,p_actor,'reserve','uploading');
    return jsonb_build_object('asset',to_jsonb(a),'acquired',true,'leaseId',a.lease_id);
  end if;

  -- Finalization locks provider first, matching reserve lock order.
  if p_action in ('finalize','reconcile','provider_deleted') then
    select * into q from public.bible_v8_media_quota where provider='google_drive' for update;
  end if;
  select * into a from public.bible_v8_media_assets where id=(p_payload->>'assetId')::uuid and congregation_id=p_congregation for update;
  if not found then raise exception 'MEDIA_NOT_FOUND'; end if;
  prior_state := a.state;
  if p_action in ('finalize','fail') then
    if a.owner_user_id <> p_actor or a.lease_id is distinct from (p_payload->>'leaseId')::uuid then raise exception 'MEDIA_OWNER_REQUIRED'; end if;
    -- A timed-out finalize can already have committed. Never replace success with failure.
    if a.state <> 'uploading' then return to_jsonb(a); end if;
    if p_action='finalize' then
      if p_payload->'object'->>'provider' is distinct from 'google_drive'
        or (p_payload->'object'->>'byteSize')::bigint is distinct from a.byte_size
        or p_payload->'object'->>'mimeType' is distinct from a.mime_type
        or coalesce(p_payload->'object'->>'objectId','') !~ '^[A-Za-z0-9_-]{1,160}$' then raise exception 'MEDIA_PROVIDER_INTEGRITY'; end if;
      update public.bible_v8_media_assets set object_id=p_payload->'object'->>'objectId',state='pending_review',provider_status='ready',revision=revision+1,updated_at=now() where id=a.id returning * into a;
      update public.bible_v8_media_quota set reserved_bytes=reserved_bytes-a.byte_size,used_bytes=used_bytes+a.byte_size where provider='google_drive';
    else
      -- Keep quota reserved: an ambiguous transfer may have consumed provider capacity.
      update public.bible_v8_media_assets set object_id=p_payload->'object'->>'objectId',state='upload_failed',provider_status='reconciliation',failure_code=left(p_payload->>'code',80),revision=revision+1,updated_at=now() where id=a.id returning * into a;
    end if;
  elsif p_action='reconcile' then
    if not is_reviewer or a.state not in ('uploading','upload_failed') or a.updated_at > now()-interval '10 minutes' then raise exception 'MEDIA_RECONCILIATION_REQUIRED'; end if;
    if p_payload->'object'->>'provider' is distinct from 'google_drive'
      or (p_payload->'object'->>'byteSize')::bigint is distinct from a.byte_size
      or p_payload->'object'->>'mimeType' is distinct from a.mime_type
      or coalesce(p_payload->'object'->>'objectId','') !~ '^[A-Za-z0-9_-]{1,160}$' then raise exception 'MEDIA_PROVIDER_INTEGRITY'; end if;
    update public.bible_v8_media_assets set object_id=p_payload->'object'->>'objectId',state='pending_review',provider_status='ready',failure_code=null,revision=revision+1,updated_at=now() where id=a.id returning * into a;
    update public.bible_v8_media_quota set reserved_bytes=reserved_bytes-a.byte_size,used_bytes=used_bytes+a.byte_size where provider='google_drive';
  elsif p_action='provider_deleted' then
    if not is_reviewer or a.state<>'removed' or a.object_id is distinct from p_payload->>'objectId' then raise exception 'MEDIA_TRANSITION_DENIED'; end if;
    if a.provider_status='deleted' then return to_jsonb(a); end if;
    if a.provider_status<>'ready' then raise exception 'MEDIA_PROVIDER_NOT_READY'; end if;
    update public.bible_v8_media_assets set provider_status='deleted',revision=revision+1,updated_at=now() where id=a.id returning * into a;
    -- Drive trash may still consume storage. Keep bytes accounted until an operator
    -- reconciles confirmed provider usage after permanent purge; never infer freed capacity.
  elsif p_action='moderate' then
    if a.revision is distinct from (p_payload->>'expectedRevision')::integer then raise exception 'MEDIA_REVISION_CONFLICT'; end if;
    if char_length(note)>2000 then raise exception 'MEDIA_REASON_REQUIRED'; end if;
    case p_payload->>'action'
      when 'resubmit' then
        if a.owner_user_id<>p_actor or a.state not in ('changes_requested','rejected') or a.provider_status<>'ready' then raise exception 'MEDIA_TRANSITION_DENIED'; end if;
        target_state:='pending_review';
      when 'approve' then
        if not is_reviewer or a.state<>'pending_review' or a.provider_status<>'ready' or not a.rights_verified or not a.safety_verified then raise exception 'MEDIA_REVIEW_INCOMPLETE'; end if;
        target_state:='published';
      when 'reject' then target_state:='rejected';
      when 'request_changes' then target_state:='changes_requested';
      when 'remove' then target_state:='removed';
      else raise exception 'MEDIA_TRANSITION_DENIED';
    end case;
    if p_payload->>'action' in ('reject','request_changes','remove') then
      if not is_reviewer or note='' then raise exception 'MEDIA_REVIEWER_REQUIRED'; end if;
      if (target_state='removed' and a.state<>'published') or (target_state<>'removed' and a.state<>'pending_review') then raise exception 'MEDIA_TRANSITION_DENIED'; end if;
    end if;
    update public.bible_v8_media_assets set state=target_state,revision=revision+1,updated_at=now() where id=a.id returning * into a;
  elsif p_action='attest' then
    -- Human review attestation is separate from upload; it is NOT an automated scan claim.
    if not is_reviewer or a.owner_user_id=p_actor or a.state<>'pending_review' or note=''
      or char_length(note)>2000 or a.revision is distinct from (p_payload->>'expectedRevision')::integer then raise exception 'MEDIA_REVIEWER_REQUIRED'; end if;
    update public.bible_v8_media_assets set rights_verified=coalesce((p_payload->>'rightsVerified')::boolean,false),safety_verified=coalesce((p_payload->>'safetyVerified')::boolean,false),revision=revision+1,updated_at=now() where id=a.id returning * into a;
  else raise exception 'MEDIA_ACTION_INVALID';
  end if;
  insert into public.bible_v8_media_audit(asset_id,congregation_id,actor_user_id,action,from_state,to_state,reason)
    values(a.id,p_congregation,p_actor,case when p_action='moderate' then p_payload->>'action' else p_action end,prior_state,a.state,note);
  return to_jsonb(a);
end $$;
revoke all on function public.bq_v8_media_command(text,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.bq_v8_media_command(text,uuid,uuid,jsonb) to service_role;
commit;
