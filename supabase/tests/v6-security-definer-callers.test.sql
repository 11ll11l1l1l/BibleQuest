begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

select ok(
  (select prosecdef from pg_proc where oid='private.is_bible_congregation_member(uuid)'::regprocedure),
  'membership helper remains SECURITY DEFINER'
);
select ok(
  coalesce((select array_to_string(proconfig, ',') like '%search_path=%' from pg_proc where oid='private.is_bible_congregation_member(uuid)'::regprocedure), false),
  'membership helper pins search_path'
);
select ok(
  not has_function_privilege('anon', 'private.is_bible_congregation_member(uuid)', 'EXECUTE'),
  'anonymous caller cannot execute membership helper'
);
select ok(
  has_function_privilege('authenticated', 'private.is_bible_congregation_member(uuid)', 'EXECUTE'),
  'authenticated caller may execute bounded membership helper'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111112';
select ok(
  private.is_bible_congregation_member('10000000-0000-4000-8000-000000000001'::uuid),
  'Member A executes SECURITY DEFINER helper for own congregation'
);
select ok(
  not private.is_bible_congregation_member('20000000-0000-4000-8000-000000000002'::uuid),
  'Member A SECURITY DEFINER execution denies foreign congregation'
);

set local "request.jwt.claim.sub" = '22222222-2222-4222-8222-222222222222';
select ok(
  private.is_bible_congregation_member('20000000-0000-4000-8000-000000000002'::uuid),
  'Member B executes SECURITY DEFINER helper for own congregation'
);
select ok(
  not private.is_bible_congregation_member('10000000-0000-4000-8000-000000000001'::uuid),
  'Member B SECURITY DEFINER execution denies foreign congregation'
);

reset role;
select * from finish();
rollback;
