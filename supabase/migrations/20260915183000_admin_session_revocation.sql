-- BibleQuest V5 Admin security hardening.
--
-- Supabase Auth's own global logout implementation deletes auth.sessions rows
-- for the target user. GoTrue does not expose an admin logout-by-user-id HTTP
-- route, so privileged BibleQuest Admin operations use the same database
-- session-deletion primitive through a service-role-only RPC.
--
-- Keep the SECURITY DEFINER implementation out of the exposed public schema.
-- The public wrapper is SECURITY INVOKER and executable only by service_role.

create schema if not exists private;

create or replace function private.bible_revoke_auth_sessions_impl(
  target_user_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count bigint;
begin
  delete from auth.sessions
  where user_id = target_user_id;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.bible_revoke_auth_sessions_impl(uuid)
  from public, anon, authenticated;
grant execute on function private.bible_revoke_auth_sessions_impl(uuid)
  to service_role;

comment on function private.bible_revoke_auth_sessions_impl(uuid) is
  'Privileged BibleQuest Admin helper mirroring Supabase Auth global logout by deleting auth.sessions rows for one user. Not exposed directly to browser roles.';

create or replace function public.bible_revoke_auth_sessions(
  target_user_id uuid
)
returns bigint
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.bible_revoke_auth_sessions_impl(target_user_id)
$$;

revoke all on function public.bible_revoke_auth_sessions(uuid)
  from public, anon, authenticated;
grant execute on function public.bible_revoke_auth_sessions(uuid)
  to service_role;

comment on function public.bible_revoke_auth_sessions(uuid) is
  'Service-role-only wrapper used by the BibleQuest Admin Edge Function to revoke all Auth sessions for a controlled target user.';
