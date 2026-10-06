begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

create function pg_temp.v7_discovery_sqlstate(statement text)
returns text language plpgsql security invoker as $bq$
begin
  execute statement;
  return '00000';
exception when others then
  return sqlstate;
end;
$bq$;

select ok(
  exists (
    select 1 from pg_constraint
    where conrelid='public.v7_library_taxonomy'::regclass
      and conname='v7_library_taxonomy_discovery_namespace_check'
  ),
  'Discovery taxonomy namespace constraint exists'
);
select ok(
  to_regclass('public.v7_library_revision_taxonomy_taxonomy_revision_idx') is not null,
  'Taxonomy-first revision lookup index exists'
);
select ok(
  to_regclass('public.v7_library_taxonomy_kind_id_idx') is not null,
  'Taxonomy kind/id index exists'
);

insert into public.v7_library_taxonomy(id,kind,labels,congregation_id,created_by) values
 ('emotion.anxious','emotion','{"en":"Anxious"}',null,'11111111-1111-4111-8111-111111111111'),
 ('need.peace','need','{"en":"Peace"}',null,'11111111-1111-4111-8111-111111111111'),
 ('topic.prayer','topic','{"en":"Prayer"}',null,'11111111-1111-4111-8111-111111111111'),
 ('life_situation.work_stress','life_situation','{"en":"Work stress"}',null,'11111111-1111-4111-8111-111111111111');

select lives_ok(
  $$insert into public.v7_library_taxonomy(id,kind,labels,congregation_id,created_by)
    values('emotion.afraid','emotion','{"en":"Afraid"}',null,'11111111-1111-4111-8111-111111111111')$$,
  'Canonical discovery taxonomy IDs can be persisted'
);
select is(
  pg_temp.v7_discovery_sqlstate($sql$
    insert into public.v7_library_taxonomy(id,kind,labels,congregation_id,created_by)
    values('worried','emotion','{"en":"Worried alias"}',null,'11111111-1111-4111-8111-111111111111')
  $sql$),
  '23514',
  'Alias or non-namespaced emotion IDs cannot be persisted'
);

update public.bible_congregation_members set active=false
where user_id='11111111-1111-4111-8111-111111111112';
update public.bible_congregation_members set role='member',active=true
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111112';

insert into public.v7_library_items(id,content_type,congregation_id,publication_state,current_revision_id,created_by) values
 ('a3500000-0000-4000-8000-000000000001','devotional','10000000-0000-4000-8000-000000000001','published','a3510000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111'),
 ('a3500000-0000-4000-8000-000000000002','devotional','20000000-0000-4000-8000-000000000002','published','a3510000-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222221'),
 ('a3500000-0000-4000-8000-000000000003','devotional',null,'published','a3510000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111');

insert into public.v7_library_revisions(
  id,item_id,revision_number,source_locale,title,source_kind,source_title,source_catalog_id,
  rights_status,rights_holder,rights_basis,attribution,allowed_uses,publication_state,
  review_status,reviewer_id,reviewed_at,created_by
) values
 ('a3510000-0000-4000-8000-000000000001','a3500000-0000-4000-8000-000000000001',1,'en','A discovery devotional','first_party','A','catalog:a3-query-a','verified','BibleQuest','original work','','["display"]','published','approved','11111111-1111-4111-8111-111111111111',now(),'11111111-1111-4111-8111-111111111111'),
 ('a3510000-0000-4000-8000-000000000002','a3500000-0000-4000-8000-000000000002',1,'en','B discovery devotional','first_party','B','catalog:a3-query-b','verified','BibleQuest','original work','','["display"]','published','approved','22222222-2222-4222-8222-222222222221',now(),'22222222-2222-4222-8222-222222222221'),
 ('a3510000-0000-4000-8000-000000000003','a3500000-0000-4000-8000-000000000003',1,'en','Global partial devotional','licensed','Global','catalog:a3-query-global','verified','Rights Holder','public domain','','["display"]','published','approved','11111111-1111-4111-8111-111111111111',now(),'11111111-1111-4111-8111-111111111111');

insert into public.v7_library_revision_taxonomy(revision_id,taxonomy_id,display_order) values
 ('a3510000-0000-4000-8000-000000000001','emotion.anxious',0),
 ('a3510000-0000-4000-8000-000000000001','need.peace',0),
 ('a3510000-0000-4000-8000-000000000001','topic.prayer',0),
 ('a3510000-0000-4000-8000-000000000001','life_situation.work_stress',0),
 ('a3510000-0000-4000-8000-000000000002','emotion.afraid',0),
 ('a3510000-0000-4000-8000-000000000002','need.peace',0),
 ('a3510000-0000-4000-8000-000000000002','topic.prayer',0),
 ('a3510000-0000-4000-8000-000000000002','life_situation.work_stress',0),
 ('a3510000-0000-4000-8000-000000000003','emotion.anxious',0);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq($q$
  select count(distinct i.id)::bigint
  from public.v7_library_items i
  join public.v7_library_revisions r on r.id=i.current_revision_id
  where i.publication_state='published'
    and exists (
      select 1 from public.v7_library_revision_taxonomy x
      where x.revision_id=r.id and x.taxonomy_id in ('emotion.anxious','emotion.afraid')
    )
    and exists (
      select 1 from public.v7_library_revision_taxonomy x
      where x.revision_id=r.id and x.taxonomy_id in ('need.peace')
    )
    and exists (
      select 1 from public.v7_library_revision_taxonomy x
      where x.revision_id=r.id and x.taxonomy_id in ('topic.prayer')
    )
    and exists (
      select 1 from public.v7_library_revision_taxonomy x
      where x.revision_id=r.id and x.taxonomy_id in ('life_situation.work_stress')
    )
$q$, array[1::bigint], 'Member A discovery query is OR-within and AND-across without leaking B');

select results_eq(
  $$select count(*)::bigint from public.v7_library_items where id='a3500000-0000-4000-8000-000000000002'$$,
  array[0::bigint],
  'Member A cannot force the matching congregation B devotional by item ID'
);

select results_eq($q$
  select count(*)::bigint
  from public.v7_library_items i
  join public.v7_library_revisions r on r.id=i.current_revision_id
  where i.id='a3500000-0000-4000-8000-000000000003'
    and exists (select 1 from public.v7_library_revision_taxonomy x where x.revision_id=r.id and x.taxonomy_id='emotion.anxious')
    and exists (select 1 from public.v7_library_revision_taxonomy x where x.revision_id=r.id and x.taxonomy_id='need.peace')
$q$, array[0::bigint], 'Global item missing one selected dimension does not satisfy AND-across semantics');

reset role;
update public.bible_congregation_members set active=false
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111112';
insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values('20000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111112','member','A3 Query Switched Member',true)
on conflict(congregation_id,user_id) do update set role='member',display_name='A3 Query Switched Member',active=true;

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq($q$
  select count(distinct i.id)::bigint
  from public.v7_library_items i
  join public.v7_library_revisions r on r.id=i.current_revision_id
  where i.publication_state='published'
    and exists (
      select 1 from public.v7_library_revision_taxonomy x
      where x.revision_id=r.id and x.taxonomy_id in ('emotion.anxious','emotion.afraid')
    )
    and exists (
      select 1 from public.v7_library_revision_taxonomy x
      where x.revision_id=r.id and x.taxonomy_id='need.peace'
    )
    and exists (
      select 1 from public.v7_library_revision_taxonomy x
      where x.revision_id=r.id and x.taxonomy_id='topic.prayer'
    )
    and exists (
      select 1 from public.v7_library_revision_taxonomy x
      where x.revision_id=r.id and x.taxonomy_id='life_situation.work_stress'
    )
$q$, array[1::bigint], 'Same identity after A to B switch sees only the B discovery match');

select results_eq(
  $$select count(*)::bigint from public.v7_library_items where id='a3500000-0000-4000-8000-000000000001'$$,
  array[0::bigint],
  'Switched member cannot force the stale congregation A discovery match'
);

reset role;
select * from finish();
rollback;
