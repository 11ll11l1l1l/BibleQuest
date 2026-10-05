begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select lives_ok($sql$
  insert into public.v7_mentor_pairs(id,congregation_id,mentor_id,mentee_id,initiated_by)
  values ('8f000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111112',
    '11111111-1111-4111-8111-111111111111')
  returning id,congregation_id,mentor_id,mentee_id,state
$sql$,'Authenticated invitation acknowledges its inserted row through RETURNING');
select is((select state from public.v7_mentor_pairs where id='8f000000-0000-4000-8000-000000000001'),'invited','Acknowledgement preserves invited state');

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select is((select count(*)::integer from public.v7_mentor_pairs where id='8f000000-0000-4000-8000-000000000001'),1,'Named mentee can read the invitation');

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';
select is((select count(*)::integer from public.v7_mentor_pairs where id='8f000000-0000-4000-8000-000000000001'),0,'Same-congregation reviewer cannot read someone else''s pair');

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222221';
select is((select count(*)::integer from public.v7_mentor_pairs where id='8f000000-0000-4000-8000-000000000001'),0,'Foreign administrator cannot read the invitation');

reset role;
select * from finish();
rollback;
