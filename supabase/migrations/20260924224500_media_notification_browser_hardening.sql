-- BibleQuest V6 S2: tighten Notification Center mutation privileges and
-- preserve trigger-only execution for media notification production.
--
-- The browser Notification Center only mutates read_at. RLS already constrains
-- rows by user_id, but the generic browser-grant parity migration grants the
-- whole UPDATE operation whenever an UPDATE policy exists. Narrow the table
-- privilege to the single field the released client actually writes.
revoke update on table public.bible_notifications from authenticated;
grant update (read_at) on table public.bible_notifications to authenticated;

-- This SECURITY DEFINER routine exists only as an INSERT trigger. It has a
-- pinned empty search_path and fully-qualified data references; direct browser
-- execution is unnecessary and should remain impossible.
revoke all on function private.bible_notify_new_media()
  from public, anon, authenticated;

comment on function private.bible_notify_new_media() is
  'Trigger-only media notification producer. Browser roles have no direct EXECUTE privilege.';
