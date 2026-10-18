# Wisdom Situations: 72-case hard judgment revision (2026-10-18)

## Problem confirmed
The previous 72 questions showed a repeated grammatical solution: the preferred choice often had longer and more comprehensive wording, "verify / consult / document / proportionately respond" was the obvious morally safe answer, and extremes served as easy distractors. Weak situational constraints allowed readers to invent costless fifth options. Single correct/incorrect UI framing contradicted the promise of applied wisdom.

## Revision delivered on this branch
- Exactly **72 cases** (24 Foundation, 24 Advanced, 24 Expert); English questions now have an authored deadline / irreversibility / resource or trust constraint.
- **288 new English alternatives**, each naming a defensible benefit and a cost. Most decisions endanger at least one of employment, reputation, family stability, financial security, safety, duty or human relationships.
- Most comprehensive-option shortcut removed; QA checks longest preferred choice at 12–24 of 72 (near the 25% chance expectation), maximum per-question choice length ratio <=1.251 (current: 17/72 and 1.25).
- Each case now has a fresh, narrower explanation for the editorial preference. Post-selection cards distinguish the *potential benefit* and *potential cost* of each answer.
- All 72 English scenarios use 8/8 difficulty and Lesson definition v2 to prevent showing a past answer against changed choices. Selector storage v3 restarts the 72-case cycle. XP still uses the v1 event key to prevent duplicate lifetime XP for previously completed cases.
- UI no longer marks the person as morally correct or incorrect; the highlighted answer is expressly an **editorial preference under stated circumstances**, not universally binding doctrine.

## Editorial constraints for future changes
1. All 4 choices must address the same immediate decision, and the scenario must rule out easy unlimited consultations and indefinite delay.
2. Each choice must produce a credible benefit *and a credible personal cost* to the decision-maker or a person for whom they are responsible. Avoid caricatures, criminal shortcuts, coin flips, and purely virtuous multi-step omnibus answers.
3. No option should hide the only serious downside. Distinguish uncertainty from ignorance, and specify deadlines, permissions, relationships and reversibility.
4. Keep choice texts similar in length, parallel in style, and avoid absolute adverbs that make options dismissible at first glance.
5. An editorial recommendation is allowed, but its justification must acknowledge its own meaningful downside. Faith tradition and Scripture sources must remain interpretive guidance, never one-size-fits-all mandates.
6. Preserve stable ids and the 72-case cycle. Do not award an extra 8 XP solely because the content definition version changed.
7. Reevaluate actual difficulty with blind readers: record how often the editorial preferred choice is selected **before** the rationale is revealed, the readers' reasons, and evidence that they could explain why at least two alternatives were genuinely tempting. A software QA metric cannot establish psychological difficulty.

## Non-release blockers
- **Tagalog and Cebuano translations are still the prior 72-case bank.** Do not merge/release this as complete multilingual parity until the 72 new constraints and all 288 options, plus explanations, have been meaningfully adapted and reviewed in both TL and CEB. A literal translation is not sufficient when cultural context changes the dilemma.
- Independent theological/context QA of Scripture references after the scenario rewrites, accessibility/mobile review of longer circumstances, and CI/browser smoke tests remain necessary.
- This branch is a **draft** for review. The 72 English revisions and mechanical tests do not justify a claim of production release or independently validated difficulty.
