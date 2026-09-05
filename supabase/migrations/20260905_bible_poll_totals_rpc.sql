create or replace function public.bible_poll_totals(p_poll uuid)
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
revoke all on function public.bible_poll_totals(uuid) from public;
grant execute on function public.bible_poll_totals(uuid) to authenticated;