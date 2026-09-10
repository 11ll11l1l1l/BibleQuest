# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-10 JST

This is the current progress view over `FEATURE_INVENTORY_V3.md`, which remains authoritative. Detailed older milestone history remains preserved in Git history; this working timeline is intentionally kept focused on the current frozen line and active gates.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Inventory after #83 functional verification/bookkeeping promotion:** 82 Regression-tested / 1 Verified / 0 Implemented / 17 Not started
- **Implemented or better:** 83 / 100 (**83% strict parity completion**)
- **Official regression stability:** 82 / 100
- **Latest frozen checkpoint before #83 bookkeeping:** `release/v3.55-avatar-vault` at `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`
- **#83 functional candidate:** `daafbd442e666b9dc075c87f5f39e1999bce7adf`
- **#83 targeted verification:** run `34490094401` — green
- **#83 complete functional verification:** run `34490525261` — green
- **#84 Tutorial/onboarding trainer:** next, but no product write until #83 bookkeeping passes and v3.56 freezes
- **#15 Japanese furigana and Kids #38–40:** intentionally deferred
- **Production:** v2 remains live; `main`, production Supabase/data and production Cloudflare remain untouched

## Recent frozen release line

- `release/v3.53-personality-profile` — `2c62a63e5bbdedae47834714e65751a57d58b696`
- `release/v3.54-psychometrics` — `cc591aac786a91183eb5a7a5ad958ae7314a9577`
- `release/v3.55-avatar-vault` — `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`
- `release/v3.56-innovation-suite` — pending exact bookkeeping verification/freeze

## Recent milestone sequence

| Inventory capability | State now | Evidence / boundary |
|---:|---|---|
| #79 Linked activities/challenges | Regression-tested | retained by later full suites |
| #80 Personality profile | Regression-tested | frozen v3.53 and retained by later suites |
| #81 Psychometrics suite | Regression-tested | frozen v3.54 and retained by later suites |
| #82 Avatar Vault | Regression-tested | frozen v3.55; survived #83 full suite |
| #83 Innovation suite | Verified | exact functional candidate `daafbd442e666b9dc075c87f5f39e1999bce7adf`; run `34490525261` |
| #84 Tutorial/onboarding trainer | Not started | recovered next boundary; waits for v3.56 freeze |
| #85 Tutorial avatar reactions | Not started | separate capability; do not bundle silently with #84 |

## #83 functional verification chronology

1. Earlier #83 verification run `34485325897` reached browser smoke but the shell did not mount.
2. Personal Mission route ownership was corrected to `my-mission` because `mission` is already owned by Daily Mission.
3. Candidate `f6f29370ebc7e151e3e5b447899a82dbe65ddeb7`, targeted run `34489335450`, still reproduced the shell-mount failure after #83 architecture/edge checks passed.
4. Root cause was isolated to `src/app/bootstrap.js`: `createMissionService({openReview})` executed before lexical `const openReview` initialization, throwing before shell mount.
5. Candidate `daafbd442e666b9dc075c87f5f39e1999bce7adf` reorders initialization only: existing Open Review owner first, Personal Mission second.
6. Exact-SHA targeted run `34490094401` passed shell + #83 smoke.
7. Exact-SHA full run `34490525261` passed the complete accumulated architecture, edge/security and browser/mobile suite.
8. #83 is therefore promoted to Verified in bookkeeping; #82 advances to Regression-tested.

## #84 recovered next boundary

Retained production history establishes a trainer-led onboarding/tutorial with:
- first-run completion persistence;
- Next/Back, skip/temporary close and finish;
- no duplicate tutorial overlay;
- a permanent launcher that can force-reopen the guide;
- an optional post-registration recovery-code step with confirmation before dismissal;
- privacy guards preventing recovery-code logging/tracking;
- action buttons into real BibleQuest destinations;
- offline/PWA availability;
- visual trainer reactions tracked separately as inventory #85.

Primary retained evidence: `onboarding-tutorial.js`, `tutorial-launcher.js`, commits `77052e4a...`, `0a282336...`, and `c01df845...`.

## Next sequence

1. Run this exact #83 bookkeeping candidate through the complete accumulated exact-SHA bookkeeping gate.
2. On green, reset the isolated verifier to the clean bookkeeping SHA.
3. Freeze `release/v3.56-innovation-suite` at that exact green SHA and verify the ref.
4. Create `feature/v3-tutorial-onboarding` from v3.56.
5. Finish #84 contract recovery, implement cleanly, run targeted checks, then the full accumulated gate.
6. Continue milestone-to-milestone without modifying production surfaces.

## Release discipline

- Do not modify `main`, production Supabase/data or production Cloudflare during rebuild.
- Do not replace production v2 with incomplete v3.
- Freeze only after the exact bookkeeping state passes the complete accumulated suite.
- Every reproduced bug records its root cause and retains regression protection.
- Normal v3 CI remains manual-only; temporary push triggers are isolated to verifier branches and removed afterward.
