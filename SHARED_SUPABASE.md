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

`cloud-config.js` derives `redirectUrl` from the page actually running BibleQuest, so browser recovery callbacks follow the current deployment root instead of a hard-coded host.

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
- Trusted server actions include `bq-create-congregation`, `bq-join`, `bq-invite`, `bq-score`, `bq-couple`, `bq-room-poll`, `bq-assignment`, `bq-journey-group`, and `bq-admin`.
- `bq-signup` and `bq-password-reset` are retired compatibility endpoints. Browser signup and password recovery use Supabase Auth directly.

## Security rules

- All browser-facing BibleQuest tables use RLS.
- Browser clients receive only the Supabase publishable key; service-role/secret keys remain inside trusted Edge Functions.
- Server-only secret/audit tables such as congregation/couple invite secrets, signup limits, legacy recovery-code rows and the admin audit log have no direct `anon`/`authenticated` table privileges.
- `bible_app_access` grants signed-in users `SELECT` only; RLS restricts that read to the user's own access row. Role mutation is performed by `bq-admin`.
- `bible_score_events`, earned cloud badges and invite hashes cannot be written directly by normal browser clients.
- Competitive points are derived and capped by the `bq-score` Edge Function.
- Facilitators may submit delegated points only for approved group activities.
- Do not add permissive RLS policies merely to silence the Supabase `RLS enabled, no policy` advisor for intentionally server-only tables.
- The Free-plan project cannot enable Supabase leaked-password protection; keep this as a known platform limitation rather than implementing a fake client-only substitute for the server-side HaveIBeenPwned protection.

## Authentication and recovery configuration

BibleQuest uses email/password authentication. Password recovery uses `supabase.auth.resetPasswordForEmail(...)`; the recovery link returns to the current BibleQuest app root and `password-recovery.js` completes the password update.

Supabase **Auth > URL Configuration** should use:

- Site URL: `https://mybiblequest.pages.dev/`
- Redirect URL: `https://mybiblequest.pages.dev/**`
- Compatibility redirect: `https://biblequest-7th.pages.dev/**`
- Preview redirects when preview recovery is intentionally needed: `https://*.mybiblequest.pages.dev/**` and `https://*.biblequest-7th.pages.dev/**`
- Optional legacy compatibility redirect: `https://11ll11l1l1l.github.io/BibleQuest/**`

Hosted Auth URL settings are external deployment configuration; they must match the production host before password-reset email testing is considered complete.

## Source-of-truth rule

Production schema/function changes must be represented in this repository. Database DDL belongs in `supabase/migrations/`; deployed Edge Function source belongs in `supabase/functions/`. A live-only change is deployment drift and should be reconciled before release.
