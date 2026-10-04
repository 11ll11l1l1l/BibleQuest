begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

select ok(not has_function_privilege('anon','public.bible_v7_transition_mentor_pair(uuid,text)','EXECUTE'),'Anonymous callers cannot transition V7 mentor pairs');
select ok(has_function_privilege('authenticated','public.bible_v7_transition_mentor_pair(uuid,text)','EXECUTE'),'Authenticated callers can use the bounded pair transition RPC');
select ok(not has_table_privilege('authenticated','public.v7_mentor_pairs','UPDATE'),'Authenticated clients cannot update pair rows directly');
select ok(not has_table_privilege('authenticated','public.v7_pair_events','INSERT'),'Authenticated clients cannot append pair audit events directly');

insert into public.v7_mentor_pairs(id,congregation_id,mentor_id,mentee_id,initiated_by,state)
values ('80000000-0000-4000-8000-000000000099','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','invited');

select is((select count(*)::integer from public.v7_pair_events where pair_id='80000000-0000-4000-8000-000000000099' and event_type='invited'),1,'Invitation creates exactly one server-owned audit event');

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is((public.bible_v7_transition_mentor_pair('80000000-0000-4000-8000-000000000099','accept')).state,'invited','First participant acceptance keeps the pair invited');
select ok((select mentor_accepted_at is not null and mentee_accepted_at is null from public.v7_mentor_pairs where id='80000000-0000-4000-8000-000000000099'),'Mentor acceptance is recorded without fabricating mentee acceptance');

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select is((public.bible_v7_transition_mentor_pair('80000000-0000-4000-8000-000000000099','accept')).state,'active','Second participant acceptance activates the pair');
select is((select count(*)::integer from public.v7_pair_events where pair_id='80000000-0000-4000-8000-000000000099' and event_type='accepted'),2,'Each participant acceptance creates one audit event');
select is((public.bible_v7_transition_mentor_pair('80000000-0000-4000-8000-000000000099','end')).state,'ended','Either participant can explicitly end an active pair');
select is((select count(*)::integer from public.v7_pair_events where pair_id='80000000-0000-4000-8000-000000000099'),4,'Lifecycle audit history contains invitation, two acceptances, and ending');

reset role;
select * from finish();
rollback;
