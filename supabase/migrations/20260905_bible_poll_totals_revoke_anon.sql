revoke execute on function public.bible_poll_totals(uuid) from anon;
revoke execute on function public.bible_poll_totals(uuid) from public;
grant execute on function public.bible_poll_totals(uuid) to authenticated;
