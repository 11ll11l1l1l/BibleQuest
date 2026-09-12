-- BibleQuest V4 release hardening: privileged poll aggregation must not run
-- as SECURITY DEFINER from the exposed public API schema.
--
-- Keep the existing RPC names, parameter names, return shapes, and visibility
-- rules. Only the privileged row reads move behind the non-exposed private
-- schema. Public RPCs remain stable PostgREST endpoints and run as invokers.

create or replace function private.bible_poll_totals_impl(p_poll uuid)
returns table(option_index integer,total bigint)
language sql
stable
security definer
set search_path=''
as $$
  select v.option_index,count(*)::bigint
  from public.bible_poll_votes v
  join public.bible_polls p on p.id=v.poll_id
  where v.poll_id=p_poll
    and p.active=true
    and exists (
      select 1 from public.bible_congregation_members m
      where m.congregation_id=p.congregation_id
        and m.user_id=(select auth.uid())
        and m.active=true
    )
  group by v.option_index
  order by v.option_index;
$$;

revoke all on function private.bible_poll_totals_impl(uuid) from public,anon;
grant execute on function private.bible_poll_totals_impl(uuid) to authenticated;

create or replace function public.bible_poll_totals(p_poll uuid)
returns table(option_index integer,total bigint)
language sql
stable
security invoker
set search_path=''
as $$
  select * from private.bible_poll_totals_impl(p_poll);
$$;

revoke all on function public.bible_poll_totals(uuid) from public,anon;
grant execute on function public.bible_poll_totals(uuid) to authenticated;

comment on function public.bible_poll_totals(uuid) is
  'Authenticated SECURITY INVOKER RPC. Delegates privacy-safe vote totals to a non-exposed private implementation.';

create or replace function private.bible_poll_aggregate_v2_impl(p_poll uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  p record;
  r text;
  out jsonb;
  opts jsonb;
  i int;
  total int;
  score numeric;
begin
  select * into p from public.bible_polls where id=p_poll;
  if p.id is null or not private.is_bible_congregation_member(p.congregation_id) then
    return '[]'::jsonb;
  end if;

  r:=private.bible_role_in_congregation(p.congregation_id);
  if p.results_visibility='leader_only'
     and r<>all(array['facilitator','leader','pastor','admin']) then
    return '[]'::jsonb;
  end if;
  if p.results_visibility='hidden_until_close'
     and (p.closes_at is null or p.closes_at>now())
     and r<>all(array['facilitator','leader','pastor','admin']) then
    return '[]'::jsonb;
  end if;

  opts:=coalesce(p.options,'[]'::jsonb);
  out:='[]'::jsonb;

  if p.poll_type in('single','yes_no','discussion') then
    for i in 0..greatest(jsonb_array_length(opts)-1,-1) loop
      select count(*) into total
      from public.bible_poll_votes
      where poll_id=p_poll and option_index=i;
      out:=out||jsonb_build_array(jsonb_build_object(
        'option_index',i,'label',opts->>i,'total',total,'score',total
      ));
    end loop;
  elsif p.poll_type='multi' then
    for i in 0..greatest(jsonb_array_length(opts)-1,-1) loop
      select count(*) into total
      from public.bible_poll_responses
      where poll_id=p_poll
        and coalesce(response->'choices','[]'::jsonb)@>jsonb_build_array(i);
      out:=out||jsonb_build_array(jsonb_build_object(
        'option_index',i,'label',opts->>i,'total',total,'score',total
      ));
    end loop;
  elsif p.poll_type='ranked' then
    for i in 0..greatest(jsonb_array_length(opts)-1,-1) loop
      select coalesce(sum(greatest(jsonb_array_length(opts)-x.ord+1,0)),0)::numeric
      into score
      from public.bible_poll_responses pr
      cross join lateral jsonb_array_elements_text(
        coalesce(pr.response->'rank','[]'::jsonb)
      ) with ordinality x(val,ord)
      where pr.poll_id=p_poll and x.val::int=i;

      select count(*) into total
      from public.bible_poll_responses pr
      where pr.poll_id=p_poll and(pr.response->'rank'->>0)::int=i;

      out:=out||jsonb_build_array(jsonb_build_object(
        'option_index',i,'label',opts->>i,'total',total,'score',score
      ));
    end loop;
  end if;

  return out;
end $$;

revoke all on function private.bible_poll_aggregate_v2_impl(uuid) from public,anon;
grant execute on function private.bible_poll_aggregate_v2_impl(uuid) to authenticated,service_role;

-- The existing public RPC explicitly supports service_role. It currently has no
-- USAGE on private, so grant schema visibility to that already-privileged backend
-- role without granting any additional table privileges.
grant usage on schema private to service_role;

create or replace function public.bible_poll_aggregate_v2(p_poll uuid)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select private.bible_poll_aggregate_v2_impl(p_poll);
$$;

revoke all on function public.bible_poll_aggregate_v2(uuid) from public,anon;
grant execute on function public.bible_poll_aggregate_v2(uuid) to authenticated,service_role;

comment on function public.bible_poll_aggregate_v2(uuid) is
  'Authenticated/service-role SECURITY INVOKER RPC. Delegates scoped advanced poll aggregation to a non-exposed private implementation.';
