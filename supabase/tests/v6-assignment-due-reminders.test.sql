begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select ok(
  exists (
    select 1 from pg_indexes
    where schemaname='public'
      and indexname='bible_notifications_assignment_due_once_idx'
  ),
  'assignment due reminders have a durable per-user idempotency index'
);
select ok(
  exists (
    select 1 from pg_indexes
    where schemaname='public'
      and indexname='bible_assignments_active_due_reminder_idx'
  ),
  'active due assignments have an indexed scheduler scan path'
);
select ok(
  (select prosecdef from pg_proc where oid='public.bible_enqueue_assignment_due_notifications_v6()'::regprocedure),
  'due reminder enqueue is SECURITY DEFINER'
);
select ok(
  coalesce((select array_to_string(proconfig, ',') like '%search_path=pg_catalog, public%' from pg_proc where oid='public.bible_enqueue_assignment_due_notifications_v6()'::regprocedure), false),
  'due reminder enqueue pins its search_path'
);
select ok(
  coalesce((select array_to_string(proconfig, ',') like '%row_security=off%' from pg_proc where oid='public.bible_enqueue_assignment_due_notifications_v6()'::regprocedure), false),
  'service-only enqueue has stable RLS behavior'
);
select ok(
  has_function_privilege('service_role','public.bible_enqueue_assignment_due_notifications_v6()','EXECUTE'),
  'service role can execute due reminder enqueue'
);
select ok(
  not has_function_privilege('authenticated','public.bible_enqueue_assignment_due_notifications_v6()','EXECUTE'),
  'authenticated clients cannot enqueue due reminders'
);
select ok(
  not has_function_privilege('anon','public.bible_enqueue_assignment_due_notifications_v6()','EXECUTE'),
  'anonymous clients cannot enqueue due reminders'
);

insert into public.bible_assignments (
  id, congregation_id, created_by, title, instructions, assignment_type,
  target_scope, target_id, due_at, reminder_at, schedule_at, points, active
) values
  (
    'ed100000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'A due reminder fixture', 'Complete the reading', 'reading', 'all', null,
    now() + interval '8 hours', now() - interval '2 minutes', now() - interval '1 day', 5, true
  ),
  (
    'ed200000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222221',
    'B due reminder fixture', 'Complete the reading', 'reading', 'all', null,
    now() + interval '8 hours', now() - interval '2 minutes', now() - interval '1 day', 5, true
  ),
  (
    'ed300000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Future scheduled fixture', 'Not open yet', 'reading', 'all', null,
    now() + interval '8 hours', now() - interval '2 minutes', now() + interval '1 hour', 5, true
  ),
  (
    'ed400000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Inactive fixture', 'Archived', 'reading', 'all', null,
    now() + interval '8 hours', now() - interval '2 minutes', now() - interval '1 day', 5, false
  ),
  (
    'ed500000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Foreign team fixture', 'Must not cross tenant', 'reading', 'team', '72000000-0000-4000-8000-000000000002',
    now() + interval '8 hours', now() - interval '2 minutes', now() - interval '1 day', 5, true
  );

insert into public.bible_team_members (team_id, user_id)
values ('72000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111112')
on conflict (team_id, user_id) do nothing;

insert into public.bible_assignment_progress (assignment_id, user_id, status)
values (
  'ed100000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111112',
  'completed'
);

set local role service_role;

select results_eq(
  $$select count(*)::bigint from public.bible_enqueue_assignment_due_notifications_v6()$$,
  array[2::bigint],
  'eligible incomplete recipients receive one durable due reminder each'
);

reset role;
select results_eq(
  $$select user_id::text from public.bible_notifications
    where notification_type='assignment_due'
      and action_payload->>'assignment_id' in (
        'ed100000-0000-4000-8000-000000000001',
        'ed200000-0000-4000-8000-000000000002'
      )
    order by user_id::text$$,
  $$values
    ('11111111-1111-4111-8111-111111111113'::text),
    ('22222222-2222-4222-8222-222222222222'::text)$$,
  'reminders stay in each congregation and exclude completed members and assignment authors'
);
select is(
  (select count(*)::bigint from public.bible_notifications
   where notification_type='assignment_due'
     and action_payload->>'assignment_id' in (
       'ed300000-0000-4000-8000-000000000003',
       'ed400000-0000-4000-8000-000000000004'
     )),
  0::bigint,
  'future scheduled and inactive assignments do not notify'
);
select is(
  (select count(*)::bigint from public.bible_notifications
   where notification_type='assignment_due'
     and action_payload->>'assignment_id'='ed500000-0000-4000-8000-000000000005'),
  0::bigint,
  'a foreign-congregation team cannot supply assignment reminder recipients'
);
select ok(
  (select bool_and(delivery_category='assignments'
     and action_kind='assignment'
     and action_payload->>'reminder_kind'='due'
     and action_payload ? 'due_at')
   from public.bible_notifications where notification_type='assignment_due'),
  'due reminders use the canonical push category and safe assignment deep-link identity'
);

set local role service_role;
select results_eq(
  $$select count(*)::bigint from public.bible_enqueue_assignment_due_notifications_v6()$$,
  array[0::bigint],
  'repeat scheduler runs do not duplicate delivered-to-inbox reminder rows'
);
reset role;

select * from finish();
rollback;
