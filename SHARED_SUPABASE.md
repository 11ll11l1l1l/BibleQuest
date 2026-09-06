# Shared Supabase Architecture

BibleQuest and Karimen intentionally share Supabase project `zkfmgezvzugchcwppreq` to remain within the Free-plan two-active-project limit.

## Isolation

Karimen owns its existing tables such as `exam_results` and `live_exams`.
BibleQuest owns only objects prefixed with `bible_` plus `private.is_bible_congregation_member` and Edge Functions prefixed with `bq-`.

Do not rename, drop, or repurpose Karimen objects for BibleQuest.
Do not store immutable Bible text packs in Supabase; open/static Scripture resources remain repository assets or approved on-demand external sources and are served by the web deployment.

## Production web hosts

Cloudflare Pages is the primary BibleQuest web platform. This repository is currently connected to two Cloudflare Pages projects and both deploy current `main`:

- Canonical URL: `https://mybiblequest.pages.dev/`
- Compatibility URL: `https://biblequest-7th.pages.dev/`
- Preview URLs may use subdomains of either project, such as `https://<deployment>.mybiblequest.pages.dev/` or `https://<deployment>.biblequest-7th.pages.dev/`.
- The legacy GitHub Pages route may remain as a compatibility fallback but is not the canonical production URL.

## BibleQuest cloud objects

- Auth users: shared Supabase Auth service, referenced by BibleQuest `bible_*` tables only.
- Profiles, mastery and attempts: `bible_profiles`, `bible_mastery`, `bible_attempts`.
- Progress/device state: `bible_progress_snapshots`, `bible_devices`, `bible_daily_journey_status`.
- Congregations and membership: `bible_congregations`, `bible_congregation_members`, `bible_congregation_invites`.
- Teams/shared play: `bible_teams`, `bible_team_members`, `bible_shared_sessions`, `bible_session_participants`.
- Groups/live rooms/assignments/couples/challenges use their corresponding `bible_*` tables.
- Trusted rankings: `bible_score_events`, `bible_leaderboard`.
- Awards: `bible_badge_catalog`, `bible_user_badges`.
- Admin access/audit: `bible_app_access`, `bible_admin_audit_log`.
- Signup abuse control: `bible_signup_limits`.
- Password recovery state: `bible_password_reset_codes`; only hashes are stored and browser roles have no direct access.
- Trusted server actions include `bq-create-congregation`, `bq-join`, `bq-invite`, `bq-score`, `bq-couple`, `bq-room-poll`, `bq-assignment`, `bq-journey-group`, `bq-admin`, `bq-signup`, and `bq-password-reset`.

## Security rules

- All browser-facing BibleQuest tables use RLS.
- Browser clients receive only the Supabase publishable key; service-role/secret keys remain inside trusted Edge Functions.
- Server-only secret/audit tables such as congregation/couple invite secrets, signup limits, recovery-code rows and the admin audit log have no direct `anon`/`authenticated` table privileges.
- `bible_app_access` grants signed-in users `SELECT` only; RLS restricts that read to the user's own access row. Role mutation is performed by `bq-admin`.
- `bible_score_events`, earned cloud badges and invite hashes cannot be written directly by normal browser clients.
- Competitive points are derived and capped by the `bq-score` Edge Function.
- Facilitators may submit delegated points only for approved group activities.
- Do not add permissive RLS policies merely to silence the Supabase `RLS enabled, no policy` advisor for intentionally server-only tables.
- The Free-plan project currently reports leaked-password protection disabled. Treat that as a known platform/security limitation; do not claim a client-only check provides equivalent protection.

## Authentication and recovery configuration

BibleQuest intentionally does **not** depend on email confirmation or SMTP password-reset messages.

Registration flow:

1. The browser collects name, preferred name, optional church group, avatar, email, password and password confirmation.
2. The browser invokes `bq-signup`.
3. `bq-signup` validates/rate-limits the request and creates the Auth user with `email_confirm:true` so the account is immediately usable without sending an email.
4. The email is marked conceptually as an unverified sign-in identifier; it is not proof that the user owns that address.
5. `bq-signup` creates a random recovery code, stores only its hash plus a hashed email lookup in `bible_password_reset_codes`, and returns the one-time plaintext code to the new user.
6. The English onboarding tutorial requires the user to save the recovery code.

Forgotten-password flow:

- `reset.html` / `reset.js` invokes `bq-password-reset` with sign-in email, recovery code, new password and confirmation.
- Incorrect recovery attempts are rate-limited and the code has per-record lockout protection.
- A successful reset consumes the old code, changes the password server-side and returns a newly rotated recovery code.
- A signed-in user may generate a replacement code from Account → Security; this invalidates the previous active code.
- Administrators cannot view recovery codes and `bq-admin` deliberately rejects legacy email-reset or admin-issued reset-code actions.

Because the production recovery path does not use emailed links, Supabase Auth Site URL/redirect configuration and SMTP are not release dependencies for BibleQuest's current signup/recovery architecture. A future feature that introduces email verification or emailed links would need a separately reviewed SMTP/redirect design rather than silently reusing old code.

## Edge Function exposure

`bq-signup` and `bq-password-reset` intentionally allow unauthenticated entry because signup and forgotten-password recovery start without a session. They therefore must retain their own origin checks, input validation, rate limits, code hashing and recovery lockout safeguards.

Other privileged `bq-*` functions should require JWT authentication unless their design explicitly provides an equivalent trusted boundary. `bq-admin` requires JWT authentication and verifies the caller's BibleQuest owner/admin role.

## Source-of-truth rule

Production schema/function changes must be represented in this repository. Database DDL belongs in `supabase/migrations/`; deployed Edge Function source belongs in `supabase/functions/`. A live-only change is deployment drift and should be reconciled before release.

Current recovery source-of-truth includes `supabase/migrations/20260905_account_recovery_code_v2.sql`, `supabase/functions/bq-signup/index.ts`, and `supabase/functions/bq-password-reset/index.ts`.
