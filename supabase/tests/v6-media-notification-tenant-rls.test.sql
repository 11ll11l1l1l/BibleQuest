begin;

create extension if not exists pgtap with schema extensions;
select plan(44);

insert into public.bible_media_library (
  id, congregation_id, created_by, media_type, title, youtube_url,
  youtube_id, category, active, publish_at
) values
  (
    'd1000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'youtube_video',
    'V6 Media A',
    'https://www.youtube.com/watch?v=v6-media-a',
    'v6-media-a',
    'bible-study',
    true,
    now() - interval '1 minute'
  ),
  (
    'd2000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222221',
    'youtube_video',
    'V6 Media B',
    'https://www.youtube.com/watch?v=v6-media-b',
    'v6-media-b',
    'bible-study',
    true,
    now() - interval '1 minute'
  );

insert into public.bible_notifications (
  id, user_id, congregation_id, created_by, notification_type,
  title, body, action_kind, action_payload
) values (
  'd3000000-0000-4000-8000-000000000003',
  '11111111-1111-4111-8111-111111111114',
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'info',
  'Historical own notification',
  'Synthetic durable inbox fixture',
  'ministry',
  '{}'::jsonb
);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_media_library'::regclass),
  'media library keeps RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid='public.bible_notifications'::regclass),
  'notification inbox keeps RLS enabled'
);
select ok(
  not has_table_privilege('anon','public.bible_media_library','SELECT'),
  'anonymous role cannot read congregation media'
);
select ok(
  not has_table_privilege('anon','public.bible_notifications','SELECT'),
  'anonymous role cannot read notification inbox rows'
);
select ok(
  has_table_privilege('authenticated','public.bible_media_library','SELECT'),
  'authenticated role has media SELECT grant bounded by RLS'
);
select ok(
  has_table_privilege('authenticated','public.bible_media_library','INSERT'),
  'authenticated role has media INSERT grant bounded by reviewer RLS'
);
select ok(
  has_table_privilege('authenticated','public.bible_media_library','UPDATE'),
  'authenticated role has media UPDATE grant bounded by reviewer RLS'
);
select ok(
  has_table_privilege('authenticated','public.bible_notifications','SELECT'),
  'authenticated role has notification SELECT grant bounded by ownership RLS'
);
select ok(
  has_table_privilege('authenticated','public.bible_notifications','INSERT'),
  'authenticated role retains direct notification INSERT grant bounded by leadership RLS'
);
select ok(
  not has_table_privilege('authenticated','public.bible_notifications','UPDATE'),
  'authenticated role no longer has whole-row notification UPDATE privilege'
);
select ok(
  has_column_privilege('authenticated','public.bible_notifications','read_at','UPDATE'),
  'authenticated role may update only notification read state'
);
select ok(
  not has_column_privilege('authenticated','public.bible_notifications','title','UPDATE'),
  'authenticated role cannot rewrite notification title'
);
select ok(
  not has_column_privilege('authenticated','public.bible_notifications','action_payload','UPDATE'),
  'authenticated role cannot rewrite notification action payload'
);
select ok(
  (select prosecdef from pg_proc where oid='private.bible_notify_new_media()'::regprocedure),
  'media notification producer remains SECURITY DEFINER'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=%'
     from pg_proc where oid='private.bible_notify_new_media()'::regprocedure),
    false
  ),
  'media notification producer pins search_path'
);
select ok(
  not has_function_privilege('authenticated','private.bible_notify_new_media()','EXECUTE'),
  'authenticated browser role cannot execute media notification producer directly'
);

select is(
  (
    select count(*)::integer
    from public.bible_notifications
    where action_payload->>'media_id'='d1000000-0000-4000-8000-000000000001'
  ),
  3,
  'media A producer targets the three active congregation A members only'
);
select is(
  (
    select count(*)::integer
    from public.bible_notifications
    where action_payload->>'media_id'='d1000000-0000-4000-8000-000000000001'
      and user_id='11111111-1111-4111-8111-111111111114'::uuid
  ),
  0,
  'media A producer excludes the inactive former member'
);
select is(
  (
    select count(*)::integer
    from public.bible_notifications
    where action_payload->>'media_id'='d2000000-0000-4000-8000-000000000002'
  ),
  2,
  'media B producer targets the two active congregation B members only'
);
select is(
  (
    select count(*)::integer
    from public.bible_notifications
    where (
      action_payload->>'media_id'='d1000000-0000-4000-8000-000000000001'
      and congregation_id <> '10000000-0000-4000-8000-000000000001'::uuid
    ) or (
      action_payload->>'media_id'='d2000000-0000-4000-8000-000000000002'
      and congregation_id <> '20000000-0000-4000-8000-000000000002'::uuid
    )
  ),
  0,
  'media producer creates no cross-congregation notification rows'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select id from public.bible_media_library order by id$$,
  array['d1000000-0000-4000-8000-000000000001'::uuid],
  'Member A reads only published media in congregation A'
);
select results_eq(
  $$select count(*)::bigint from public.bible_media_library
    where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot filter into congregation B media'
);
select throws_ok(
  $$insert into public.bible_media_library(
      congregation_id,created_by,media_type,title,youtube_url,category
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      'youtube_video','Member media','https://www.youtube.com/watch?v=member-a','other'
    )$$,
  '42501',
  null,
  'ordinary Member A cannot curate media even in its own congregation'
);
select results_eq(
  $$select count(*)::bigint from public.bible_notifications
    where user_id <> '11111111-1111-4111-8111-111111111112'::uuid$$,
  array[0::bigint],
  'Member A cannot read another account notification row'
);
select lives_ok(
  $$update public.bible_notifications
    set read_at=now()
    where user_id='11111111-1111-4111-8111-111111111112'::uuid
      and action_payload->>'media_id'='d1000000-0000-4000-8000-000000000001'$$,
  'Member A can update its own notification read state'
);
select throws_ok(
  $$update public.bible_notifications
    set title='Tampered title'
    where user_id='11111111-1111-4111-8111-111111111112'::uuid$$,
  '42501',
  null,
  'Member A cannot rewrite its own server-authored notification content'
);
select results_eq(
  $$with changed as (
      update public.bible_notifications
      set read_at=now()
      where user_id='22222222-2222-4222-8222-222222222222'::uuid
      returning id
    )
    select count(*)::bigint from changed$$,
  array[0::bigint],
  'Member A cannot update Member B notification read state'
);
select throws_ok(
  $$insert into public.bible_notifications(
      user_id,congregation_id,created_by,notification_type,title,body
    ) values (
      '11111111-1111-4111-8111-111111111112',
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      'info','Member fabricated notification','Synthetic fixture'
    )$$,
  '42501',
  null,
  'ordinary Member A cannot directly create notification rows'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select results_eq(
  $$select id from public.bible_media_library order by id$$,
  array['d1000000-0000-4000-8000-000000000001'::uuid],
  'Leader A reads only congregation A media'
);
select lives_ok(
  $$insert into public.bible_media_library(
      id,congregation_id,created_by,media_type,title,youtube_url,youtube_id,category
    ) values (
      'd1100000-0000-4000-8000-000000000011',
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111111',
      'youtube_video','Leader A media','https://www.youtube.com/watch?v=leader-a',
      'leader-a','bible-study'
    )$$,
  'Leader A can curate media inside congregation A'
);
select throws_ok(
  $$insert into public.bible_media_library(
      congregation_id,created_by,media_type,title,youtube_url,category
    ) values (
      '20000000-0000-4000-8000-000000000002',
      '11111111-1111-4111-8111-111111111111',
      'youtube_video','Foreign media','https://www.youtube.com/watch?v=foreign-a','other'
    )$$,
  '42501',
  null,
  'Leader A cannot curate media inside congregation B'
);
select lives_ok(
  $$insert into public.bible_notifications(
      id,user_id,congregation_id,created_by,notification_type,delivery_category,title,body
    ) values (
      'e1000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111111',
      'announcement','announcements','Leader A direct notice','Synthetic fixture'
    )$$,
  'Leader A may create a bounded direct notification for an active congregation A member'
);
select throws_ok(
  $$insert into public.bible_notifications(
      user_id,congregation_id,created_by,notification_type,delivery_category,title,body
    ) values (
      '22222222-2222-4222-8222-222222222222',
      '20000000-0000-4000-8000-000000000002',
      '11111111-1111-4111-8111-111111111111',
      'announcement','announcements','Cross tenant notice','Synthetic fixture'
    )$$,
  '42501',
  null,
  'Leader A cannot directly create a notification in congregation B'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';

select results_eq(
  $$select count(*)::bigint from public.bible_media_library$$,
  array[2::bigint],
  'Pastor A sees both congregation A media rows and no congregation B media'
);
select lives_ok(
  $$update public.bible_media_library
    set title='Pastor A reviewed media'
    where id='d1000000-0000-4000-8000-000000000001'::uuid$$,
  'Pastor A can update congregation A media'
);
select results_eq(
  $$with changed as (
      update public.bible_media_library
      set title='Cross tenant pastor edit'
      where id='d2000000-0000-4000-8000-000000000002'::uuid
      returning id
    )
    select count(*)::bigint from changed$$,
  array[0::bigint],
  'Pastor A cannot update congregation B media'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222221';

select results_eq(
  $$select id from public.bible_media_library order by id$$,
  array['d2000000-0000-4000-8000-000000000002'::uuid],
  'Admin B reads only congregation B media'
);
select lives_ok(
  $$insert into public.bible_media_library(
      id,congregation_id,created_by,media_type,title,youtube_url,youtube_id,category
    ) values (
      'd2200000-0000-4000-8000-000000000022',
      '20000000-0000-4000-8000-000000000002',
      '22222222-2222-4222-8222-222222222221',
      'youtube_video','Admin B media','https://www.youtube.com/watch?v=admin-b',
      'admin-b','bible-study'
    )$$,
  'Admin B can curate media inside congregation B'
);
select throws_ok(
  $$insert into public.bible_media_library(
      congregation_id,created_by,media_type,title,youtube_url,category
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '22222222-2222-4222-8222-222222222221',
      'youtube_video','Foreign admin media','https://www.youtube.com/watch?v=foreign-b','other'
    )$$,
  '42501',
  null,
  'Admin B cannot curate media inside congregation A'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111114';

select results_eq(
  $$select count(*)::bigint from public.bible_media_library$$,
  array[0::bigint],
  'inactive former Member A has no congregation media visibility'
);
select results_eq(
  $$select id from public.bible_notifications
    where id='d3000000-0000-4000-8000-000000000003'::uuid$$,
  array['d3000000-0000-4000-8000-000000000003'::uuid],
  'former Member A retains only its own durable historical inbox row'
);
select lives_ok(
  $$update public.bible_notifications
    set read_at=now()
    where id='d3000000-0000-4000-8000-000000000003'::uuid$$,
  'former Member A may still mark its own historical inbox row read'
);

set local "request.jwt.claim.sub"='99999999-9999-4999-8999-999999999999';

select results_eq(
  $$select count(*)::bigint from public.bible_media_library$$,
  array[4::bigint],
  'platform Owner retains intentional reviewer visibility across both congregations'
);
select ok(
  private.bible_can_review_content('10000000-0000-4000-8000-000000000001'::uuid)
  and private.bible_can_review_content('20000000-0000-4000-8000-000000000002'::uuid),
  'platform Owner reviewer authority is explicit rather than accidental tenant leakage'
);

reset role;
select * from finish();
rollback;
