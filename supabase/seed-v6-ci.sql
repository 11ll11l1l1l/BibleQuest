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

insert into public.bible_teams (
  id, congregation_id, created_by, team_type, name, active
)
values
  ('71000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'game_team', 'V6 Team A', true),
  ('72000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222221', 'game_team', 'V6 Team B', true)
on conflict (id) do nothing;

insert into public.bible_team_members (team_id, user_id)
values
  ('71000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111'),
  ('71000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111112'),
  ('72000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222221'),
  ('72000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222')
on conflict (team_id, user_id) do nothing;

insert into public.bible_groups (
  id, owner_id, name, congregation_id, kind, description, schedule_text, max_members, active
)
values
  ('61000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'V6 Group A', '10000000-0000-4000-8000-000000000001', 'small_group', 'Fixture A', 'Weekly', 6, true),
  ('62000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222221', 'V6 Group B', '20000000-0000-4000-8000-000000000002', 'small_group', 'Fixture B', 'Weekly', 6, true)
on conflict (id) do nothing;

insert into public.bible_group_members (group_id, user_id, role, active)
values
  ('61000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'leader', true),
  ('61000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111112', 'member', true),
  ('62000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222221', 'leader', true),
  ('62000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'member', true)
on conflict (group_id, user_id) do nothing;

insert into public.bible_presence (congregation_id, user_id, last_seen_at, surface)
values
  ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111112', now(), 'V6 fixture A'),
  ('20000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', now(), 'V6 fixture B')
on conflict (congregation_id, user_id) do update
set last_seen_at=excluded.last_seen_at, surface=excluded.surface;

-- Stale-membership regression fixture: authenticated account remains in an
-- active Journey Group row after congregation membership has been deactivated.
-- Server/RLS authorization must still fail closed for congregation-scoped data.
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values ('11111111-1111-4111-8111-111111111114', 'former-member-a@bq-v6.invalid', '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

insert into public.bible_app_access (user_id, role, active)
values ('11111111-1111-4111-8111-111111111114', 'member', true)
on conflict (user_id) do update set role=excluded.role, active=excluded.active;

insert into public.bible_congregation_members (congregation_id, user_id, role, display_name, active)
values ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111114', 'member', 'Former Member A', false)
on conflict (congregation_id, user_id) do update
set role=excluded.role, display_name=excluded.display_name, active=false;

insert into public.bible_group_members (group_id, user_id, role, active)
values ('61000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111114', 'leader', true)
on conflict (group_id, user_id) do update set role=excluded.role, active=true;
