begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

insert into public.bible_badge_catalog (
  id,icon,name,category,description,threshold,active
) values (
  'v6-tenant-badge',
  'shield',
  'V6 Tenant Badge',
  'consistency',
  'Disposable tenant-isolation fixture',
  '{}'::jsonb,
  true
)
on conflict (id) do update set active=true;

insert into public.bible_score_events (
  congregation_id,user_id,category,points,source,source_event_id,metadata
) values
  (
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    'knowledge',7,'v6-tenant-fixture','v6-score-a',
    '{"fixture":"A"}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'knowledge',9,'v6-tenant-fixture','v6-score-b',
    '{"fixture":"B"}'::jsonb
  )
on conflict (congregation_id,user_id,source_event_id) do nothing;

insert into public.bible_user_badges (
  congregation_id,user_id,badge_id,metadata
) values
  (
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    'v6-tenant-badge',
    '{"fixture":"A"}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'v6-tenant-badge',
    '{"fixture":"B"}'::jsonb
  )
on conflict (congregation_id,user_id,badge_id) do nothing;

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_score_events'::regclass),
  'score events keep RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_user_badges'::regclass),
  'earned badges keep RLS enabled'
);

select ok(
  not has_table_privilege('anon','public.bible_score_events','SELECT')
  and not has_table_privilege('anon','public.bible_user_badges','SELECT'),
  'anonymous callers cannot read score or earned-badge tenant state'
);

select ok(
  not has_table_privilege('authenticated','public.bible_score_events','INSERT')
  and not has_table_privilege('authenticated','public.bible_score_events','UPDATE')
  and not has_table_privilege('authenticated','public.bible_score_events','DELETE'),
  'browser-authenticated callers cannot forge immutable score events'
);

select ok(
  not has_table_privilege('authenticated','public.bible_user_badges','INSERT')
  and not has_table_privilege('authenticated','public.bible_user_badges','UPDATE')
  and not has_table_privilege('authenticated','public.bible_user_badges','DELETE'),
  'browser-authenticated callers cannot forge earned badges'
);

select ok(
  coalesce(
    (
      select not p.prosecdef
        and has_function_privilege(
          'authenticated',
          'public.bible_leaderboard(uuid,timestamp with time zone)',
          'EXECUTE'
        )
        and not has_function_privilege(
          'anon',
          'public.bible_leaderboard(uuid,timestamp with time zone)',
          'EXECUTE'
        )
      from pg_proc p
      where p.oid=to_regprocedure('public.bible_leaderboard(uuid,timestamp with time zone)')
    ),
    false
  ),
  'leaderboard RPC remains authenticated-only and SECURITY INVOKER'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select source_event_id
    from public.bible_score_events
    where source_event_id like 'v6-score-%'
    order by source_event_id$$,
  $$values ('v6-score-a'::text)$$,
  'Member A reads score events only from congregation A'
);

select results_eq(
  $$select badge_id
    from public.bible_user_badges
    where badge_id='v6-tenant-badge'$$,
  $$values ('v6-tenant-badge'::text)$$,
  'Member A reads earned badges only from congregation A'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_score_events
    where congregation_id='20000000-0000-4000-8000-000000000002'::uuid
      and source_event_id='v6-score-b'$$,
  array[0::bigint],
  'Member A cannot force-read congregation B score events'
);

select results_eq(
  $select count(*)::bigint
    from public.bible_user_badges
    where congregation_id='20000000-0000-4000-8000-000000000002'::uuid
      and badge_id='v6-tenant-badge'$,
  array[0::bigint],
  'Member A cannot force-read congregation B earned badges'
);

select ok(
  exists(
    select 1
    from public.bible_leaderboard(
      '10000000-0000-4000-8000-000000000001'::uuid,
      null::timestamptz
    )
    where user_id='11111111-1111-4111-8111-111111111112'::uuid
      and category='knowledge'
      and points >= 7
  ),
  'Member A can read its congregation A leaderboard aggregate'
);

select is(
  (
    select count(*)::bigint
    from public.bible_leaderboard(
      '20000000-0000-4000-8000-000000000002'::uuid,
      null::timestamptz
    )
  ),
  0::bigint,
  'Member A cannot force-read congregation B leaderboard RPC'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select results_eq(
  $$select source_event_id
    from public.bible_score_events
    where source_event_id='v6-score-a'$$,
  $$values ('v6-score-a'::text)$$,
  'Leader A reads congregation A score state'
);

select results_eq(
  $$select badge_id
    from public.bible_user_badges
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid
      and badge_id='v6-tenant-badge'$$,
  $$values ('v6-tenant-badge'::text)$$,
  'Leader A reads congregation A earned-badge state'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111114';

select results_eq(
  $$select count(*)::bigint
    from public.bible_score_events
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid
      and source_event_id='v6-score-a'$$,
  array[0::bigint],
  'inactive former Member A cannot retain score visibility'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_user_badges
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid
      and badge_id='v6-tenant-badge'$$,
  array[0::bigint],
  'inactive former Member A cannot retain earned-badge visibility'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';

select results_eq(
  $$select source_event_id
    from public.bible_score_events
    where source_event_id='v6-score-b'$$,
  $$values ('v6-score-b'::text)$$,
  'Member B reads congregation B score state'
);

select results_eq(
  $select badge_id
    from public.bible_user_badges
    where congregation_id='20000000-0000-4000-8000-000000000002'::uuid
      and badge_id='v6-tenant-badge'$,
  $values ('v6-tenant-badge'::text)$,
  'Member B reads congregation B earned-badge state'
);

select is(
  (
    select count(*)::bigint
    from public.bible_leaderboard(
      '10000000-0000-4000-8000-000000000001'::uuid,
      null::timestamptz
    )
  ),
  0::bigint,
  'Member B cannot force-read congregation A leaderboard RPC'
);

set local "request.jwt.claim.sub"='99999999-9999-4999-8999-999999999999';

select results_eq(
  $select
      (select count(*)::bigint from public.bible_score_events where source_event_id in ('v6-score-a','v6-score-b')),
      (select count(*)::bigint from public.bible_user_badges where badge_id='v6-tenant-badge')$,
  $values (0::bigint,0::bigint)$,
  'platform Owner gets no implicit tenant bypass for score or badge state'
);

select is(
  (
    select count(*)::bigint
    from public.bible_leaderboard(
      '10000000-0000-4000-8000-000000000001'::uuid,
      null::timestamptz
    )
  ) + (
    select count(*)::bigint
    from public.bible_leaderboard(
      '20000000-0000-4000-8000-000000000002'::uuid,
      null::timestamptz
    )
  ),
  0::bigint,
  'platform Owner gets no implicit tenant bypass through the leaderboard RPC'
);

reset role;
select * from finish();
rollback;
