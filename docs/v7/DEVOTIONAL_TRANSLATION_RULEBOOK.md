# BibleQuest V7 Devotional Translation Rulebook

Version: 1.0
Status: required V7 Library publication policy
Required target locales for English-source devotionals: Tagalog (`tl`/canonical `fil`), Cebuano (`ceb`), Ilocano (`ilo`)

## Purpose

BibleQuest devotionals must remain faithful to the meaning, context, theological claims, pastoral tone, and rhetorical force of the reviewed source. Translation is not adaptation, commentary, simplification, modernization, summarization, or doctrinal rewriting.

This rulebook governs both translation generation and translation QA. A devotional is not translation-complete for V7 unless every required target locale has a complete current-revision title and body that has passed this rulebook.

## Non-negotiable fidelity rules

1. Translate the complete reviewed source revision. Do not add, omit, summarize, expand, soften, strengthen, modernize, explain, harmonize, or reinterpret a proposition.
2. Preserve context. Resolve pronouns, referents, commands, questions, contrasts, causal links, temporal relationships, conditionals, negation, modality, agency, and scope from the full passage rather than sentence fragments.
3. Preserve doctrine without inserting doctrine. Terms such as God, Lord, Father, Christ, Holy Spirit, sin, grace, repentance, faith, salvation, prayer, holiness, judgment, promise, and Scripture must retain the source meaning. Do not import a denominational interpretation that is not present in the source.
4. Preserve the author's pastoral stance and rhetorical force. Urgency, comfort, warning, exhortation, reverence, direct address, imagery, and emphasis may be expressed naturally in the target language but must not be intensified or weakened.
5. Prefer natural target-language grammar over mechanical word-for-word order, but never trade away meaning for fluency.
6. Do not introduce assistant voice. No notes, explanations, disclaimers, headings, applications, moral conclusions, or extra Bible verses may be inserted into the translated title/body.
7. Preserve meaningful capitalization and quoted emphasis where the source uses it rhetorically, subject to natural target-language conventions.
8. Preserve metaphor and imagery when intelligible. If a literal rendering would be misleading, use the closest natural expression that preserves the same image and force; do not replace it with a new illustration.
9. Names and historical references must not be localized into a different person, place, event, or tradition.
10. Numbers, dates, sequence, logical relationships, and explicit source claims must remain unchanged.

## Scripture quotation rule

A quotation embedded in a devotional is part of the devotional source unless BibleQuest explicitly binds it to an approved target-language Bible edition. Without such a binding, translate the quoted source faithfully in context. Do not silently substitute wording from another Bible version, invent a verse reference, or claim an exact target-version quotation.

If a target-language Bible wording is consulted for terminology or idiom, use it only as linguistic evidence. The devotional metadata must not imply that the translated quotation was copied from that Bible edition unless its rights and exact-version use are separately approved.

## Required translation prompt

Every AI translation pass must apply the following instruction contract in addition to the source text and locale:

> Translate this BibleQuest devotional from the supplied complete source revision into the requested target language. Preserve every proposition, qualification, negation, relationship, referent, image, rhetorical emphasis, theological term, and pastoral intent. Use natural, contemporary grammar that a fluent adult reader can understand, but do not summarize, expand, explain, modernize the theology, add application, add Scripture, remove difficult ideas, or insert interpretation. Treat quoted Scripture as source text unless an explicitly approved target Bible version is provided. Preserve the distinction between what the author states, quotes, commands, asks, and implies. Return only the translated title and complete translated body. If a phrase is genuinely ambiguous, resolve it from the surrounding source context; if the ambiguity cannot be resolved without changing meaning, fail the translation for review rather than guessing.

## Mandatory QA pass

Translation QA is a separate pass from generation. It must compare the complete source and target idea-by-idea and fail the candidate if any of the following is found:

- missing or added proposition;
- changed subject, object, agency, referent, tense/aspect with material effect, negation, degree, condition, cause, or conclusion;
- theological drift or added denominational interpretation;
- Scripture quotation or allusion whose meaning has materially changed;
- mistranslated metaphor or pastoral tone;
- target wording that is grammatically broken, materially ambiguous, or unnatural enough to obscure meaning;
- untranslated source-language material other than proper names or intentionally retained terms;
- title/body mismatch;
- translation bound to a stale source revision;
- missing translator, QA reviewer, QA timestamp, or target locale metadata.

The QA reviewer must reread the target as a standalone devotional after the source comparison. Passing semantic comparison is insufficient if the target is not coherent and natural in its own language.

## Ilocano-specific guidance

Use established Ilokano Christian vocabulary where it preserves the source meaning. V7's initial terminology anchors include `kararag` / `panagkararag` for prayer, `namnama` for hope, `ladingit` for sorrow/grief, `dagsen` for weight/burden, and `Apo` for Lord where context requires it. Terminology anchors are aids, not automatic substitutions; grammar and context still govern the final form.

For care/anxiety language, prefer established Ilokano idiom over Tagalog or English calques when the meaning is equivalent. Do not assume cognates are valid Ilokano without verification.

## Revision and review binding

- `translatedFromRevision` must identify the exact source revision translated.
- Any material source revision invalidates prior translation completeness until each target is regenerated or reconfirmed against the new revision.
- `reviewStatus: reviewed` means the translation passed this rulebook. It does not mean a human editor approved publication.
- AI QA must identify itself truthfully in `reviewedBy`; it must never impersonate a human reviewer.
- Publication/editorial review remains a separate content decision and cannot be granted by translation QA.

## V7 publication requirement

For every English-source devotional, release readiness requires complete reviewed current-revision translations for Tagalog, Cebuano, and Ilocano. Missing or stale coverage is a release blocker even when source rights and editorial review are otherwise valid.

The machine-readable enforcement is owned by `src/v7/content/devotional-translation-policy.js` and the V7 representative-content readiness gate.
