# BibleQuest v3 Psychometrics Suite Contract

Milestone #81 is bounded to the authoritative inventory requirement: **complete assessment; result; persistence; mobile**.

## Retained compatibility evidence

The retained standalone Psychometrics Lab contains three separate self-report assessments:

1. **Deep Personality — IPIP-NEO-120**
   - 120 items;
   - five broad domains: Neuroticism / Emotional Reactivity, Extraversion, Openness to Experience, Agreeableness, Conscientiousness;
   - 30 facets, four items per facet;
   - 1–5 response scale with reverse-key scoring;
   - facet and domain raw means, not invented population percentiles;
   - basic response-quality flags for incomplete data, >80% same-option responding, very low response variation, and unusually fast completion.
2. **Character Strengths — IPIP-VIA-R**
   - 96 items;
   - 24 self-report constructs, four items each;
   - two positively keyed and two negatively keyed items per construct in the retained dataset;
   - 1–5 response scale with reverse-key scoring;
   - within-profile raw-mean ranking, not moral worth.
3. **Rosenberg Self-Esteem Scale**
   - 10 items;
   - displayed response choices Strongly agree → Strongly disagree;
   - internal response values 0–3;
   - retained scoring: positively keyed item = `3 - response`, negatively keyed item = `response`;
   - total range 0–30;
   - no invented universal low/normal/high cutoff.

Retained source labels include the International Personality Item Pool (IPIP), Johnson (2014) IPIP-NEO-120, Bluemke, Partsch, Saucier & Lechner (2021) IPIP-VIA-R, and the Morris Rosenberg Self-Esteem Scale / University of Maryland.

## v3 ownership

- `src/features/psychometrics/content.js` owns the migrated retained item definitions and source metadata only. It has no DOM, navigation, storage, backend, progress or scoring ownership.
- `src/engines/psychometrics.js` is the sole #81 scoring/normalization owner. It performs deterministic NEO, VIA and RSE calculations and response-quality analysis without DOM, router, storage implementation, API or progress access.
- `src/app/psychometrics.js` owns private persisted assessment state, current-owner isolation and assessment lifecycle. It delegates all calculation to the engine and all persistence to `privateStorage`.
- `src/features/psychometrics/index.js` owns presentation and event forwarding only.
- `src/app/router.js` remains the sole navigation/history owner; #81 requests navigation through bootstrap callbacks.
- #81 does not change `src/engines/transform.js` or `src/app/personality-profile.js` scoring/ownership boundaries.
- #81 introduces no production database, RLS, RPC, Edge Function or Cloudflare change.

## Private persistence and account boundary

Psychometrics state is highly personal self-report data. Its v3 persistence is therefore private and owner-scoped on this device:

- signed-out/guest owner: `guest`;
- signed-in owner: `account:<exact user id>`.

The service derives the active owner on every public operation. Switching accounts therefore selects a different private key. Guest state is never silently promoted into a signed-in account. #81 private keys remain outside ordinary portable BibleQuest backup/export through the verified `privateStorage` boundary.

Persisted state is versioned and normalized. Malformed, unknown-version, out-of-range, or structurally invalid saved answers/results fail closed to a safe clean state or a recalculated result from valid complete answers. Derived result data is never trusted merely because it was stored.

## Exact scoring rules

### IPIP-NEO-120

For each item, a positive key keeps the 1–5 response and a negative key uses `6 - response`. Each facet mean is the mean of its four keyed items, rounded to three decimals. Each broad-domain mean is the mean of all 24 keyed items in its six facets, rounded to three decimals.

Presentation bands retain the standalone thresholds:
- `< 2.5`: Lower expression;
- `2.5–<3.5`: Midrange / mixed;
- `>= 3.5`: Higher expression.

### IPIP-VIA-R

Each item uses the same 1–5/reverse-key rule. Each construct is the mean of its four keyed items, rounded to three decimals. Ranking is only within the user's own response profile and must not be presented as moral, spiritual or human worth.

### Rosenberg Self-Esteem

Responses are integers 0–3. Positive-key item score is `3 - response`; negative-key item score is `response`. The 10 item scores are summed to 0–30. The UI may say that a higher total indicates more positive global self-regard on this questionnaire, but must not impose a universal categorical cutoff.

## Response-quality checks

NEO and VIA retain bounded descriptive quality signals:
- incomplete answers;
- one response option used for more than 80% of valid answers;
- population standard deviation below 0.45;
- completion under five minutes when the assessment contains at least 90 items.

Speed alone never invalidates a result. If none of these flags apply, the result may say no obvious straight-lining, very-low-variation, or extreme-speed flag was detected. Quality signals are not honesty scores and do not diagnose the respondent.

## Interpretation safety

Psychometric scoring and Scripture/theological interpretation are separate layers.

- Results describe self-reported tendencies; they are not clinical diagnoses, employment-selection determinations, moral rankings, measures of salvation, doctrine, spiritual maturity, calling, God's approval or human worth.
- The retained NEO facet historically called `Liberalism / Values Openness` includes political and moral-content wording. Its result must be explicitly described as a historical values/openness construct and **must not** be interpreted as correct politics, biblical orthodoxy, holiness or theological faithfulness.
- The retained VIA `Spirituality / Religiousness` construct is a psychological self-report construct. It must not be presented as a faith, salvation, doctrine or Christian-maturity score.
- The retained NEO `Depression` facet is a personality/self-report facet name, not a diagnosis of depression or another condition.
- Scripture reflection, if later surfaced, is downstream reflection only and cannot alter psychometric scores, item keys, bands or quality checks.

## Scope exclusions

#81 does not:
- merge the deep suite into Quick Transform or Personality Profile;
- award XP for assessment scores;
- personalize Scripture/doctrine based on scores;
- create cloud synchronization;
- copy legacy `window.BQ_*` globals;
- write `localStorage` directly outside the storage owner;
- copy standalone navigation via `location.assign`/History;
- migrate unrelated avatar, innovation, tutorial, admin or moderation capabilities.

## Acceptance

#81 is not complete until permanent tests prove:
- all three retained assessments can be completed with exact deterministic scoring;
- NEO produces five domains and 30 facets from exactly 120 valid answers;
- VIA produces 24 construct scores from exactly 96 valid answers;
- RSE produces the exact retained 0–30 total;
- incomplete/out-of-range input cannot be calculated;
- reverse-key scoring is covered explicitly;
- quality flags behave deterministically with an injected clock;
- saved in-progress answers/results reopen for the same owner;
- malformed persisted state fails closed;
- guest/account A/account B states remain isolated and private/non-portable;
- historical political-values, Spirituality/Religiousness and Depression interpretation boundaries are visible;
- the real Psychometrics surface is usable at 390 px with no horizontal overflow and usable controls;
- #80 Quick Transform/Profile remains a separate owner;
- #82 Avatar Vault remains Not started during #81;
- the complete accumulated v3 suite passes on an exact functional candidate and again on the changed exact bookkeeping candidate before `release/v3.54-psychometrics` freezes.

## Exact functional verification evidence

- Exact green functional candidate: `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`.
- Exact verification run: `34473640903` — completed `success`.
- The isolated verifier explicitly checked out and asserted the exact candidate SHA before running the suite.
- Accumulated architecture validators, all edge/security regressions and the complete browser/mobile regression matrix passed.
- The verifier was restored to `workflow_dispatch` only after completion.
- The earlier candidate `1bd77237de6b08f18794387bf5c1d9c8098a3e4a` was not promoted: run `34472943815` exposed a new-validator ownership mistake requiring duplicated UI safety text. The validator now verifies centralized `PSYCHOMETRICS_SAFETY` ownership/references instead; runtime behavior was not weakened.
- This functional PASS does not transfer to the changed bookkeeping SHA. #81 freezes only after a second complete exact-SHA bookkeeping gate.
