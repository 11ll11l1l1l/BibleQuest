-- BibleQuest immediate-registration recovery hardening.
-- Recovery codes are server-only, hashed, rotated after use, and independent of SMTP/email confirmation.

alter table public.bible_password_reset_codes
  add column if not exists locked_until timestamptz,
  add column if not exists last_attempt_at timestamptz;

alter table public.bible_password_reset_codes enable row level security;
revoke all on table public.bible_password_reset_codes from anon, authenticated;
grant select, insert, update, delete on table public.bible_password_reset_codes to service_role;

create index if not exists bible_password_reset_active_email_idx
  on public.bible_password_reset_codes (email_hash, created_at desc)
  where used_at is null;

comment on table public.bible_password_reset_codes is
  'Server-only BibleQuest recovery codes. Codes are hashed; email is an unverified sign-in identifier.';
