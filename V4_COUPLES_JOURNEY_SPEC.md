# BibleQuest V4 Couples Communication Journey Specification

Updated: 2026-09-12 JST
Status: implementation contract for the requested husband-wife communication journey and self-assessment.

## Purpose

Add a private, non-competitive communication self-assessment inside the existing local Couples & Family feature. The result is a directional reflection aid, not a diagnosis, spiritual grade, compatibility score, or measure of who is right.

The journey remains owned by the existing `couples-family-local` service/storage boundary. Couples Cloud remains separate. No assessment answer is uploaded or shared by this feature.

## Five communication levels — positive to negative

1. **Growing Together** — communication is generally warm, respectful, repair-oriented and collaborative.
2. **Mostly Connected** — the relationship has a solid base with some recurring communication gaps worth practicing deliberately.
3. **Mixed Signals** — connection and strain alternate; the couple benefits from slowing down, listening first and naming one issue at a time.
4. **Strained Connection** — misunderstandings or unresolved conflict are frequent enough that structured listening and repair should take priority over problem-solving speed.
5. **Rebuild Carefully** — communication is frequently disconnected or reactive; focus on small, observable safety/respect/listening habits rather than trying to solve everything at once.

The ladder order is intentional: it begins with healthier connection and moves toward greater strain. The numeric score is not shown as a competitive grade.

## Questionnaire

The self-assessment contains 12 positively framed statements scored from 1 to 5:

- 1 — Rarely / never
- 2 — Seldom
- 3 — Sometimes
- 4 — Often
- 5 — Almost always

The 12 items cover four domains:

- **Listening & understanding** — heard, curiosity before defensiveness, honest needs/concerns.
- **Repair & respect** — returning to repair, respectful disagreement, useful pause-and-return behavior.
- **Connection & teamwork** — shared-team feeling, warmth/friendship, appreciation.
- **Faith, boundaries & safety** — Scripture/faith used for growth rather than winning, respected boundaries/no, and freedom from fear of threats/coercion/stalking/violence.

Total range: 12–60.

- 52–60 → Growing Together
- 43–51 → Mostly Connected
- 34–42 → Mixed Signals
- 25–33 → Strained Connection
- 12–24 → Rebuild Carefully

## Safety override

The result also carries an independent `safetyPriority` flag. If the direct safety statement is rated 1 or 2, the UI must show a prominent safety-first boundary regardless of the total score.

The safety message must not frame fear, threats, coercion, stalking or violence as a normal mutual communication problem. It should direct the user toward safety and trusted/professional support. The app must not recommend a couple exercise as the primary next step when `safetyPriority` is true.

This flag is a conservative product-safety signal, not a diagnosis or legal determination.

## Privacy and persistence

- Stay local to the existing `couples-family-local` storage key.
- Persist only assessment summaries: timestamp, total, level ID, domain averages and safety-priority flag.
- Do **not** persist the 12 raw questionnaire answers.
- Keep a bounded history of the latest 12 assessment summaries.
- Preserve backward compatibility with existing Couples local state.
- Do not write to Couples Cloud or any backend/API.

## UX contract

- Add **Communication Journey** as a seventh local Couples mode without removing the six existing modes.
- Dashboard may show the latest communication level when one exists.
- Assessment is for one person’s reflection; it is not a pass-the-phone comparison and must not declare a winner/loser.
- Result shows the five-level ladder with the current level highlighted, four domain summaries, privacy/non-diagnostic framing, and appropriate next-step guidance.
- Non-safety results may point back to existing `Listen First` and `Repair Room` practices rather than creating duplicate practice engines.
- Safety-priority results show the safety boundary before any ordinary communication practice.
- Retain 44px touch targets, 320px no-overflow behavior, keyboard/focus usability, and reduced-motion support.

## Architecture contract

- Existing owner: `src/app/couples-family.js`.
- Content/model constants may live in `src/content/couples-journey.js`.
- Presentation remains in `src/features/couples-family/index.js`.
- Couples Cloud owner, routes, database/API and RLS behavior remain untouched.
- No direct `fetch` or new storage key is allowed for this feature.

## Acceptance

Focused automated evidence must cover scoring thresholds, safety override, raw-answer non-persistence, bounded history, reload/migration, retained legacy Couples behavior, 320px browser presentation, keyboard/touch targets, and continued accumulated V4 regressions.