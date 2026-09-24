-- Align congregation membership storage with the released ministry role model.
-- Existing RLS/helpers already recognize pastor as a congregation leadership role,
-- but the base table CHECK constraint omitted it, making valid pastor membership
-- impossible and breaking V6 tenant-isolation certification.

alter table public.bible_congregation_members
  drop constraint if exists bible_congregation_members_role_check;

alter table public.bible_congregation_members
  add constraint bible_congregation_members_role_check
  check (role in ('member', 'facilitator', 'leader', 'pastor', 'admin'));
