# BibleQuest v3 Journey Groups contract

Inventory row #64 restores only the group-membership lifecycle: create, join, view and leave, with membership persistence backed by the retained Supabase group tables.

## Recovered source of truth

- Retained `journey-groups.js` is reference evidence for old behavior.
- `supabase/functions/bq-journey-group/index.ts` remains the trusted mutation owner.
- `supabase/migrations/20260904_journey_groups_daily_loop.sql` remains the database/RLS owner.
- `src/core/api.js` is the only browser Supabase boundary.
- `src/app/journey-groups.js` owns v3 group normalization, membership orchestration and fail-closed permission behavior.
- `src/features/journey-groups/index.js` owns presentation only.

## Exact #64 scope

- authenticated users can view active Journey Group memberships;
- members can join using generated 8-character codes;
- facilitator/leader/pastor/admin congregation roles may request creation while the trusted function stays authoritative;
- groups are limited to 2–6 members;
- group leaders can rotate invite codes;
- non-owner members can leave;
- the owning leader cannot leave until leadership is transferred or the group is archived;
- membership persists in `bible_group_members`.

## Explicit exclusions

Inventory row #65 Encouragements is not pulled forward. #64 does not send/read `bible_group_encouragements`, does not own daily Journey completion sharing, assignments, presence, chat, rankings or XP, and does not expose private notes/reflections/answers.

No localStorage compatibility state is imported. Production v2 and production Supabase remain unchanged by this v3 rebuild milestone.

## Verification evidence

- Initial exact run `34244782912` stopped before feature execution because accumulated validators were coupled to literal direct `node` commands after the workflow had been consolidated into executable shell loops.
- `scripts/v3-workflow-contract.mjs` now verifies both direct and looped Node invocations without accepting comments, non-executing loops, mismatched variables or partial path matches; `tests/v3-workflow-contract-edge.mjs` permanently covers that harness boundary.
- Corrected exact candidate `c49ce887bd28323292b6f1b60f7689a1aa194615` passed the complete accumulated architecture, edge and browser/mobile suite in run `34258746664`.
- The isolated `verify/v3.38-journey-groups-functional-r2` branch was reset from trigger commit `9f9590b624c1957d31c6d3a4b8c6d65130b27db9` to the clean candidate after verification.
