# BibleQuest Psychometrics Lab — sources and measurement boundaries

The Psychometrics Lab is a non-clinical self-reflection feature. It does not diagnose mental illness, determine spiritual maturity, or replace evaluation by a qualified professional. Results are stored locally in the user's browser by default.

## Purpose inside BibleQuest Transform

The purpose of Psychometrics Lab is not to give the user a new identity label. It is to help reveal tendencies, blind spots, strengths, and recurring patterns that a person may not notice without structured reflection. BibleQuest then invites the user to examine those tendencies under Scripture and practice more Christlike obedience.

BibleQuest keeps two layers distinct:

1. **Measurement layer:** the psychometric instrument describes self-reported tendencies using its published scoring method.
2. **Discipleship layer:** Scripture supplies the moral and spiritual standard. A high or low trait score is not automatically sinful, virtuous, mature, immature, saved, or unsaved.

The Christian reflection layer follows BibleQuest's existing doctrinal policy: **Scripture first; CAMACOP statement of faith for doctrinal alignment; secondary study resources are not doctrinal authorities.** Sanctification is treated as Christian growth after conversion, not salvation earned through personality change or improved test scores.

The UI therefore uses the wording **“Jesus-centered reflection”** rather than claiming that Jesus had, or would have had, a particular psychometric score. Advice is tied to explicit Scripture references and to patterns Jesus teaches or models in the biblical text. Users are reminded to read cited passages in context.

## Deep Personality — IPIP-NEO-120

- Instrument family: International Personality Item Pool (IPIP).
- Implemented form: Johnson's 120-item representation of the Five-Factor Model, with 30 facet scales and four items per facet.
- Reference: Johnson, J. A. (2014). *Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory: Development of the IPIP-NEO-120*. Journal of Research in Personality, 51, 78–89.
- Source/key: https://ipip.ori.org/30FacetNEO-PI-RItems.htm
- IPIP materials are public-domain resources. The official IPIP site permits use, adaptation, translation, and web administration without seeking permission.
- BibleQuest reports reverse-keyed raw 1–5 item means. It deliberately does not manufacture population percentiles without an appropriate normative reference sample.
- All five broad domains and all 30 reported facets receive a Scripture-linked reflection in the BibleQuest result UI.
- The historical **Liberalism / Values Openness** facet includes political and relativism-oriented items. BibleQuest explicitly warns that this facet is not a measure of biblical orthodoxy, holiness, or political faithfulness.
- The historical **Depression** facet name is a personality construct in this inventory and is not presented as a diagnosis of depressive disorder.

## Character Strengths — IPIP-VIA-R

- Implemented form: 96-item set of 24 balanced and culture-fair IPIP-VIA-R short scales.
- Four items per strength, balanced as two positively keyed and two negatively keyed items.
- Reference: Bluemke, M., Partsch, M. V., Saucier, G., & Lechner, C. M. (2021). IPIP-VIA-R short-scale refinement described by the IPIP site.
- Source/key: https://ipip.ori.org/IPIP-VIA-R_Key.html
- Scale characteristics: https://ipip.ori.org/IPIP-VIA-R_Table.html
- Results are ranked within the user's own profile. They are not a score of virtue, salvation, doctrine, calling, or spiritual maturity.
- All 24 reported strengths receive a Scripture-linked reflection in the result UI.
- The **Spirituality / Religiousness** scale remains a psychological construct. BibleQuest explicitly states that it is not a salvation, discipleship, doctrinal-orthodoxy, or Christian-maturity score.

## Rosenberg Self-Esteem Scale

- Ten-item global self-esteem scale.
- Source and scoring guidance: University of Maryland Department of Sociology, https://socy.umd.edu/about-us/using-rosenberg-self-esteem-scale
- The University of Maryland states that the scale is in the public domain.
- BibleQuest uses 0–3 scoring with the negatively worded items reversed, producing a total from 0 to 30.
- The University of Maryland FAQ states that there are no discrete universal cutoffs for high versus low self-esteem. BibleQuest therefore does not invent categorical cutoffs.
- The Christian reflection distinguishes healthy received worth from both self-contempt and self-exaltation; the score is explicitly not treated as the user's worth before God.

## Response-quality checks

For the two long-form inventories, BibleQuest flags obvious response patterns that can reduce interpretability, including extreme straight-lining, unusually low response variation, and implausibly fast completion. These are caution flags only and do not automatically invalidate a result.

The answering UI preserves the user's reading position after selecting an answer. Re-rendering a selected response must not send the user back to the top of a long questionnaire page.

## Deliberately excluded from this release

Clinical symptom screeners are not mixed into the general Psychometrics Lab. If clinical screening is added later, it should be implemented as a clearly separated health-screening feature with instrument-specific licensing, validated scoring, crisis/safety handling where relevant, and explicit non-diagnostic guidance.
