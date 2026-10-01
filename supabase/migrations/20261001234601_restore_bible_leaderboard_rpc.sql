-- Restore the production leaderboard RPC to the reproducible V6 migration chain.
-- The function is intentionally SECURITY INVOKER so bible_score_events RLS
-- remains authoritative for every authenticated caller.

create or replace function public.bible_leaderboard(
  p_congregation uuid,
  p_since timestamptz default null
)
returns table (
  user_id uuid,
  category text,
  points bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.user_id, e.category, sum(e.points)::bigint as points
  from public.bible_score_events e
  where e.congregation_id = p_congregation
    and (p_since is null or e.created_at >= p_since)
  group by e.user_id, e.category;
$$;

revoke all on function public.bible_leaderboard(uuid, timestamptz) from public;
revoke all on function public.bible_leaderboard(uuid, timestamptz) from anon;
grant execute on function public.bible_leaderboard(uuid, timestamptz) to authenticated, service_role;
