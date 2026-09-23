-- Deterministic BibleQuest V6 local/CI fixtures.
-- Data only: schema ownership stays in schema.sql + migrations.
-- These identities are synthetic and must never be used outside disposable local CI.

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'leader-a@bq-v6.invalid', '{}'::jsonb, '{}'::jsonb),
  ('11111111-1111-4111-8111-111111111112', 'member-a@bq-v6.invalid', '{}'::jsonb, '{}'::jsonb),
  ('11111111-1111-4111-8111-111111111113', 'pastor-a@bq-v6.invalid', '{}'::jsonb, '{}'::jsonb),
  ('22222222-2222-4222-8222-222222222221', 'admin-b@bq-v6.invalid', '{}'::jsonb, '{}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', 'member-b@bq-v6.invalid', '{}'::jsonb, '{}'::jsonb),
  ('99999999-9999-4999-8999-999999999999', 'platform-owner@bq-v6.invalid', '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

insert into public.bible_congregations (id, owner_id, name, slug, timezone, active)
values
  ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'V6 Congregation A', 'v6-ci-a', 'Asia/Tokyo', true),
  ('20000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222221', 'V6 Congregation B', 'v6-ci-b', 'Asia/Tokyo', true)
on conflict (id) do nothing;

insert into public.bible_congregation_members (congregation_id, user_id, role, display_name, active)
values
  ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'leader', 'Leader A', true),
  ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111112', 'member', 'Member A', true),
  ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111113', 'pastor', 'Pastor A', true),
  ('20000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222221', 'admin', 'Admin B', true),
  ('20000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'member', 'Member B', true)
on conflict (congregation_id, user_id) do nothing;

insert into public.bible_app_access (user_id, role, active)
values
  ('11111111-1111-4111-8111-111111111111', 'leader', true),
  ('11111111-1111-4111-8111-111111111112', 'member', true),
  ('11111111-1111-4111-8111-111111111113', 'pastor', true),
  ('22222222-2222-4222-8222-222222222221', 'admin', true),
  ('22222222-2222-4222-8222-222222222222', 'member', true),
  ('99999999-9999-4999-8999-999999999999', 'owner', true)
on conflict (user_id) do update set role=excluded.role, active=excluded.active;

insert into public.bible_assignments (
  id, congregation_id, created_by, title, instructions, assignment_type,
  target_scope, target_id, points, active
)
values
  ('a1000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'V6 Assignment A', 'Fixture A', 'reading', 'all', null, 5, true),
  ('a2000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222221', 'V6 Assignment B', 'Fixture B', 'reading', 'all', null, 5, true)
on conflict (id) do nothing;

insert into public.bible_calendar_events (
  id, user_id, title, notes, event_date, all_day, congregation_id, recurrence_weeks
)
values
  ('ca100000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'V6 Calendar A', 'Fixture A', date '2026-09-20', true, '10000000-0000-4000-8000-000000000001', 0),
  ('ca200000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222221', 'V6 Calendar B', 'Fixture B', date '2026-09-21', true, '20000000-0000-4000-8000-000000000002', 0)
on conflict (id) do nothing;
