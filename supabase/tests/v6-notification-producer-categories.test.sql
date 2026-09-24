begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

select ok(
  (select prosecdef from pg_proc where oid='public.bq_notify_assignment()'::regprocedure),
  'assignment notification trigger remains SECURITY DEFINER'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=pg_catalog, public%'
     from pg_proc where oid='public.bq_notify_assignment()'::regprocedure),
    false
  ),
  'assignment notification trigger pins its search_path'
);
select ok(
  not has_function_privilege('authenticated','public.bq_notify_assignment()','EXECUTE'),
  'authenticated browser role cannot call assignment notification trigger directly'
);

select ok(
  (select prosecdef from pg_proc where oid='public.bq_notify_assignment_feedback()'::regprocedure),
  'assignment feedback trigger remains SECURITY DEFINER'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=pg_catalog, public%'
     from pg_proc where oid='public.bq_notify_assignment_feedback()'::regprocedure),
    false
  ),
  'assignment feedback trigger pins its search_path'
);
select ok(
  not has_function_privilege('authenticated','public.bq_notify_assignment_feedback()','EXECUTE'),
  'authenticated browser role cannot call assignment feedback trigger directly'
);

select ok(
  (select prosecdef from pg_proc where oid='public.bq_notify_congregation_members()'::regprocedure),
  'congregation notification trigger remains SECURITY DEFINER'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=pg_catalog, public%'
     from pg_proc where oid='public.bq_notify_congregation_members()'::regprocedure),
    false
  ),
  'congregation notification trigger pins its search_path'
);
select ok(
  not has_function_privilege('authenticated','public.bq_notify_congregation_members()','EXECUTE'),
  'authenticated browser role cannot call congregation notification trigger directly'
);

insert into public.bible_assignments (
  id, congregation_id, created_by, title, instructions, assignment_type,
  target_scope, target_id, points, active
) values (
  'ee000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'Producer category assignment',
  'Synthetic disposable fixture',
  'reading',
  'member',
  '11111111-1111-4111-8111-111111111112',
  5,
  true
);

select results_eq(
  $$select delivery_category from public.bible_notifications
    where action_payload->>'assignment_id'='ee000000-0000-4000-8000-000000000001'
      and notification_type='assignment'$$,
  $$values ('assignments'::text)$$,
  'assignment producer emits canonical assignments category'
);

insert into public.bible_assignment_progress (
  assignment_id, user_id, status
) values (
  'ee000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111112',
  'assigned'
);
update public.bible_assignment_progress
set leader_feedback='Synthetic feedback'
where assignment_id='ee000000-0000-4000-8000-000000000001'::uuid
  and user_id='11111111-1111-4111-8111-111111111112'::uuid;

select results_eq(
  $$select delivery_category from public.bible_notifications
    where action_payload->>'assignment_id'='ee000000-0000-4000-8000-000000000001'
      and notification_type='feedback'$$,
  $$values ('assignments'::text)$$,
  'assignment feedback producer emits canonical assignments category'
);

insert into public.bible_ministry_messages (
  id, congregation_id, created_by, message_type, title, body, active, publish_at
) values
  (
    'ef000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'announcement',
    'Producer announcement',
    'Synthetic disposable fixture',
    true,
    now() - interval '1 minute'
  ),
  (
    'ef000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'encouragement',
    'Producer encouragement',
    'Synthetic disposable fixture',
    true,
    now() - interval '1 minute'
  ),
  (
    'ef000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'devotional',
    'Producer devotional',
    'Synthetic disposable fixture',
    true,
    now() - interval '1 minute'
  );

select results_eq(
  $$select distinct delivery_category from public.bible_notifications
    where action_payload->>'message_id'='ef000000-0000-4000-8000-000000000002'$$,
  $$values ('announcements'::text)$$,
  'announcement producer emits canonical announcements category'
);
select results_eq(
  $$select distinct delivery_category from public.bible_notifications
    where action_payload->>'message_id'='ef000000-0000-4000-8000-000000000003'$$,
  $$values ('encouragement'::text)$$,
  'ministry encouragement producer emits canonical encouragement category'
);
select results_eq(
  $$select distinct delivery_category from public.bible_notifications
    where action_payload->>'message_id'='ef000000-0000-4000-8000-000000000004'$$,
  $$values ('ministry'::text)$$,
  'other ministry message producer emits canonical ministry category'
);

insert into public.bible_polls (
  id, prompt, options, congregation_id, created_by, active
) values (
  'f0000000-0000-4000-8000-000000000005',
  'Synthetic producer poll?',
  '["Yes","No"]'::jsonb,
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  true
);

select results_eq(
  $$select distinct delivery_category from public.bible_notifications
    where action_payload->>'poll_id'='f0000000-0000-4000-8000-000000000005'$$,
  $$values ('ministry'::text)$$,
  'poll producer emits canonical ministry category'
);

insert into public.bible_member_recognitions (
  id, congregation_id, user_id, awarded_by, award_code, title, note, visible
) values (
  'f1000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111112',
  '11111111-1111-4111-8111-111111111111',
  'producer-test',
  'Producer recognition',
  'Synthetic disposable fixture',
  true
);

select results_eq(
  $$select delivery_category is null from public.bible_notifications
    where action_payload->>'recognition_id'='f1000000-0000-4000-8000-000000000006'$$,
  array[true],
  'recognition producer remains uncategorized and fail-closed'
);

select is(
  (
    select count(*)::integer
    from public.bible_notifications
    where (
      action_payload->>'assignment_id'='ee000000-0000-4000-8000-000000000001'
      or action_payload->>'message_id' in (
        'ef000000-0000-4000-8000-000000000002',
        'ef000000-0000-4000-8000-000000000003',
        'ef000000-0000-4000-8000-000000000004'
      )
      or action_payload->>'poll_id'='f0000000-0000-4000-8000-000000000005'
      or action_payload->>'recognition_id'='f1000000-0000-4000-8000-000000000006'
    )
      and congregation_id <> '10000000-0000-4000-8000-000000000001'::uuid
  ),
  0,
  'producer category fixtures create no cross-congregation notifications'
);

select is(
  (
    select count(*)::integer
    from pg_trigger t
    join pg_proc p on p.oid=t.tgfoid
    where t.tgrelid='public.bible_group_encouragements'::regclass
      and not t.tgisinternal
      and p.proname in (
        'bq_notify_congregation_members',
        'bq_notify_assignment',
        'bq_notify_assignment_feedback'
      )
  ),
  0,
  'group encouragements are not silently promoted into a new notification producer'
);

select * from finish();
rollback;
