begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_calendar_events'::regclass),
  'calendar events keep RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid='public.bible_ministry_messages'::regclass),
  'ministry messages keep RLS enabled'
);
select ok(
  not has_table_privilege('anon','public.bible_calendar_events','SELECT')
  and not has_table_privilege('anon','public.bible_ministry_messages','SELECT'),
  'anonymous role cannot read calendar or ministry data'
);
select ok(
  not has_table_privilege('anon','public.bible_polls','SELECT')
  and not has_table_privilege('anon','public.bible_poll_votes','SELECT'),
  'anonymous role cannot read congregation polls or votes'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select results_eq(
  $$select count(*)::bigint from public.bible_calendar_events where congregation_id is not null$$,
  array[1::bigint],
  'Leader A reads only congregation A shared calendar'
);
select lives_ok(
  $$insert into public.bible_calendar_events(id,user_id,title,notes,event_date,all_day,congregation_id,recurrence_weeks)
    values('cb100000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Leader A event','V6 tenant write proof',date '2026-10-01',true,'10000000-0000-4000-8000-000000000001',0)$$,
  'Leader A may create a congregation A event'
);
select throws_ok(
  $$insert into public.bible_calendar_events(id,user_id,title,notes,event_date,all_day,congregation_id,recurrence_weeks)
    values('cb200000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','Foreign event','must fail',date '2026-10-02',true,'20000000-0000-4000-8000-000000000002',0)$$,
  '42501', null,
  'Leader A cannot create a congregation B event'
);
select lives_ok(
  $$insert into public.bible_ministry_messages(id,congregation_id,created_by,message_type,title,body)
    values('db100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','announcement','Leader A notice','V6 tenant write proof')$$,
  'Leader A may publish ministry content in congregation A'
);
select throws_ok(
  $$insert into public.bible_ministry_messages(id,congregation_id,created_by,message_type,title,body)
    values('db200000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','announcement','Foreign notice','must fail')$$,
  '42501', null,
  'Leader A cannot publish ministry content in congregation B'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select count(*)::bigint from public.bible_ministry_messages where id='db100000-0000-4000-8000-000000000001'::uuid$$,
  array[1::bigint],
  'Member A can read published congregation A ministry content'
);
select throws_ok(
  $$insert into public.bible_ministry_messages(id,congregation_id,created_by,message_type,title,body)
    values('db300000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112','announcement','Member notice','must fail')$$,
  '42501', null,
  'ordinary Member A cannot publish ministry content'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222221';

select results_eq(
  $$select count(*)::bigint from public.bible_ministry_messages where id='db100000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Admin B cannot read congregation A ministry content'
);
select results_eq(
  $$select count(*)::bigint from public.bible_calendar_events where id='cb100000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Admin B cannot read congregation A shared calendar'
);
select lives_ok(
  $$insert into public.bible_ministry_messages(id,congregation_id,created_by,message_type,title,body)
    values('db400000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222221','announcement','Admin B notice','V6 tenant write proof')$$,
  'Admin B may publish ministry content in congregation B'
);
select lives_ok(
  $$insert into public.bible_calendar_events(id,user_id,title,notes,event_date,all_day,congregation_id,recurrence_weeks)
    values('cb400000-0000-4000-8000-000000000004','22222222-2222-4222-8222-222222222221','Admin B event','V6 tenant write proof',date '2026-10-04',true,'20000000-0000-4000-8000-000000000002',0)$$,
  'Admin B may create a congregation B event'
);

reset role;
select * from finish();
rollback;
