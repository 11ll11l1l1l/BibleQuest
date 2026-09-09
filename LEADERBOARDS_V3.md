# BibleQuest v3 Leaderboards contract

## Recovered scope

Inventory #71 requires load, rank, empty/error handling and account boundaries. Retained `community.js` history establishes a congregation-local board with three periods (`today`, `week`, `all`) and eight lanes: Overall, Knowledge, Reading, Wisdom, Mastery, Consistency, Group and Couples. Rankings sort by points descending, then display name. Active roster members remain visible at zero points.

The retained database function `public.bible_leaderboard(uuid,timestamptz)` aggregates trusted `bible_score_events` by user/category. Row-level security on `bible_score_events` permits SELECT only to authenticated members of the requested congregation. The v3 browser must consume that trusted aggregate; it must not recreate score-event writes or author point values.

## Ownership

- `src/app/leaderboards.js` is the sole period/lane normalization and ranking projection owner.
- `src/core/api.js` remains the sole Supabase boundary and owns the `bible_leaderboard` RPC plus active congregation-directory read.
- `src/app/congregation-membership.js` remains the account/congregation permission owner.
- `src/features/leaderboards/index.js` renders the view only.

## Boundaries

#71 is read-only. It does not own trusted score submission, XP, achievements, awards, badges, recognition (#72), teams, assignments, notifications, moderation, or private study data. `overall` is a presentation sum of the trusted category aggregates returned by the server. Scores from users who are no longer in the active congregation directory are not exposed.

Period boundaries retain the recovered behavior: Today begins at local midnight; This Week begins Monday at local midnight; All Time passes no cutoff. The server receives that cutoff and performs aggregation.

Guest, signed-out and local-preview states do not read cloud rankings. Empty active congregations and zero-point active members render safely.
