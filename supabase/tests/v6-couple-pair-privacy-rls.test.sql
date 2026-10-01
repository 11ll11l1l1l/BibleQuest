begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

-- Couples are intentionally pair-scoped rather than congregation-scoped.
-- Pair A deliberately links one member of congregation A with one member of
-- congregation B to prove that explicit spouse pairing is the authority
-- boundary, not implicit tenant membership.
insert into public.bible_couple_pairs (
  id,user_a,user_b,status,created_at,updated_at
) values
  (
    'c1100000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    '22222222-2222-4222-8222-222222222222',
    'active',now(),now()
  ),
  (
    'c1200000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111113',
    'active',now(),now()
  )
on conflict (id) do nothing;

insert into public.bible_couple_shared (
  id,pair_id,author_id,item_type,body
) values
  (
    'c1110000-0000-4000-8000-000000000001',
    'c1100000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    'commitment',
    'Cross-congregation pair fixture authored by Member A'
  ),
  (
    'c1110000-0000-4000-8000-000000000002',
    'c1100000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    'journey',
    'Cross-congregation pair fixture authored by Member B'
  ),
  (
    'c1220000-0000-4000-8000-000000000001',
    'c1200000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'commitment',
    'Unrelated pair fixture'
  )
on conflict (id) do nothing;

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_couple_pairs'::regclass),
  'couple pairs keep RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_couple_invites'::regclass),
  'couple invites keep RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_couple_shared'::regclass),
  'couple shared history keeps RLS enabled'
);

select ok(
  not has_table_privilege('anon','public.bible_couple_pairs','SELECT')
  and not has_table_privilege('anon','public.bible_couple_invites','SELECT')
  and not has_table_privilege('anon','public.bible_couple_shared','SELECT'),
  'anonymous callers cannot read pair, invite, or shared couple state'
);

select ok(
  not has_table_privilege('authenticated','public.bible_couple_invites','SELECT')
  and not has_table_privilege('authenticated','public.bible_couple_invites','INSERT')
  and not has_table_privilege('authenticated','public.bible_couple_invites','UPDATE')
  and not has_table_privilege('authenticated','public.bible_couple_invites','DELETE'),
  'browser-authenticated callers cannot access couple invite secrets directly'
);

select ok(
  has_table_privilege('authenticated','public.bible_couple_pairs','SELECT')
  and not has_table_privilege('authenticated','public.bible_couple_pairs','INSERT')
  and not has_table_privilege('authenticated','public.bible_couple_pairs','UPDATE')
  and not has_table_privilege('authenticated','public.bible_couple_pairs','DELETE'),
  'browser-authenticated pair metadata is read-only and RLS-scoped'
);

select ok(
  has_table_privilege('authenticated','public.bible_couple_shared','SELECT')
  and has_table_privilege('authenticated','public.bible_couple_shared','INSERT')
  and not has_table_privilege('authenticated','public.bible_couple_shared','UPDATE')
  and not has_table_privilege('authenticated','public.bible_couple_shared','DELETE'),
  'couple shared history is append-only for browser-authenticated callers'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select id
    from public.bible_couple_pairs
    where id in (
      'c1100000-0000-4000-8000-000000000001'::uuid,
      'c1200000-0000-4000-8000-000000000002'::uuid
    )
    order by id$$,
  array['c1100000-0000-4000-8000-000000000001'::uuid],
  'Member A sees only the explicit pair that contains Member A'
);

select results_eq(
  $$select id
    from public.bible_couple_shared
    where pair_id='c1100000-0000-4000-8000-000000000001'::uuid
    order by id$$,
  array[
    'c1110000-0000-4000-8000-000000000001'::uuid,
    'c1110000-0000-4000-8000-000000000002'::uuid
  ],
  'Member A reads both partners shared history inside the explicit cross-congregation pair'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_couple_shared
    where pair_id='c1200000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot read an unrelated pair even when that pair is inside congregation A'
);

select lives_ok(
  $$insert into public.bible_couple_shared(
      pair_id,author_id,item_type,body
    ) values (
      'c1100000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      'commitment',
      'Member A authored shared entry'
    )$$,
  'Member A can append their own shared item to the active explicit pair'
);

select throws_ok(
  $$insert into public.bible_couple_shared(
      pair_id,author_id,item_type,body
    ) values (
      'c1100000-0000-4000-8000-000000000001',
      '22222222-2222-4222-8222-222222222222',
      'commitment',
      'Spoofed Member B author'
    )$$,
  '42501',
  null,
  'Member A cannot spoof Member B as the shared-item author'
);

select throws_ok(
  $$insert into public.bible_couple_shared(
      pair_id,author_id,item_type,body
    ) values (
      'c1200000-0000-4000-8000-000000000002',
      '11111111-1111-4111-8111-111111111112',
      'commitment',
      'Unrelated pair write'
    )$$,
  '42501',
  null,
  'Member A cannot append history to an unrelated active pair'
);

select throws_ok(
  $$update public.bible_couple_shared
    set body='Browser rewrite must fail'
    where id='c1110000-0000-4000-8000-000000000001'::uuid$$,
  '42501',
  null,
  'pair members cannot rewrite append-only shared history'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';

select results_eq(
  $$select id
    from public.bible_couple_pairs
    where id='c1100000-0000-4000-8000-000000000001'::uuid$$,
  array['c1100000-0000-4000-8000-000000000001'::uuid],
  'Member B sees the same explicit cross-congregation pair'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_couple_shared
    where pair_id='c1100000-0000-4000-8000-000000000001'::uuid$$,
  array[3::bigint],
  'Member B sees shared history authored by both partners in the explicit pair'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select results_eq(
  $$select id
    from public.bible_couple_pairs
    where id in (
      'c1100000-0000-4000-8000-000000000001'::uuid,
      'c1200000-0000-4000-8000-000000000002'::uuid
    )
    order by id$$,
  array['c1200000-0000-4000-8000-000000000002'::uuid],
  'Leader A sees only the pair that explicitly contains Leader A'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_couple_pairs
    where id='c1100000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'congregation leadership does not grant access to another member couple pair'
);

select results_eq(
  $$select id
    from public.bible_couple_shared
    where pair_id='c1200000-0000-4000-8000-000000000002'::uuid$$,
  array['c1220000-0000-4000-8000-000000000001'::uuid],
  'Leader A reads only the shared history of Leader A own explicit pair'
);

set local "request.jwt.claim.sub"='99999999-9999-4999-8999-999999999999';

select results_eq(
  $$select
      (select count(*)::bigint from public.bible_couple_pairs
       where id in (
         'c1100000-0000-4000-8000-000000000001'::uuid,
         'c1200000-0000-4000-8000-000000000002'::uuid
       )),
      (select count(*)::bigint from public.bible_couple_shared
       where pair_id in (
         'c1100000-0000-4000-8000-000000000001'::uuid,
         'c1200000-0000-4000-8000-000000000002'::uuid
       ))$$,
  $$values (0::bigint,0::bigint)$$,
  'platform Owner receives no implicit bypass into private couple pair data'
);

reset role;
select * from finish();
rollback;
