begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

insert into public.bible_push_subscriptions (id,user_id,endpoint,p256dh,auth,enabled_categories)
values
 ('e1000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112','https://push.invalid/v6-ci-owner-a','0123456789abcdef','01234567',array['assignment']::text[]),
 ('e2000000-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222222','https://push.invalid/v6-ci-owner-b','fedcba9876543210','76543210',array['calendar']::text[]);

select ok((select relrowsecurity from pg_class where oid='public.bible_push_subscriptions'::regclass),'push subscriptions keep RLS enabled');
select ok(not has_table_privilege('anon','public.bible_push_subscriptions','SELECT'),'anon cannot read push subscriptions');

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq($$select count(*)::bigint from public.bible_push_subscriptions$$,array[1::bigint],'Member A sees only own push subscription');
select results_eq($$select count(*)::bigint from public.bible_push_subscriptions where user_id='22222222-2222-4222-8222-222222222222'::uuid$$,array[0::bigint],'Member A cannot filter into Member B subscription');
select lives_ok($$update public.bible_push_subscriptions set enabled_categories=array['assignment','calendar']::text[] where id='e1000000-0000-4000-8000-000000000001'::uuid$$,'Member A may update own subscription');
select is((select array_to_string(enabled_categories,',') from public.bible_push_subscriptions where id='e1000000-0000-4000-8000-000000000001'::uuid),'assignment,calendar','own subscription update persists');
select throws_ok($$insert into public.bible_push_subscriptions(id,user_id,endpoint,p256dh,auth) values('e3000000-0000-4000-8000-000000000003','22222222-2222-4222-8222-222222222222','https://push.invalid/v6-ci-steal','0011223344556677','00112233')$$,'42501',null,'Member A cannot create subscription owned by Member B');
select lives_ok($$update public.bible_push_subscriptions set user_id='11111111-1111-4111-8111-111111111112'::uuid where id='e2000000-0000-4000-8000-000000000002'::uuid$$,'Member A foreign-row takeover attempt is safely filtered by RLS');

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';
select results_eq($$select count(*)::bigint from public.bible_push_subscriptions$$,array[1::bigint],'Member B sees only own push subscription');
select results_eq($$select endpoint from public.bible_push_subscriptions$$,array['https://push.invalid/v6-ci-owner-b'::text],'Member B endpoint remains unchanged after Member A attempts');

reset role;
select * from finish();
rollback;
