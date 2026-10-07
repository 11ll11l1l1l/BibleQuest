begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

create function pg_temp.v7_pair_rpc_sqlstate(statement text)
returns text language plpgsql security invoker as $bq$
begin
  execute statement;
  return '00000';
exception when others then
  return sqlstate;
end;
$bq$;

-- Isolate tenant authority from any site-wide role. The same mentor identity
-- remains a plain platform member throughout this proof.
insert into public.bible_app_access(user_id, role, active)
values ('11111111-1111-4111-8111-111111111113', 'member', true)
on conflict (user_id) do update set role='member', active=true;

update public.bible_congregation_members
set active=false
where user_id='11111111-1111-4111-8111-111111111113';

insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values (
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111113',
  'member','A3 Pair Mentor',true
)
on conflict (congregation_id,user_id)
do update set role='member', display_name='A3 Pair Mentor', active=true;

insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values (
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111112',
  'member','A3 Pair Mentee',true
)
on conflict (congregation_id,user_id)
do update set role='member', display_name='A3 Pair Mentee', active=true;

-- Reuse the synthetic former-member identity only inside this rolled-back test
-- as a distinct current A participant. Distinct counterparts preserve the
-- production invariant that a mentor/mentee tuple has at most one open pair.
insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values (
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111114',
  'member','A3 Pair Invitation Mentee',true
)
on conflict (congregation_id,user_id)
do update set role='member', display_name='A3 Pair Invitation Mentee', active=true;

-- Control invitation: proves the current A participant can use the lifecycle
-- RPC before the context switch.
insert into public.v7_mentor_pairs(id,congregation_id,mentor_id,mentee_id,initiated_by,state)
values (
  'b4000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111113',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111113',
  'invited'
);

-- Stale invitation: must remain untouched after the mentor moves A -> B.
insert into public.v7_mentor_pairs(id,congregation_id,mentor_id,mentee_id,initiated_by,state)
values (
  'b4000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111113',
  '11111111-1111-4111-8111-111111111114',
  '11111111-1111-4111-8111-111111111113',
  'invited'
);

-- Active stale relationship: a departed mentor must not be able to end it,
-- but the mentee who remains a current A member must retain safe close-out.
insert into public.v7_mentor_pairs(
  id,congregation_id,mentor_id,mentee_id,initiated_by,state,
  mentor_accepted_at,mentee_accepted_at
) values (
  'b4000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111113',
  '11111111-1111-4111-8111-111111111112',
  '11111111-1111-4111-8111-111111111113',
  'active', now(), now()
);

select is(
  (select role from public.bible_app_access where user_id='11111111-1111-4111-8111-111111111113'),
  'member',
  'Pair lifecycle actor is not a site-wide owner or admin'
);
select is(
  (select count(*)::integer from public.bible_congregation_members where congregation_id='10000000-0000-4000-8000-000000000001' and user_id='11111111-1111-4111-8111-111111111113' and active),
  1,
  'Mentor begins as a current congregation A member'
);
select is(
  (select count(*)::integer from public.bible_congregation_members where congregation_id='10000000-0000-4000-8000-000000000001' and user_id='11111111-1111-4111-8111-111111111112' and active),
  1,
  'Mentee begins as a current congregation A member'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';
select is(
  (public.bible_v7_transition_mentor_pair('b4000000-0000-4000-8000-000000000001','accept')).state,
  'invited',
  'Current congregation A mentor can accept an A invitation through SECURITY DEFINER RPC'
);
select ok(
  (select mentor_accepted_at is not null and mentee_accepted_at is null from public.v7_mentor_pairs where id='b4000000-0000-4000-8000-000000000001'),
  'Current mentor acceptance is committed without fabricating mentee acceptance'
);

-- Move the same identity out of A and into B without changing its JWT user id.
reset role;
update public.bible_congregation_members
set active=false
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111113';
insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values (
  '20000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111113',
  'member','A3 Pair Mentor switched to B',true
)
on conflict (congregation_id,user_id)
do update set role='member', display_name='A3 Pair Mentor switched to B', active=true;

select is(
  (select count(*)::integer from public.bible_congregation_members where congregation_id='10000000-0000-4000-8000-000000000001' and user_id='11111111-1111-4111-8111-111111111113' and active),
  0,
  'Switched mentor old congregation A membership is inactive'
);
select is(
  (select count(*)::integer from public.bible_congregation_members where congregation_id='20000000-0000-4000-8000-000000000002' and user_id='11111111-1111-4111-8111-111111111113' and active),
  1,
  'Same mentor identity is now current only in congregation B'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';
select is(
  pg_temp.v7_pair_rpc_sqlstate($sql$select * from public.bible_v7_transition_mentor_pair('b4000000-0000-4000-8000-000000000002','accept')$sql$),
  '42501',
  'Switched mentor cannot accept stale congregation A pair through SECURITY DEFINER RPC'
);
select is(
  pg_temp.v7_pair_rpc_sqlstate($sql$select * from public.bible_v7_transition_mentor_pair('b4000000-0000-4000-8000-000000000003','end')$sql$),
  '42501',
  'Switched mentor cannot end stale congregation A pair through SECURITY DEFINER RPC'
);
select is(
  (select count(*)::integer from public.v7_mentor_pairs where id='b4000000-0000-4000-8000-000000000002'),
  0,
  'Switched mentor cannot read stale congregation A invitation after context switch'
);
select is(
  (select count(*)::integer from public.v7_mentor_pairs where id='b4000000-0000-4000-8000-000000000003'),
  0,
  'Switched mentor cannot read stale congregation A active pair after context switch'
);

-- Inspect invariants outside authenticated RLS so row invisibility is not
-- mistaken for state preservation.
reset role;
select ok(
  (select state='invited' and mentor_accepted_at is null and mentee_accepted_at is null from public.v7_mentor_pairs where id='b4000000-0000-4000-8000-000000000002'),
  'Denied stale acceptance leaves the congregation A invitation untouched'
);
select ok(
  (select state='active' and ended_at is null from public.v7_mentor_pairs where id='b4000000-0000-4000-8000-000000000003'),
  'Denied stale ending leaves the congregation A active pair untouched'
);
select is(
  (select count(*)::integer from public.v7_pair_events where pair_id='b4000000-0000-4000-8000-000000000002'),
  1,
  'Denied stale acceptance adds no audit event beyond the original invitation'
);
select is(
  (select count(*)::integer from public.v7_pair_events where pair_id='b4000000-0000-4000-8000-000000000003'),
  0,
  'Denied stale ending adds no audit event to the active fixture'
);

-- The participant who stayed in A can still close the relationship. This is
-- deliberate safe cleanup; it does not restore any authority to the departed mentor.
set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select is(
  (public.bible_v7_transition_mentor_pair('b4000000-0000-4000-8000-000000000003','end')).state,
  'ended',
  'Remaining current congregation A mentee can safely end the active pair'
);

reset role;
select ok(
  (select state='ended' and ended_at is not null from public.v7_mentor_pairs where id='b4000000-0000-4000-8000-000000000003'),
  'Current-member close-out commits the ended state'
);
select is(
  (select actor_id from public.v7_pair_events where pair_id='b4000000-0000-4000-8000-000000000003' and event_type='ended'),
  '11111111-1111-4111-8111-111111111112'::uuid,
  'Pair close-out audit event is owned by the remaining current mentee'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';
select is(
  pg_temp.v7_pair_rpc_sqlstate($sql$select * from public.bible_v7_transition_mentor_pair('b4000000-0000-4000-8000-000000000003','end')$sql$),
  '42501',
  'Switched mentor still cannot replay stale congregation A ending after current-member close-out'
);

reset role;
select * from finish();
rollback;