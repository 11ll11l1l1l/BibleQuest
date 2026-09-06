-- BibleQuest production permission hardening.
-- Server-only tables are intentionally reachable only through service-role Edge Functions.
-- bible_app_access remains readable by the signed-in owner of each row through its RLS policy.

revoke all privileges on table public.bible_app_access from anon, authenticated;
grant select on table public.bible_app_access to authenticated;

revoke all privileges on table public.bible_admin_audit_log from anon, authenticated;
revoke all privileges on table public.bible_password_reset_codes from anon, authenticated;
revoke all privileges on table public.bible_signup_limits from anon, authenticated;
revoke all privileges on table public.bible_congregation_invites from anon, authenticated;
revoke all privileges on table public.bible_couple_invites from anon, authenticated;

comment on table public.bible_admin_audit_log is 'BibleQuest server-only admin audit log. Browser roles have no direct table privileges.';
comment on table public.bible_password_reset_codes is 'Legacy BibleQuest recovery-code table retained for audit/history; direct browser access is disabled and the live app uses Supabase Auth email recovery.';
comment on table public.bible_signup_limits is 'BibleQuest server-only signup abuse-control state; browser roles have no direct table privileges.';
comment on table public.bible_congregation_invites is 'BibleQuest congregation invite secrets; accessed through trusted Edge Functions, not browser table access.';
comment on table public.bible_couple_invites is 'BibleQuest couple invite secrets; accessed through trusted Edge Functions, not browser table access.';
