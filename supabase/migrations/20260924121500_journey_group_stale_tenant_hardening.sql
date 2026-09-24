-- V6 S2 Journey Group stale-tenant hardening.
--
-- A user can remain in bible_group_members after congregation membership is
-- deactivated. Group authorization must therefore prove both active group
-- membership and active congregation membership before exposing tenant data.

create or replace function private.is_bible_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bible_group_members gm
    join public.bible_groups g on g.id = gm.group_id
    join public.bible_congregation_members cm
      on cm.congregation_id = g.congregation_id
     and cm.user_id = (select auth.uid())
     and cm.active
    where gm.group_id = p_group_id
      and gm.user_id = (select auth.uid())
      and gm.active
      and g.active
  )
$$;

revoke all on function private.is_bible_group_member(uuid) from public, anon;
grant execute on function private.is_bible_group_member(uuid) to authenticated;

create or replace function private.shares_bible_group(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_user_id = (select auth.uid())
    or exists (
      select 1
      from public.bible_group_members mine
      join public.bible_groups g
        on g.id = mine.group_id
       and g.active
      join public.bible_group_members theirs
        on theirs.group_id = mine.group_id
       and theirs.user_id = p_user_id
       and theirs.active
      join public.bible_congregation_members me
        on me.congregation_id = g.congregation_id
       and me.user_id = (select auth.uid())
       and me.active
      join public.bible_congregation_members them
        on them.congregation_id = g.congregation_id
       and them.user_id = p_user_id
       and them.active
      where mine.user_id = (select auth.uid())
        and mine.active
    )
$$;

revoke all on function private.shares_bible_group(uuid) from public, anon;
grant execute on function private.shares_bible_group(uuid) to authenticated;
