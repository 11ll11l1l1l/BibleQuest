begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_content_reports'::regclass),
  'content reports keep RLS enabled'
);
select ok(
  not has_table_privilege('anon','public.bible_content_reports','INSERT'),
  'anonymous callers cannot submit content reports'
);
select ok(
  has_table_privilege('authenticated','public.bible_content_reports','INSERT'),
  'authenticated submissions remain available behind RLS'
);


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

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select lives_ok(
  $$insert into public.bible_content_reports(
      congregation_id,reporter_id,content_key,content_type,content_text,reason
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      'question:GEN:v6-report-authority',
      'question','Fixture content requiring review','accuracy'
    )$$,
  'Member A may submit a new open report in congregation A'
);
select results_eq(
  $$select status,reviewed_by::text,reviewed_at::text
    from public.bible_content_reports
    where content_key='question:GEN:v6-report-authority'$$,
  $$values ('open'::text,null::text,null::text)$$,
  'new member reports retain unreviewed server-owned state'
);
select throws_ok(
  $$insert into public.bible_content_reports(
      congregation_id,reporter_id,content_key,content_type,content_text,reason,status
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      'question:GEN:v6-report-closed-spoof',
      'question','Spoofed closed report','accuracy','closed'
    )$$,
  '42501',null,
  'Member A cannot submit a report already marked closed'
);
select throws_ok(
  $$insert into public.bible_content_reports(
      congregation_id,reporter_id,content_key,content_type,content_text,reason,status,reviewed_by,reviewed_at
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      'question:GEN:v6-report-review-spoof',
      'question','Spoofed reviewed report','accuracy','reviewed',
      '11111111-1111-4111-8111-111111111111',now()
    )$$,
  '42501',null,
  'Member A cannot prefill reviewer identity or review time'
);
select throws_ok(
  $$insert into public.bible_content_reports(
      congregation_id,reporter_id,content_key,content_type,content_text,reason
    ) values (
      '20000000-0000-4000-8000-000000000002',
      '11111111-1111-4111-8111-111111111112',
      'question:GEN:v6-report-foreign',
      'question','Foreign congregation report','accuracy'
    )$$,
  '42501',null,
  'Member A cannot submit a report in congregation B'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111114';
select throws_ok(
  $$insert into public.bible_content_reports(
      congregation_id,reporter_id,content_key,content_type,content_text,reason
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111114',
      'question:GEN:v6-report-inactive',
      'question','Inactive membership report','accuracy'
    )$$,
  '42501',null,
  'inactive former Member A cannot submit a content report'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select lives_ok(
  $$update public.bible_content_reports
    set status='reviewed',
        reviewed_by='11111111-1111-4111-8111-111111111111',
        reviewed_at=now(),
        updated_at=now()
    where congregation_id='10000000-0000-4000-8000-000000000001'
      and content_key='question:GEN:v6-report-authority'$$,
  'Leader A may review a congregation A report'
);
select throws_ok(
  $$update public.bible_content_reports
    set content_text='Reviewer rewrite must fail'
    where congregation_id='10000000-0000-4000-8000-000000000001'
      and content_key='question:GEN:v6-report-authority'$$,
  'P0001','submitted content report fields are immutable',
  'review authority cannot rewrite submitted report content'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select results_eq(
  $$with changed as (
      update public.bible_content_reports
      set status='closed',reviewed_by='11111111-1111-4111-8111-111111111112',reviewed_at=now()
      where congregation_id='10000000-0000-4000-8000-000000000001'
        and content_key='question:GEN:v6-report-authority'
      returning 1
    ) select count(*)::bigint from changed$$,
  array[0::bigint],
  'ordinary Member A cannot change report review state after submission'
);


set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';
select results_eq(
  $$with changed as (
      update public.bible_content_reports
      set status='closed',
          reviewed_by='11111111-1111-4111-8111-111111111113',
          reviewed_at=now(),
          updated_at=now()
      where congregation_id='10000000-0000-4000-8000-000000000001'
        and content_key='question:GEN:v6-report-authority'
      returning reviewed_by::text
    ) select reviewed_by from changed$$,
  $$values ('11111111-1111-4111-8111-111111111113'::text)$$,
  'Pastor A may review a congregation A report'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222223';
select lives_ok(
  $$insert into public.bible_content_reports(
      congregation_id,reporter_id,content_key,content_type,content_text,reason
    ) values (
      '20000000-0000-4000-8000-000000000002',
      '22222222-2222-4222-8222-222222222223',
      'question:GEN:v6-tenant-admin-review-authority',
      'question','Congregation-only Admin B review fixture','accuracy'
    )$$,
  'congregation-only Admin B may submit a congregation B report'
);
select results_eq(
  $$with changed as (
      update public.bible_content_reports
      set status='reviewed',
          reviewed_by='22222222-2222-4222-8222-222222222223',
          reviewed_at=now(),
          updated_at=now()
      where congregation_id='20000000-0000-4000-8000-000000000002'
        and content_key='question:GEN:v6-tenant-admin-review-authority'
      returning reviewed_by::text
    ) select reviewed_by from changed$$,
  $$values ('22222222-2222-4222-8222-222222222223'::text)$$,
  'congregation-only Admin B may review a congregation B report'
);
select results_eq(
  $$with changed as (
      update public.bible_content_reports
      set status='reviewed',
          reviewed_by='22222222-2222-4222-8222-222222222223',
          reviewed_at=now(),
          updated_at=now()
      where congregation_id='10000000-0000-4000-8000-000000000001'
        and content_key='question:GEN:v6-report-authority'
      returning 1
    ) select count(*)::bigint from changed$$,
  array[0::bigint],
  'congregation-only Admin B cannot review a congregation A report'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222221';
select results_eq(
  $$with changed as (
      update public.bible_content_reports
      set status='reviewed',
          reviewed_by='22222222-2222-4222-8222-222222222221',
          reviewed_at=now(),
          updated_at=now()
      where congregation_id='10000000-0000-4000-8000-000000000001'
        and content_key='question:GEN:v6-report-authority'
      returning reviewed_by::text
    ) select reviewed_by from changed$$,
  $$values ('22222222-2222-4222-8222-222222222221'::text)$$,
  'platform Admin B retains explicit global content-review authority'
);

set local "request.jwt.claim.sub"='99999999-9999-4999-8999-999999999999';
select results_eq(
  $$with changed as (
      update public.bible_content_reports
      set status='closed',
          reviewed_by='99999999-9999-4999-8999-999999999999',
          reviewed_at=now(),
          updated_at=now()
      where congregation_id='10000000-0000-4000-8000-000000000001'
        and content_key='question:GEN:v6-report-authority'
      returning reviewed_by::text
    ) select reviewed_by from changed$$,
  $$values ('99999999-9999-4999-8999-999999999999'::text)$$,
  'platform Owner retains explicit global content-review authority'
);

reset role;
select * from finish();
rollback;
