alter table public.bible_content_decisions drop constraint if exists bible_content_decisions_decision_check;
alter table public.bible_content_decisions add constraint bible_content_decisions_decision_check
  check (decision = any (array['include'::text,'exempt'::text,'remove'::text,'delete'::text]));
comment on column public.bible_content_decisions.decision is
  'include=approved, exempt=keep quarantined, remove=hidden/rejected, delete=permanently retired from congregation content while audit snapshot is retained';
