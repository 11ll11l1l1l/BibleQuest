# BibleQuest v3 Content Moderation Contract

Status: rebuild in progress from frozen `release/v3.60-content-reporting` at `17071432a815ef5cf53f5f4538df982285114bd0`.

Capability #88 rebuilds congregation-scoped content policy application. It is deliberately separate from #87 Content Reporting and #91 Content Review workbench.

## Recovered behavior

The retained runtime loaded `bible_content_decisions` for the current congregation and applied those decisions to BibleQuest question content. Stable retained keys are:

- built-in questions: `question:core:<id>`;
- per-book Recall questions: `question:<BOOK_CODE>:<id>`.

Recovered decisions are:

- `include` — keep normal content and explicitly restore a matching quarantined Recall item;
- `exempt` — suppress matching normal content for the congregation;
- `remove` — suppress matching normal content for the congregation.

The old runtime applied `exempt`/`remove` to both core and question-pack content, and loaded `data/quarantine/questions/<BOOK_CODE>.json` only when an explicit matching `include` decision existed.

The retained migration `supabase/migrations/20260905_content_review_and_reports.sql` is authoritative for decision values, content-key bounds, congregation scope, and RLS. #88 adds no decision-writing UI and no production schema mutation.

## Clean v3 ownership

1. `src/app/content-moderation.js` is the single policy orchestration owner. It resolves a congregation scope from authenticated membership, loads/normalizes policy through the shared API, and applies decisions to stable content keys.
2. `src/core/api.js` remains the only Supabase browser implementation boundary. #88 may read `bible_content_decisions`; it must not write decisions because reviewer editing belongs to #91.
3. `src/app/congregation-membership.js` remains the only membership/role owner. Moderation cannot infer a congregation from editable profile text or create a competing membership cache.
4. `src/core/recall-packs.js` remains the only local Recall-pack file owner. It may expose quarantined candidate rows to the moderation composition, but it must never promote them itself.
5. `src/app/games.js` remains the game lifecycle owner. It consumes already-normalized moderation policy and cannot call Supabase or load quarantine files directly.
6. No global `window.fetch` replacement, `window.BQ*` registry, MutationObserver, direct browser navigation listener, or direct local/session storage is allowed.

## Congregation scope

The old Cloud runtime selected the stored active congregation when valid and otherwise defaulted to the first active membership. Clean v3 does not recreate the old global Cloud owner. #88 therefore keeps only an in-memory moderation scope:

- signed-out users have no congregation policy and continue to use the verified base content;
- signed-in users refresh current memberships through the existing membership owner;
- a still-valid explicitly selected moderation scope is retained in memory;
- otherwise the first active membership returned by the verified membership owner becomes the moderation scope, matching the recovered legacy default;
- an explicit `select(congregationId)` operation may switch the in-memory moderation scope only to a current membership;
- no moderation-scope persistence key or second global congregation owner is created.

This scope controls content policy only. It does not change Community, Assignments, leaderboards, roles, or any other congregation feature.

## Policy loading and failure behavior

- Only authenticated current congregation members may load that congregation's decisions.
- The API read is bounded to the retained maximum policy set and returns only policy fields required by #88.
- Malformed, cross-congregation, unsupported-decision, or unsupported-origin rows are discarded before policy application.
- A successful refresh replaces the in-memory policy for the selected congregation.
- A refresh failure may retain the last successful in-memory policy for the same selected congregation and mark it stale. If no prior policy exists, verified base content remains available rather than fabricating a moderation decision.
- Local preview and signed-out state do not fabricate remote moderation policy.

## Core question policy

For built-in game questions, #88 evaluates `question:core:<id>`.

- `exempt` or `remove` suppresses the item before the round starts.
- `include` leaves an already-approved core item available.
- No decision means the verified base item remains available.
- If moderation leaves a requested game mode with no usable questions, the game must fail explicitly instead of starting an empty/invalid round.

## Per-book Recall policy

For Recall code `CODE`, #88 evaluates `question:CODE:<id>`.

1. Start with the approved Recall rows already produced by `src/core/recall-packs.js` and doctrinal-safety review.
2. Suppress approved rows whose policy is `exempt` or `remove`.
3. Quarantined candidates remain unavailable by default.
4. A quarantined row may be restored only when the selected congregation has an explicit `include` decision for its exact stable key.
5. A restored row receives explicit moderation metadata recording the original quarantine action and the `include` override. The raw quarantine source remains unchanged.
6. Duplicate IDs cannot be introduced by an override.

#88 does not override Scripture text, private notes, user reflections, Transformation/Psychometrics data, account data, or arbitrary DOM text.

## Security boundary

Client filtering is presentation/runtime policy, not authorization. Existing RLS remains authoritative for reading decision rows. #88 never grants reviewer capability and never writes `bible_content_decisions`.

A missing or failed client policy read must not be represented as a leader decision. Likewise, a user cannot create an `include` override from the browser game UI; only the existing authorized backend decision path used later by #91 may create/update decisions.

## Verification target

Permanent #88 verification must cover:

- one moderation owner and one Supabase API owner;
- signed-out/no-membership behavior;
- deterministic first-membership default and explicit valid/invalid scope switching;
- malformed/cross-congregation decision rejection;
- core `remove`/`exempt` suppression;
- no-decision/`include` base retention;
- per-book suppression;
- explicit `include` quarantine restoration and duplicate prevention;
- policy-load failure/stale-memory behavior;
- game integration with an empty-policy failure path;
- no legacy globals, fetch interception, MutationObserver, direct storage, or navigation ownership;
- mobile/browser verification where the resulting Play/Recall flow remains usable at 390 px;
- complete accumulated regression on the exact functional candidate before any lifecycle promotion.

## Explicitly out of scope

#88 does not add report submission (#87), reviewer decision editing or queues (#91), Admin Console (#92), Admin Operations (#93), congregation creation/role editing, new scoring/XP rules, automatic doctrinal judgments, production deployment, or new database schema.
