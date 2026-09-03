# BibleQuest

Learn the Bible through games, stories, situational questions, challenges, reflection, group activities, and couples growth.

## Public app

GitHub Pages: `https://11ll11l1l1l.github.io/BibleQuest/`

## Playable now

- Daily 5 and Quick Play
- Context Mode and Bible Detective
- Story Adventure and Timeline Challenge
- Situations & Wisdom
- Deep/open-question reflection
- Bible Journey and mastery progress
- Bible Reader and recall activities
- Couples Growth activities
- Congregation roster and shared-device play
- Group games and conversation activities
- Today / This Week / All Time leaderboards across multiple learning fields
- Badges, achievements, awards, XP, and streaks
- Offline/PWA support

## Congregation cloud stage

The source tree now includes the next-stage multi-device congregation architecture. It is intentionally disabled in `cloud-config.js` until a dedicated BibleQuest Supabase project is provisioned.

Prepared cloud capabilities include:

- passwordless account sign-in
- congregation creation and invite-code joining
- congregation member roles
- cross-device leaderboard aggregation
- trusted activity synchronization
- server-derived leaderboard points
- server-derived cloud badges
- facilitator-controlled delegated group scoring
- replay/deduplication protection, rate limits, and daily score caps

The browser never receives a Supabase service-role key and is not the authority for competitive scores. Score claims are checked by Edge Functions before trusted events are written.

Backend files:

- `supabase/schema.sql` — base BibleQuest schema and RLS
- `supabase/cloud-stage.sql` — cloud congregation additions, invite storage, leaderboard RPC, and cloud badge catalog
- `supabase/functions/bq-create-congregation/` — trusted congregation creation
- `supabase/functions/bq-join/` — trusted invite joining
- `supabase/functions/bq-invite/` — facilitator/leader invite generation
- `supabase/functions/bq-score/` — trusted score validation and badge awarding

Activation order for a dedicated BibleQuest project:

1. Create the dedicated Supabase project.
2. Apply `supabase/schema.sql`.
3. Apply `supabase/cloud-stage.sql`.
4. Deploy the four `bq-*` Edge Functions with JWT verification enabled.
5. Configure the GitHub Pages URL as the Auth Site URL / allowed redirect URL.
6. Put only the project URL and publishable key in `cloud-config.js`, set `enabled: true`, and update the validation invariant.
7. Run Supabase security/performance advisors and browser regression tests.

Until those activation steps are completed, BibleQuest continues to use local browser progress and the existing shared-device congregation mode without depending on an unfinished backend.

## Content direction

The production content pipeline will favor public-domain/open resources instead of hand-authoring the entire Bible database. See `DATA_SOURCES.md`.

`Study Together` remains a future module rather than the current product focus.
