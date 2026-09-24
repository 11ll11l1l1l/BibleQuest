begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

insert into public.bible_shared_sessions (
  id, congregation_id, created_by, session_type, title, room_code, status
)
values
  (
    '81000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'live-room',
    'V6 Live Room A',
    'V6A001',
    'active'
  ),
  (
    '82000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222221',
    'live-room',
    'V6 Live Room B',
    'V6B002',
    'active'
  )
on conflict (id) do nothing;

insert into public.bible_session_participants (session_id, user_id)
values
  ('81000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111'),
  ('81000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111114'),
  ('82000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222221')
on conflict (session_id, user_id) do nothing;

insert into public.bible_room_responses (
  id, session_id, user_id, round_no, response
)
values
  (
    '91000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    1,
    '{"choice":"leader-a"}'::jsonb
  ),
  (
    '91000000-0000-4000-8000-000000000004',
    '81000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111114',
    1,
    '{"choice":"stale"}'::jsonb
  ),
  (
    '92000000-0000-4000-8000-000000000002',
    '82000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222221',
    1,
    '{"choice":"admin-b"}'::jsonb
  )
on conflict (id) do nothing;

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_shared_sessions'::regclass)
  and (select relrowsecurity from pg_class where oid='public.bible_session_participants'::regclass)
  and (select relrowsecurity from pg_class where oid='public.bible_room_responses'::regclass),
  'Live Room sessions, participants and responses keep RLS enabled'
);

select ok(
  not has_table_privilege('anon','public.bible_shared_sessions','SELECT')
  and not has_table_privilege('anon','public.bible_session_participants','SELECT')
  and not has_table_privilege('anon','public.bible_room_responses','SELECT')
  and not has_table_privilege('anon','public.bible_room_responses','UPDATE'),
  'anonymous role cannot read Live Room state or update responses'
);

select ok(
  not has_table_privilege('authenticated','public.bible_room_responses','UPDATE')
  and has_column_privilege('authenticated','public.bible_room_responses','response','UPDATE')
  and has_column_privilege('authenticated','public.bible_room_responses','updated_at','UPDATE')
  and has_column_privilege('authenticated','public.bible_room_responses','session_id','INSERT')
  and has_column_privilege('authenticated','public.bible_room_responses','user_id','INSERT')
  and has_column_privilege('authenticated','public.bible_room_responses','round_no','INSERT')
  and has_column_privilege('authenticated','public.bible_room_responses','response','INSERT')
  and not has_column_privilege('authenticated','public.bible_room_responses','points','UPDATE'),
  'authenticated response owners have bounded column-level mutation privileges'
);

select ok(
  coalesce(
    (
      select qual like '%is_bible_congregation_member%'
      from pg_policies
      where schemaname='public'
        and tablename='bible_room_responses'
        and policyname='room responses self update'
    ),
    false
  ),
  'Live Room response UPDATE visibility re-proves active congregation membership'
);

select ok(
  coalesce(
    (
      select with_check like '%is_bible_congregation_member%'
      from pg_policies
      where schemaname='public'
        and tablename='bible_room_responses'
        and policyname='room responses self update'
    ),
    false
  ),
  'Live Room response UPDATE post-state re-proves active congregation membership'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select results_eq(
  $$select id from public.bible_shared_sessions order by id$$,
  array['81000000-0000-4000-8000-000000000001'::uuid],
  'Leader A reads only congregation A Live Room sessions'
);

select results_eq(
  $$select count(*)::bigint from public.bible_session_participants$$,
  array[2::bigint],
  'Leader A reads only congregation A Live Room participants'
);

select results_eq(
  $$select id from public.bible_room_responses order by id$$,
  array[
    '91000000-0000-4000-8000-000000000001'::uuid,
    '91000000-0000-4000-8000-000000000004'::uuid
  ],
  'Leader A reads response rows only from congregation A'
);

select lives_ok(
  $$update public.bible_room_responses
    set response='{"choice":"leader-a-updated"}'::jsonb, updated_at=now()
    where id='91000000-0000-4000-8000-000000000001'::uuid$$,
  'Leader A can update its own response while membership is active'
);

select throws_ok(
  $$insert into public.bible_room_responses(session_id,user_id,round_no,response)
    values(
      '82000000-0000-4000-8000-000000000002',
      '11111111-1111-4111-8111-111111111111',
      2,
      '{"choice":"foreign"}'::jsonb
    )$$,
  '42501',
  null,
  'Leader A cannot insert a response into congregation B'
);

select throws_ok(
  $$insert into public.bible_session_participants(session_id,user_id)
    values(
      '82000000-0000-4000-8000-000000000002',
      '11111111-1111-4111-8111-111111111111'
    )$$,
  '42501',
  null,
  'Leader A cannot join a congregation B Live Room'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select id from public.bible_shared_sessions order by id$$,
  array['81000000-0000-4000-8000-000000000001'::uuid],
  'Member A reads only congregation A Live Room sessions'
);

select results_eq(
  $$select count(*)::bigint from public.bible_session_participants$$,
  array[2::bigint],
  'Member A reads only congregation A Live Room participants'
);

select lives_ok(
  $$insert into public.bible_session_participants(session_id,user_id)
    values(
      '81000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112'
    )$$,
  'Member A can join a Live Room in its own congregation'
);

select lives_ok(
  $$insert into public.bible_room_responses(session_id,user_id,round_no,response)
    values(
      '81000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      1,
      '{"choice":"member-a"}'::jsonb
    )$$,
  'Member A can submit its own response in congregation A'
);

select throws_ok(
  $$insert into public.bible_room_responses(session_id,user_id,round_no,response)
    values(
      '82000000-0000-4000-8000-000000000002',
      '11111111-1111-4111-8111-111111111112',
      1,
      '{"choice":"foreign"}'::jsonb
    )$$,
  '42501',
  null,
  'Member A cannot submit a response in congregation B'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111114';

select results_eq(
  $$select count(*)::bigint from public.bible_shared_sessions$$,
  array[0::bigint],
  'former congregation member cannot retain Live Room visibility'
);

select results_eq(
  $$select count(*)::bigint from public.bible_session_participants$$,
  array[0::bigint],
  'former congregation member cannot retain participant-roster visibility'
);

select results_eq(
  $$with changed as (
      update public.bible_room_responses
      set response='{"choice":"stale-write"}'::jsonb, updated_at=now()
      where id='91000000-0000-4000-8000-000000000004'::uuid
      returning id
    )
    select id from changed$$,
  array[]::uuid[],
  'former congregation member cannot update a stale Live Room response'
);

select throws_ok(
  $$insert into public.bible_room_responses(session_id,user_id,round_no,response)
    values(
      '81000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111114',
      2,
      '{"choice":"stale-insert"}'::jsonb
    )$$,
  '42501',
  null,
  'former congregation member cannot submit a new response into the old congregation'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select is(
  (
    select response->>'choice'
    from public.bible_room_responses
    where id='91000000-0000-4000-8000-000000000004'::uuid
  ),
  'stale',
  'Leader A verifies the former-member response remained unchanged'
);

select is(
  (
    select response->>'choice'
    from public.bible_room_responses
    where session_id='81000000-0000-4000-8000-000000000001'::uuid
      and user_id='11111111-1111-4111-8111-111111111112'::uuid
      and round_no=1
  ),
  'member-a',
  'Leader A can verify the active Member A response'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';

select results_eq(
  $$select count(*)::bigint from public.bible_room_responses$$,
  array[3::bigint],
  'Pastor A has leadership response visibility only inside congregation A'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222221';

select results_eq(
  $$select id from public.bible_room_responses order by id$$,
  array['92000000-0000-4000-8000-000000000002'::uuid],
  'Admin B has leadership response visibility only inside congregation B'
);

reset role;
select * from finish();
rollback;
