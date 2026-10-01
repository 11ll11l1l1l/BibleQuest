begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into public.bible_push_subscriptions (
  id, user_id, endpoint, p256dh, auth, v6_enabled_categories
) values (
  'ee100000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111112',
  'https://push.example.com/v6-ci-assignment-redispatch',
  '0123456789abcdef',
  '01234567',
  array['assignments']::text[]
);

insert into public.bible_notifications (
  id,
  user_id,
  congregation_id,
  notification_type,
  delivery_category,
  title,
  body,
  action_kind,
  action_payload,
  created_at
) values (
  'ee200000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111112',
  '10000000-0000-4000-8000-000000000001',
  'assignment',
  'assignments',
  'Retry redispatch fixture',
  'Synthetic disposable fixture',
  'assignment',
  jsonb_build_object('assignment_id', 'ee300000-0000-4000-8000-000000000003'),
  clock_timestamp()
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'bible_push_retry_state_due_idx'
  ),
  'assignment scheduler retry scan has an indexed due-time path'
);

set local role service_role;

select is(
  public.bible_claim_push_delivery_rate_limited(
    'ee200000-0000-4000-8000-000000000002'::uuid,
    'ee100000-0000-4000-8000-000000000001'::uuid
  ),
  true,
  'fixture obtains the same delivery claim used by the canonical sender'
);

select is(
  public.bible_record_push_retry_failure(
    'ee200000-0000-4000-8000-000000000002'::uuid,
    'ee100000-0000-4000-8000-000000000001'::uuid
  ),
  1,
  'transient assignment push failure records retry state'
);

reset role;

-- Model bq-push-delivery's transient-failure cleanup after recording backoff.
delete from public.bible_push_delivery_ledger
where notification_id = 'ee200000-0000-4000-8000-000000000002'::uuid
  and subscription_id = 'ee100000-0000-4000-8000-000000000001'::uuid
  and delivered_at is null;

update public.bible_push_retry_state
set last_failure_at = clock_timestamp() - interval '61 seconds',
    next_retry_at = clock_timestamp() - interval '1 second'
where notification_id = 'ee200000-0000-4000-8000-000000000002'::uuid
  and subscription_id = 'ee100000-0000-4000-8000-000000000001'::uuid;

set local role service_role;

select ok(
  exists (
    select 1
    from public.bible_enqueue_assignment_due_notifications_v6()
    where notification_id = 'ee200000-0000-4000-8000-000000000002'::uuid
  ),
  'scheduler re-emits a recent assignment notification after retry backoff elapses'
);

reset role;

update public.bible_push_retry_state
set next_retry_at = clock_timestamp() + interval '5 minutes'
where notification_id = 'ee200000-0000-4000-8000-000000000002'::uuid
  and subscription_id = 'ee100000-0000-4000-8000-000000000001'::uuid;

set local role service_role;

select ok(
  not exists (
    select 1
    from public.bible_enqueue_assignment_due_notifications_v6()
    where notification_id = 'ee200000-0000-4000-8000-000000000002'::uuid
  ),
  'scheduler does not bypass a future retry backoff'
);

reset role;

update public.bible_push_retry_state
set next_retry_at = clock_timestamp() - interval '1 second'
where notification_id = 'ee200000-0000-4000-8000-000000000002'::uuid
  and subscription_id = 'ee100000-0000-4000-8000-000000000001'::uuid;

update public.bible_notifications
set created_at = clock_timestamp() - interval '16 minutes'
where id = 'ee200000-0000-4000-8000-000000000002'::uuid;

set local role service_role;

select ok(
  not exists (
    select 1
    from public.bible_enqueue_assignment_due_notifications_v6()
    where notification_id = 'ee200000-0000-4000-8000-000000000002'::uuid
  ),
  'scheduler does not redispatch outside the canonical sender freshness window'
);

reset role;

update public.bible_notifications
set created_at = clock_timestamp(),
    delivery_category = 'ministry'
where id = 'ee200000-0000-4000-8000-000000000002'::uuid;

set local role service_role;

select ok(
  not exists (
    select 1
    from public.bible_enqueue_assignment_due_notifications_v6()
    where notification_id = 'ee200000-0000-4000-8000-000000000002'::uuid
  ),
  'assignment scheduler does not claim retries from another delivery category'
);

reset role;

select * from finish();
rollback;
