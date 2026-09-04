# Shared Supabase Architecture

BibleQuest and Karimen intentionally share Supabase project `zkfmgezvzugchcwppreq` to remain within the Free-plan two-active-project limit.

## Isolation

Karimen owns its existing tables such as `exam_results` and `live_exams`.
BibleQuest owns only objects prefixed with `bible_` plus `private.is_bible_congregation_member` and Edge Functions prefixed with `bq-`.

Do not rename, drop, or repurpose Karimen objects for BibleQuest.
Do not store immutable Bible text packs in Supabase; open/static Scripture resources remain repository assets or approved on-demand external sources and are served by the web deployment.

## Production web hosts

Cloudflare Pages is the primary BibleQuest web platform. This repository is currently connected to two Cloudflare Pages projects:

- Canonical URL: `https://mybiblequest.pages.dev/`
- Compatibility URL: `https://biblequest-7th.pages.dev/`
- Preview URLs may use subdomains of either project, such as `https://<deployment>.mybiblequest.pages.dev/` or `https://<deployment>.biblequest-7th.pages.dev/`.
- The legacy GitHub Pages route may remain as a compatibility fallback but is not the canonical production URL.

`cloud-config.js` derives the app root from the page actually running BibleQuest instead of pinning one deployment host.

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
- The Free-plan project cannot enable Supabase leaked-password protection; keep this as a known platform limitation rather than implementing a fake client-only substitute for the server-side HaveIBeenPwned protection.

## Authentication and recovery configuration

BibleQuest currently uses **instant email/password registration with recovery codes**, not email-link activation or SMTP password-reset links.

- Browser account creation calls `bq-signup`.
- `bq-signup` is intentionally deployed with `verify_jwt=false` because the caller does not have an account yet. It validates allowed origins, applies server-side IP rate limiting through `bible_signup_limits`, validates the submitted profile/password, creates the Auth user with `email_confirm: true`, and returns a high-entropy one-time recovery code to save offline.
- Browser sign-in uses normal Supabase email/password Auth after account creation.
- Password recovery calls `bq-password-reset` with the account email, saved recovery code, and new password.
- `bq-password-reset` is intentionally deployed with `verify_jwt=false` because the reset action must work while signed out. The reset path uses IP throttling plus per-code failure lockout. Its authenticated `issue` action validates the supplied bearer session before rotating a recovery code.
- Recovery codes are stored only as hashes in server-only `bible_password_reset_codes`; successful recovery rotates the code and invalidates the previous one.
- Internal service/database errors are logged server-side and should not be returned verbatim to anonymous callers.

Supabase **Auth > URL Configuration** should still use the production BibleQuest host for normal Auth metadata and any future supported callback flow:

- Site URL: `https://mybiblequest.pages.dev/`
- Compatibility URL when allowed redirects are used: `https://biblequest-7th.pages.dev/**`

The current recovery-code flow does not depend on hosted password-reset redirect URLs. If email-link recovery is reintroduced later, its callback allowlist must be explicitly verified before release.

## Edge Function JWT posture

All normal authenticated BibleQuest `bq-*` functions should keep `verify_jwt=true`. The only deliberate exceptions are `bq-signup` and `bq-password-reset`, whose function bodies implement the unauthenticated-entry controls described above. Do not disable gateway JWT verification on additional functions merely to work around client errors.

## Source-of-truth rule

Production schema/function changes must be represented in this repository. Database DDL belongs in `supabase/migrations/`; deployed Edge Function source belongs in `supabase/functions/`. A live-only change is deployment drift and should be reconciled before release.
