# V7 Lane Z — Independent TYPE wording and reference QA

Status: bounded companion QA workstream proposed 2026-10-09. This is not one of the four canonical product lanes; A/B/C/D ownership remains unchanged.

## Scope

Read-only audit of V7 `data/v7/visual-assets/records/*.json` metadata, including older `*-derivatives.json` sidecars and embedded V2 variants. Flags a TYPE title that differs from the exact canonical locale label in `emotion-taxonomy.js`, a reference outside the selected emotion/need taxonomy record, an inconsistent item ID, stale revision-pinned wording proof, and unsupported TYPE locale. Separates candidate-only problems from defects in inline TYPE variants explicitly marked `production_ready`.

Run:

- `node scripts/v7-lane-z-wording-qa.mjs` — JSON report; nonzero exit only for errors in published variants or malformed/unpaired records.
- `node scripts/v7-lane-z-wording-qa.mjs --strict` — also nonzero for candidate TYPE metadata errors.
- `node --test tests/v7/lane-z-wording-qa.test.mjs` — deterministic unit regressions.

## Ownership boundary and evidence limits

Lane Z adds only its own validator, tests and this document. It does not modify source art, image metadata, binaries, live Bible text, review decisions, the Library runtime or D's release gate. The canonical production lanes and the already-open universal Scripture-integrity PR #1415 remain authoritative.

The validator deliberately does **not** assert that any image pixels contain the declared words, the typography is readable, a Bible edition's quoted wording is accurate, the verse exists, that Scripture is interpreted in context, or any rights/review/deployment gate passed. Those require independent review and production checks. Lack of structured revision proof, visual QA, or separate exact-quote/context review is explicitly reported as pending rather than silently approved.

Existing Temptation derivative work includes a corrected candidate `Tempted` in its metadata while retaining a documented earlier mismatch; the validator validates the *current candidate wording*, without treating the candidate or its claim of browser QA as production-certified.

Do not promote a candidate solely because this metadata audit passes. In particular, preserve locale-aware CLEAN + live-text fallback until actual TYPE artwork, rights, byte hashes and built-app/browser evidence pass A/B/D gates.
