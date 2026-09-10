# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST after #83 functional verification.

GitHub live refs and exact executed verification evidence are authoritative. Recover the live refs before writing because concurrent chats/agents may have moved development branches.

## Frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release before the current bookkeeping gate: `release/v3.55-avatar-vault`.
- Exact frozen SHA: `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Production v2, `main`, production Cloudflare, production data and production Supabase remain untouched.
- Normal v3 Actions are `workflow_dispatch` only. Temporary `push:` triggers belong only on isolated one-shot verifier branches and must be reset away after use.

## Current #83 state

- Active feature branch: `feature/v3-innovation-suite`.
- Functional candidate: `daafbd442e666b9dc075c87f5f39e1999bce7adf`.
- Functional run: `34490525261` — complete `success`.
- Targeted post-fix run: `34490094401` — `success`.
- Earlier failed/rejected runs retained for root-cause history: `34485325897`, `34489335450`.
- #83 is promoted to **Verified** in this bookkeeping transaction; #82 becomes **Regression-tested**.
- Inventory represented here: **82 Regression-tested / 1 Verified / 0 Implemented / 17 Not started**.
- Strict implemented-or-better parity: **83/100**.
- Regression stability: **82/100**.
- This bookkeeping commit itself still requires its own full exact-SHA verification before release freeze; do not transfer the functional PASS to it.

## #83 verified boundary

Personal Mission is the only new #83 runtime slice. It reuses Open Review's existing overview/due/mastery information and adds no parallel review/progress/store/backend owner. The route is `my-mission`; `mission` remains Daily Mission's route. Bible World and Church Challenges remain outside this slice and are not silently counted complete.

Files/evidence central to #83:
- `INNOVATION_SUITE_V3.md`
- `src/engines/mission.js`
- `src/app/mission.js`
- `src/features/mission/index.js`
- `src/features/more/index.js`
- `src/app/bootstrap.js`
- `scripts/validate-v3-innovation-suite.mjs`
- `tests/v3-innovation-suite-edge.mjs`
- `tests/v3-innovation-suite-smoke.mjs`

## Reproduced defects and permanent protection

- Earlier #83 flow used a route already owned by Daily Mission; Personal Mission was moved to `my-mission`.
- After that change, targeted run `34489335450` still reproduced a shell-mount failure.
- Root cause: `src/app/bootstrap.js` created Personal Mission with `openReview` before the lexical `const openReview` initialization, causing a Temporal Dead Zone exception before `mountShell`.
- Fix at `daafbd442e666b9dc075c87f5f39e1999bce7adf`: initialize the existing Open Review owner first, then create Personal Mission.
- Targeted run `34490094401` passed; full run `34490525261` passed all accumulated architecture, edge/security and browser/mobile tests. `tests/v3-shell-smoke.mjs` remains permanent regression protection.

## #84 recovered next boundary

#84 Tutorial/onboarding trainer remains **Not started** until v3.56 freezes. Retained production evidence establishes a trainer-led multi-step guide with completion persistence, Next/Back/skip/finish, no duplicate overlay, a persistent force-open launcher, optional recovery-code safeguarding after account creation, action buttons into real app destinations, and offline/PWA availability. #85 Tutorial avatar reactions is separate and must remain Not started while #84 is implemented unless its own milestone is explicitly opened.

Key retained references already identified:
- production `onboarding-tutorial.js`;
- production `tutorial-launcher.js`;
- commit `77052e4a1d691fbc9f7d55d313d451f0268e67cb` (`Build trainer-led BibleQuest feature tutorial`);
- commit `0a282336191b8c5b3250b99a55f7f9ba44f2549d` (`Make tutorial permanently easy to reopen`);
- commit `c01df845d519b1055ceca3260a80961b072a44a1` (production boot, privacy and offline/PWA onboarding guards).

## Exact next action

1. Treat the live head of `feature/v3-innovation-suite` containing this bookkeeping transaction as the #83 bookkeeping candidate.
2. Run an isolated exact-SHA complete bookkeeping verifier: SHA assertion + all accumulated architecture + all edge/security + all browser/mobile regressions.
3. On failure, correct only the reproduced root cause and create a new bookkeeping candidate.
4. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.56-innovation-suite` at exactly that SHA.
5. Verify the release branch points to exactly that SHA.
6. Create `feature/v3-tutorial-onboarding` from v3.56 and continue #84 automatically from the recovered references above.

## Non-negotiable safety

Never modify `main`, production v2, production Cloudflare, production data, or production Supabase without separate explicit authorization. Never freeze an untested SHA or use a temporary trigger commit as a release SHA.
