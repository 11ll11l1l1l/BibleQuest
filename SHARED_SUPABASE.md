# Shared Supabase Architecture

BibleQuest and Karimen intentionally share Supabase project `zkfmgezvzugchcwppreq` to remain within the Free-plan two-active-project limit.

## Isolation

Karimen owns its existing tables such as `exam_results` and `live_exams`.
BibleQuest owns only objects prefixed with `bible_` plus `private.is_bible_congregation_member` and Edge Functions prefixed with `bq-`.

Do not rename, drop, or repurpose Karimen objects for BibleQuest.
Do not store Bible text packs in Supabase; immutable/open Bible content stays on GitHub Pages and is loaded on demand.

## BibleQuest cloud objects

- Auth users: shared Supabase Auth service, referenced by BibleQuest `bible_*` tables only.
- Profiles, mastery and attempts: `bible_profiles`, `bible_mastery`, `bible_attempts`.
- Congregations and membership: `bible_congregations`, `bible_congregation_members`, `bible_congregation_invites`.
- Teams/shared play: `bible_teams`, `bible_team_members`, `bible_shared_sessions`, `bible_session_participants`.
- Trusted rankings: `bible_score_events`, `bible_leaderboard`.
- Awards: `bible_badge_catalog`, `bible_user_badges`.
- Trusted server actions: `bq-create-congregation`, `bq-join`, `bq-invite`, `bq-score`.

## Security rules

- All browser-facing BibleQuest tables use RLS.
- Browser clients never receive a secret/service-role key.
- `bible_score_events`, earned cloud badges, and invite hashes cannot be written directly by normal browser clients.
- Competitive points are derived and capped by the `bq-score` Edge Function.
- Facilitators may submit delegated points only for approved group activities.
- The public client uses the Supabase publishable key only.

## Authentication activation

Before `cloud-config.js` is switched to `enabled: true`, add the production BibleQuest URL to Supabase **Auth > URL Configuration**:

- Site URL: `https://11ll11l1l1l.github.io/BibleQuest/`
- Redirect URL: `https://11ll11l1l1l.github.io/BibleQuest/**`

This is required for Magic Link authentication. The connector used to deploy the backend cannot modify hosted Auth URL configuration.
