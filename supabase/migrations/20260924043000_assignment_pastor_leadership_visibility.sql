-- BibleQuest V6: keep assignment visibility aligned with the congregation role model.
-- Pastors are congregation leaders for assignment oversight, matching the accepted
-- Member/Leader/Pastor/Admin role contract and the membership role constraint.

create or replace function private.bible_assignment_visible(
  target_congregation uuid,
  target_scope text,
  target_id uuid
) returns boolean
language plpgsql stable security definer set search_path=''
as $$
declare
  viewer uuid := (select auth.uid());
  viewer_role text;
begin
  if viewer is null then return false; end if;

  select m.role into viewer_role
  from public.bible_congregation_members m
  where m.congregation_id = target_congregation
    and m.user_id = viewer
    and m.active
  limit 1;

  if viewer_role is null then return false; end if;
  if viewer_role in ('facilitator', 'leader', 'pastor', 'admin') then return true; end if;
  if target_scope = 'all' then return true; end if;
  if target_scope = 'member' then return target_id = viewer; end if;
  if target_scope = 'team' then
    return exists(
      select 1
      from public.bible_team_members tm
      where tm.team_id = target_id
        and tm.user_id = viewer
    );
  end if;
  return false;
end;
$$;

revoke all on function private.bible_assignment_visible(uuid, text, uuid) from public;
grant execute on function private.bible_assignment_visible(uuid, text, uuid) to authenticated;

comment on function private.bible_assignment_visible(uuid, text, uuid) is
  'RLS visibility helper for assignments. Active facilitator/leader/pastor/admin members have congregation leadership visibility; ordinary members remain target-scoped.';
