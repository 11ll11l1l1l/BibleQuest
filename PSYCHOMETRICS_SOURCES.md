# BibleQuest Psychometrics Lab — sources and measurement boundaries

The Psychometrics Lab is a non-clinical self-reflection feature. It does not diagnose mental illness or replace evaluation by a qualified professional. Results are stored locally in the user's browser by default.

## Purpose inside BibleQuest Transform

The purpose of Psychometrics Lab is structured self-realization: to reveal tendencies, blind spots, strengths, triggers and recurring patterns that a person may not notice without a consistent questionnaire and explicit scoring.

The result UI keeps three layers separate and in this order:

1. **Raw scored result:** the instrument score, scale mean, facet result or total exactly as calculated from the questionnaire.
2. **Psychological interpretation and self-reflection:** a plain-language explanation of what a higher, lower or mixed result may look like in ordinary behavior, plus questions that help the user test whether the pattern actually appears in real life.
3. **Optional Christian reflection:** Scripture references and a short Christian application are shown only after the psychometric interpretation. Scripture is not part of the score and does not change the measured result.

A trait result is not a fixed identity label or a moral grade. The practical goal is to help users notice where a tendency is useful, where it can become a blind spot, what situations amplify it, and what concrete behavior they may want to practice or change.

## Deep Personality — IPIP-NEO-120

- Instrument family: International Personality Item Pool (IPIP).
- Implemented form: Johnson's 120-item representation of the Five-Factor Model, with 30 facet scales and four items per facet.
- Reference: Johnson, J. A. (2014). *Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory: Development of the IPIP-NEO-120*. Journal of Research in Personality, 51, 78–89.
- Source/key: https://ipip.ori.org/30FacetNEO-PI-RItems.htm
- IPIP materials are public-domain resources. The official IPIP site permits use, adaptation, translation, and web administration without seeking permission.
- BibleQuest reports reverse-keyed raw 1–5 item means. It deliberately does not manufacture population percentiles without an appropriate normative reference sample.
- All five broad domains and all 30 reported facets receive a separate plain-language self-reflection explanation after the raw result.
- The historical **Liberalism / Values Openness** facet includes political and relativism-oriented items and must not be treated as a measure of theology, morality or political correctness.
- The historical **Depression** facet name is a personality construct in this inventory and is not presented as a diagnosis of depressive disorder.

## Character Strengths — IPIP-VIA-R

- Implemented form: 96-item set of 24 balanced IPIP-VIA-R short scales.
- Four items per strength, balanced as two positively keyed and two negatively keyed items.
- Reference: Bluemke, M., Partsch, M. V., Saucier, G., & Lechner, C. M. (2021). IPIP-VIA-R short-scale refinement described by the IPIP site.
- Source/key: https://ipip.ori.org/IPIP-VIA-R_Key.html
- Scale characteristics: https://ipip.ori.org/IPIP-VIA-R_Table.html
- Results are ranked within the user's own profile and shown numerically before interpretation.
- All 24 reported strengths receive a separate self-reflection explanation.
- The **Spirituality / Religiousness** scale remains the questionnaire's psychological construct and is not treated as a measure of doctrine or spiritual maturity.

## Rosenberg Self-Esteem Scale

- Ten-item global self-esteem scale.
- Source and scoring guidance: University of Maryland Department of Sociology, https://socy.umd.edu/about-us/using-rosenberg-self-esteem-scale
- The University of Maryland states that the scale is in the public domain.
- BibleQuest uses 0–3 scoring with negatively worded items reversed, producing a total from 0 to 30.
- The University of Maryland FAQ states that there are no discrete universal cutoffs for high versus low self-esteem. BibleQuest therefore does not invent categorical cutoffs.
- The result page first shows the raw 0–30 total, then explains what patterns of self-evaluation the score may be useful for investigating.

## Raw result access

Each completed assessment provides an expandable raw-data section containing the locally stored item responses and the scored domain/facet/scale values. Users can copy this data as JSON for their own review or comparison over time.

## Response-quality checks

For the two long-form inventories, BibleQuest flags obvious response patterns that can reduce interpretability, including extreme straight-lining, unusually low response variation, and implausibly fast completion. These are caution flags only and do not automatically invalidate a result.

The answering UI preserves the user's reading position after selecting an answer. Re-rendering a selected response must not send the user back to the top of a long questionnaire page.

## Optional Christian reflection layer

BibleQuest may show a collapsed Scripture reflection after the psychological explanation for users who want to consider the result from a Christian perspective. This layer is intentionally secondary to the measurement and self-awareness purpose of the tool. It should not turn a personality score into a sermon, a moral label, or a claim that Jesus had a particular psychometric profile.

## Deliberately excluded from this release

Clinical symptom screeners are not mixed into the general Psychometrics Lab. If clinical screening is added later, it should be implemented as a clearly separated health-screening feature with instrument-specific licensing, validated scoring, crisis/safety handling where relevant, and explicit non-diagnostic guidance.
