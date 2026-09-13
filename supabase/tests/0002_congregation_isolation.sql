-- V5 Lab A2 executable caller-context RLS characterization.
-- Requires fixtures/0001_two_congregations.sql and a disposable local database.

begin;

-- Member A must see only congregation A.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

do $$
declare
  visible_ids uuid[];
begin
  select coalesce(array_agg(id order by id), '{}'::uuid[])
    into visible_ids
  from public.bible_congregations;

  if visible_ids <> array['aaaaaaaa-0000-0000-0000-000000000001'::uuid] then
    raise exception 'member A congregation visibility mismatch: %', visible_ids;
  end if;

  if not private.is_bible_congregation_member('aaaaaaaa-0000-0000-0000-000000000001'::uuid) then
    raise exception 'member A is not recognized as member of congregation A';
  end if;

  if private.is_bible_congregation_member('bbbbbbbb-0000-0000-0000-000000000001'::uuid) then
    raise exception 'member A leaked membership into congregation B';
  end if;
end
$$;

reset role;

-- Member B must see only congregation B.
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

do $$
declare
  visible_ids uuid[];
begin
  select coalesce(array_agg(id order by id), '{}'::uuid[])
    into visible_ids
  from public.bible_congregations;

  if visible_ids <> array['bbbbbbbb-0000-0000-0000-000000000001'::uuid] then
    raise exception 'member B congregation visibility mismatch: %', visible_ids;
  end if;

  if private.is_bible_congregation_member('aaaaaaaa-0000-0000-0000-000000000001'::uuid) then
    raise exception 'member B leaked membership into congregation A';
  end if;

  if not private.is_bible_congregation_member('bbbbbbbb-0000-0000-0000-000000000001'::uuid) then
    raise exception 'member B is not recognized as member of congregation B';
  end if;
end
$$;

reset role;

-- An authenticated outsider must see neither congregation.
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count from public.bible_congregations;
  if visible_count <> 0 then
    raise exception 'outsider can see % congregation rows', visible_count;
  end if;

  if private.is_bible_congregation_member('aaaaaaaa-0000-0000-0000-000000000001'::uuid)
     or private.is_bible_congregation_member('bbbbbbbb-0000-0000-0000-000000000001'::uuid) then
    raise exception 'outsider is incorrectly recognized as congregation member';
  end if;
end
$$;

reset role;
rollback;
