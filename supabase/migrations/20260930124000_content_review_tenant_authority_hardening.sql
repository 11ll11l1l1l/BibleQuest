create or replace function private.bible_can_review_content(target_congregation uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.bible_app_access a
      where a.user_id = (select auth.uid())
        and a.active
        and a.role = 'owner'
    )
    or exists (
      select 1
      from public.bible_congregation_members m
      where m.congregation_id = target_congregation
        and m.user_id = (select auth.uid())
        and m.active
        and m.role in ('leader','pastor','admin')
    );
$$;

revoke all on function private.bible_can_review_content(uuid) from public;
grant execute on function private.bible_can_review_content(uuid) to authenticated;

comment on function private.bible_can_review_content(uuid) is
  'Content review is congregation-scoped for Leader/Pastor/Admin memberships. Only the explicit platform Owner role has global review authority; platform Admin does not bypass congregation tenancy.';
