begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

-- Keep congregation-only Admin distinct from the seeded platform Admin fixture.
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values (
  '22222222-2222-4222-8222-222222222223',
  'tenant-admin-b@bq-v6.invalid',
  '{}'::jsonb,
  '{}'::jsonb
)
on conflict (id) do nothing;

insert into public.bible_app_access (user_id, role, active)
values ('22222222-2222-4222-8222-222222222223','member',true)
on conflict (user_id) do update set role=excluded.role, active=excluded.active;

insert into public.bible_congregation_members (
  congregation_id,user_id,role,display_name,active
) values (
  '20000000-0000-4000-8000-000000000002',
  '22222222-2222-4222-8222-222222222223',
  'admin',
  'Tenant Admin B',
  true
)
on conflict (congregation_id,user_id) do update
set role=excluded.role, display_name=excluded.display_name, active=true;

insert into public.bible_content_decisions (
  congregation_id,content_key,content_type,origin,decision,reviewed_by,rationale
) values
  (
    '10000000-0000-4000-8000-000000000001',
    'question:GEN:v6-decision-fixture-a',
    'question','review','include',
    '11111111-1111-4111-8111-111111111111',
    'Congregation A fixture'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'question:GEN:v6-decision-fixture-b',
    'question','review','include',
    '22222222-2222-4222-8222-222222222221',
    'Congregation B fixture'
  )
on conflict (congregation_id,content_key) do nothing;

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_content_decisions'::regclass),
  'content decisions keep RLS enabled'
);

select ok(
  not has_table_privilege('anon','public.bible_content_decisions','SELECT')
  and not has_table_privilege('anon','public.bible_content_decisions','INSERT')
  and not has_table_privilege('anon','public.bible_content_decisions','UPDATE'),
  'anonymous callers have no content-decision table privileges'
);

select ok(
  has_table_privilege('authenticated','public.bible_content_decisions','SELECT')
  and has_table_privilege('authenticated','public.bible_content_decisions','INSERT')
  and has_table_privilege('authenticated','public.bible_content_decisions','UPDATE'),
  'authenticated content-decision grants remain bounded by RLS'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select content_key
    from public.bible_content_decisions
    where content_key like 'question:GEN:v6-decision-fixture-%'
    order by content_key$$,
  $$values ('question:GEN:v6-decision-fixture-a'::text)$$,
  'Member A reads decision state only from congregation A'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_content_decisions
    where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot force-read congregation B decisions'
);

select throws_ok(
  $$insert into public.bible_content_decisions(
      congregation_id,content_key,content_type,origin,decision,reviewed_by
    ) values (
      '10000000-0000-4000-8000-000000000001',
      'question:GEN:v6-decision-member-a',
      'question','review','remove',
      '11111111-1111-4111-8111-111111111112'
    )$$,
  '42501',
  null,
  'ordinary Member A cannot create content decisions'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select lives_ok(
  $$insert into public.bible_content_decisions(
      congregation_id,content_key,content_type,origin,decision,reviewed_by
    ) values (
      '10000000-0000-4000-8000-000000000001',
      'question:GEN:v6-decision-leader-a',
      'question','review','remove',
      '11111111-1111-4111-8111-111111111111'
    )$$,
  'Leader A can create a congregation A content decision'
);

select throws_ok(
  $$insert into public.bible_content_decisions(
      congregation_id,content_key,content_type,origin,decision,reviewed_by
    ) values (
      '20000000-0000-4000-8000-000000000002',
      'question:GEN:v6-decision-leader-a-foreign',
      'question','review','remove',
      '11111111-1111-4111-8111-111111111111'
    )$$,
  '42501',
  null,
  'Leader A cannot create a congregation B content decision'
);

select results_eq(
  $$with changed as (
      update public.bible_content_decisions
      set decision='exempt',
          reviewed_by='11111111-1111-4111-8111-111111111111',
          reviewed_at=now(),
          updated_at=now()
      where congregation_id='10000000-0000-4000-8000-000000000001'
        and content_key='question:GEN:v6-decision-fixture-a'
      returning decision
    ) select decision from changed$$,
  $$values ('exempt'::text)$$,
  'Leader A can update congregation A decision state'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';

select results_eq(
  $$with changed as (
      update public.bible_content_decisions
      set decision='include',
          reviewed_by='11111111-1111-4111-8111-111111111113',
          reviewed_at=now(),
          updated_at=now()
      where congregation_id='10000000-0000-4000-8000-000000000001'
        and content_key='question:GEN:v6-decision-fixture-a'
      returning reviewed_by::text
    ) select reviewed_by from changed$$,
  $$values ('11111111-1111-4111-8111-111111111113'::text)$$,
  'Pastor A can update congregation A decision state'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111114';

select results_eq(
  $$select count(*)::bigint
    from public.bible_content_decisions
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'inactive former Member A cannot read congregation A decisions'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222223';

select lives_ok(
  $$insert into public.bible_content_decisions(
      congregation_id,content_key,content_type,origin,decision,reviewed_by
    ) values (
      '20000000-0000-4000-8000-000000000002',
      'question:GEN:v6-decision-tenant-admin-b',
      'question','review','remove',
      '22222222-2222-4222-8222-222222222223'
    )$$,
  'congregation-only Admin B can create a congregation B content decision'
);

select throws_ok(
  $$insert into public.bible_content_decisions(
      congregation_id,content_key,content_type,origin,decision,reviewed_by
    ) values (
      '10000000-0000-4000-8000-000000000001',
      'question:GEN:v6-decision-tenant-admin-b-foreign',
      'question','review','remove',
      '22222222-2222-4222-8222-222222222223'
    )$$,
  '42501',
  null,
  'congregation-only Admin B cannot create a congregation A content decision'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_content_decisions
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'congregation-only Admin B cannot read congregation A decision state'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';

select results_eq(
  $$select content_key
    from public.bible_content_decisions
    where content_key='question:GEN:v6-decision-fixture-b'$$,
  $$values ('question:GEN:v6-decision-fixture-b'::text)$$,
  'Member B reads its congregation B decision state'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_content_decisions
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Member B cannot force-read congregation A decisions'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222221';

select results_eq(
  $$select count(*)::bigint
    from public.bible_content_decisions
    where content_key in (
      'question:GEN:v6-decision-fixture-a',
      'question:GEN:v6-decision-fixture-b'
    )$$,
  array[2::bigint],
  'platform Admin B has intentional cross-congregation content-review visibility'
);

select lives_ok(
  $$insert into public.bible_content_decisions(
      congregation_id,content_key,content_type,origin,decision,reviewed_by
    ) values (
      '10000000-0000-4000-8000-000000000001',
      'question:GEN:v6-decision-platform-admin-b',
      'question','review','exempt',
      '22222222-2222-4222-8222-222222222221'
    )$$,
  'platform Admin B can exercise explicit global review authority in congregation A'
);

set local "request.jwt.claim.sub"='99999999-9999-4999-8999-999999999999';

select results_eq(
  $$with changed as (
      update public.bible_content_decisions
      set decision='remove',
          reviewed_by='99999999-9999-4999-8999-999999999999',
          reviewed_at=now(),
          updated_at=now()
      where congregation_id='20000000-0000-4000-8000-000000000002'
        and content_key='question:GEN:v6-decision-fixture-b'
      returning reviewed_by::text
    ) select reviewed_by from changed$$,
  $$values ('99999999-9999-4999-8999-999999999999'::text)$$,
  'platform Owner retains explicit global content-review authority'
);

reset role;
select * from finish();
rollback;
