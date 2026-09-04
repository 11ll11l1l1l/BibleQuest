-- Production parity: Live BibleQuest Rooms insert session_type='live-room'.
-- The live RLS policy already restricts creation of that type to facilitator/leader/admin,
-- but the older table CHECK constraint did not include the value, making valid room creation fail.
-- Keep the existing allowed session types and add only the production live-room type.

do $$
begin
  if to_regclass('public.bible_shared_sessions') is null then
    raise exception 'Expected BibleQuest table public.bible_shared_sessions is missing';
  end if;

  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bible_shared_sessions'::regclass
      and conname = 'bible_shared_sessions_session_type_check'
      and pg_get_constraintdef(oid) not like '%live-room%'
  ) then
    alter table public.bible_shared_sessions
      drop constraint bible_shared_sessions_session_type_check;

    alter table public.bible_shared_sessions
      add constraint bible_shared_sessions_session_type_check
      check (session_type in (
        'team_sprint',
        'detective',
        'verse_hunt',
        'conversation_circle',
        'wisdom_table',
        'pair_share',
        'couples',
        'poll',
        'other',
        'live-room'
      ));
  end if;
end
$$;
