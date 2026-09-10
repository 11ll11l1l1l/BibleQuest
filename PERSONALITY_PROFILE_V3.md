# BibleQuest v3 Personality Profile Contract

Milestone #80 is bounded to the authoritative inventory requirement: **complete; save; reopen; privacy boundary**.

## Recovered compatibility evidence

The retained app had two distinct personality surfaces:

- **Quick Transform**: a 20-item IPIP-based Big Five self-reflection with four items per factor. It explicitly described itself as shorter than a full personality inventory and not a clinical or employment assessment.
- **Psychometrics Lab**: a separate deep suite containing IPIP-NEO-120, IPIP-VIA-R and Rosenberg Self-Esteem. That remains inventory #81 and is not part of #80.

A later retained `personality-profile.js` wrapper attempted to sync personality results while labeling them `ipip_big_five_50_v1`, but it referenced a stale transformation storage key and does not match the newer retained 20-item Quick Transform implementation. v3 therefore does **not** reproduce that inaccurate provenance label.

## v3 source and ownership

- `src/engines/transform.js` remains the sole owner of the 20-item personality answers and scoring.
- The profile assessment identifier is `bq_quick_transform_ipip20_v1`.
- `src/app/personality-profile.js` owns only a sanitized saved snapshot and presentation-only hints derived from the verified Transform result.
- `src/app/transform.js` may ask the profile owner to capture the completed result; it does not duplicate profile normalization or storage.
- `src/core/storage.js` remains the sole browser-storage implementation. #80 adds a `privateStorage` namespace that is excluded from normal portable backup/export.
- #80 does not create a second personality scorer, import Psychometrics Lab scoring, or modify the production database.

## Owner isolation

A saved profile belongs to exactly one local owner:

- signed-in account: `account:<user id>`;
- signed-out/guest state: `guest`.

Switching accounts selects a different private-storage key. A guest profile is never automatically promoted to an account profile. Existing Transform results created before this owner-bound profile existed are not automatically claimed by another account; completing/retaking the personality section creates the current owner's profile.

Resetting the personality assessment clears the current owner's saved profile only.

## Privacy boundary

The #80 saved snapshot:

- stays on the current device;
- is excluded from normal portable BibleQuest backup/export;
- is not sent to congregations, leaders, assignments, Couples, Cloud Notes, or another signed-in account;
- is not a diagnosis, employment assessment, faith score, spiritual-maturity score, or measure of God's approval;
- does not change Scripture, doctrine, permissions, scores, completion rules, or content truth.

The retained `bible_personality_profiles` account-cloud table and its RLS policies are compatibility evidence only for this milestone. #80 does not change production Supabase or claim cross-device profile sync. A future cloud migration would require its own verified API/RLS boundary.

## Presentation-only hints

The saved Big Five means may generate simple presentation preferences using the retained thresholds:

- Openness: deeper context / concrete first / balanced;
- Conscientiousness: structured / small steps / balanced;
- Extraversion: interactive / reflective / balanced;
- Agreeableness: direct evidence first / cooperative / balanced;
- Emotional Stability: calm short steps / normal.

These hints are metadata only and are not allowed to modify theological content or application authority.

## Acceptance

#80 is not complete until permanent tests prove:

- only a valid completed five-factor Quick Transform result can be captured;
- the saved assessment version is `bq_quick_transform_ipip20_v1`, never the stale 50-item label;
- guest and account profiles are isolated;
- account A cannot reopen account B's saved profile;
- capture, reopen and clear work through the private-storage owner;
- private profile keys are excluded from portable backup/export;
- Transform completion captures the current owner's profile and reset clears it;
- malformed saved data fails closed to an empty profile;
- presentation hints remain presentation-only;
- the real Personality Profile surface is usable at 390 px;
- #81 Psychometrics remains separate and Not started during #80;
- the complete accumulated v3 regression workflow is green on the exact functional candidate and again on the exact bookkeeping candidate.
