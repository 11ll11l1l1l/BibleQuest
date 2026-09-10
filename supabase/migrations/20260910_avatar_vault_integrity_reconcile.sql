-- #82 Avatar Vault corrective migration after v3.55 investigation.
--
-- Goals:
-- 1. converge fresh-install and live RLS on one membership-qualified self-profile policy;
-- 2. preserve every pre-existing avatar JSON field when a cosmetic-only client update occurs;
-- 3. project bible_avatar_cosmetics.selected_style into congregation-visible avatar state
--    inside the same database transaction as the cosmetic selection write.
--
-- This file is repository evidence only until production deployment is separately authorized.

alter table public.bible_congregation_members
  alter column avatar set default '{"face":"smile","outfit":"traveler","companion":"sheep","background":"olive"}'::jsonb;

drop policy if exists "members self avatar update" on public.bible_congregation_members;
drop policy if exists "members update own public profile" on public.bible_congregation_members;
create policy "members update own public profile"
on public.bible_congregation_members
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and private.is_bible_congregation_member(congregation_id)
)
with check (
  (select auth.uid()) = user_id
  and private.is_bible_congregation_member(congregation_id)
);

create or replace function private.bible_preserve_member_avatar_cosmetic()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- The v3.55 client sends {cosmetic: ...}. Preserve all unrelated avatar keys
  -- owned by the existing public-profile/avatar surfaces instead of replacing them.
  if jsonb_typeof(new.avatar) = 'object'
     and new.avatar ? 'cosmetic'
     and (new.avatar - 'cosmetic') = '{}'::jsonb then
    new.avatar := coalesce(old.avatar, '{}'::jsonb) || new.avatar;
  end if;
  return new;
end;
$$;

revoke all on function private.bible_preserve_member_avatar_cosmetic() from public, anon, authenticated;

drop trigger if exists bible_preserve_member_avatar_cosmetic on public.bible_congregation_members;
create trigger bible_preserve_member_avatar_cosmetic
before update of avatar on public.bible_congregation_members
for each row
execute function private.bible_preserve_member_avatar_cosmetic();

create or replace function private.bible_project_avatar_cosmetic()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- This UPDATE participates in the same transaction as the cosmetics upsert.
  -- If projection is not authorized or otherwise fails, the selection write fails too,
  -- preventing the private/public split state reproduced in the investigation.
  update public.bible_congregation_members
     set avatar = coalesce(avatar, '{}'::jsonb)
                  || jsonb_build_object('cosmetic', new.selected_style)
   where user_id = new.user_id
     and active = true;
  return new;
end;
$$;

revoke all on function private.bible_project_avatar_cosmetic() from public, anon, authenticated;

drop trigger if exists bible_avatar_cosmetic_projection on public.bible_avatar_cosmetics;
create trigger bible_avatar_cosmetic_projection
after insert or update on public.bible_avatar_cosmetics
for each row
execute function private.bible_project_avatar_cosmetic();
