-- V5 Lab A2 deterministic local/CI-only fixture topology.
-- Never load this file into a hosted or production Supabase project.
-- It is executed only after a clean disposable migration replay.

-- Stable synthetic auth identities. Password authentication is intentionally
-- irrelevant: RLS tests inject local Postgres JWT claim context directly.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@biblequest.test', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member-a@biblequest.test', '', now(), now(), now()),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@biblequest.test', '', now(), now(), now()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member-b@biblequest.test', '', now(), now(), now()),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider@biblequest.test', '', now(), now(), now());

insert into public.bible_congregations (id, owner_id, name, slug, timezone)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lab Congregation A', 'lab-congregation-a', 'Asia/Tokyo'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Lab Congregation B', 'lab-congregation-b', 'Asia/Tokyo');

insert into public.bible_congregation_members (
  congregation_id, user_id, role, display_name, active
) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'admin', 'Owner A', true),
  ('aaaaaaaa-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'member', 'Member A', true),
  ('bbbbbbbb-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'admin', 'Owner B', true),
  ('bbbbbbbb-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'member', 'Member B', true);
