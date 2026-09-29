create table if not exists public.bible_congregation_membership_audit (
  id bigint generated always as identity primary key,
  congregation_id uuid not null references public.bible_congregations(id) on delete cascade,
  actor_user_id uuid not null,
  target_user_id uuid not null,
  old_role text not null,
  new_role text not null,
  was_active boolean not null,
  is_active boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists bible_congregation_membership_audit_scope_idx
  on public.bible_congregation_membership_audit(congregation_id,created_at desc);

alter table public.bible_congregation_membership_audit enable row level security;
revoke all on table public.bible_congregation_membership_audit from public,anon,authenticated;
grant all on table public.bible_congregation_membership_audit to service_role;
revoke all on sequence public.bible_congregation_membership_audit_id_seq from public,anon,authenticated;
grant usage,select on sequence public.bible_congregation_membership_audit_id_seq to service_role;

create or replace function public.bible_manage_congregation_member_v6(
  p_congregation_id uuid,
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_role text,
  p_active boolean
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
declare
  v_owner_id uuid;
  v_actor_role text;
  v_platform_role text;
  v_old_role text;
  v_was_active boolean;
  v_admin_count integer;
begin
  if p_role is null or p_active is null or p_role not in ('member','facilitator','leader','pastor','admin') then
    raise exception using errcode='22023',message='Unsupported congregation role';
  end if;

  select c.owner_id into v_owner_id
  from public.bible_congregations c
  where c.id=p_congregation_id and c.active
  for update;
  if not found then raise exception using errcode='P0002',message='Congregation is unavailable'; end if;

  select m.role into v_actor_role
  from public.bible_congregation_members m
  where m.congregation_id=p_congregation_id and m.user_id=p_actor_user_id and m.active
  for update;
  select a.role into v_platform_role
  from public.bible_app_access a
  where a.user_id=p_actor_user_id and a.active;

  if v_actor_role is distinct from 'admin' and coalesce(v_platform_role,'') not in ('admin','owner') then
    raise exception using errcode='42501',message='Congregation admin permission required';
  end if;

  select m.role,m.active into v_old_role,v_was_active
  from public.bible_congregation_members m
  where m.congregation_id=p_congregation_id and m.user_id=p_target_user_id
  for update;
  if not found then raise exception using errcode='P0002',message='Congregation member was not found'; end if;

  if p_target_user_id=v_owner_id and (p_role<>'admin' or not p_active) then
    raise exception using errcode='42501',message='Transfer congregation ownership before changing its owner membership';
  end if;
  if (v_old_role='admin' or p_role='admin') and p_actor_user_id<>v_owner_id and v_platform_role is distinct from 'owner' then
    raise exception using errcode='42501',message='Only the congregation owner can change an admin membership';
  end if;

  if v_old_role='admin' and v_was_active and (p_role<>'admin' or not p_active) then
    select count(*) into v_admin_count
    from public.bible_congregation_members m
    where m.congregation_id=p_congregation_id and m.role='admin' and m.active;
    if v_admin_count<=1 then
      raise exception using errcode='23514',message='A congregation must retain at least one active admin';
    end if;
  end if;

  update public.bible_congregation_members
  set role=p_role,active=p_active
  where congregation_id=p_congregation_id and user_id=p_target_user_id;

  insert into public.bible_congregation_membership_audit(
    congregation_id,actor_user_id,target_user_id,old_role,new_role,was_active,is_active
  ) values (
    p_congregation_id,p_actor_user_id,p_target_user_id,v_old_role,p_role,v_was_active,p_active
  );

  return jsonb_build_object(
    'congregationId',p_congregation_id,
    'userId',p_target_user_id,
    'role',p_role,
    'active',p_active
  );
end;
$$;

comment on function public.bible_manage_congregation_member_v6(uuid,uuid,uuid,text,boolean) is
  'Transactional congregation member role/active management. Caller authentication and actor identity are validated by the server Edge Function; function is service-role only and rechecks tenant roles, ownership, and last-admin invariant under a congregation row lock.';

revoke all on function public.bible_manage_congregation_member_v6(uuid,uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.bible_manage_congregation_member_v6(uuid,uuid,uuid,text,boolean) to service_role;
