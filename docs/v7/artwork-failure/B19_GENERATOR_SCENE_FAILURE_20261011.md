# BibleQuest V7 manual batch B19 — failed generation, no eligible pixels
Date: 2026-10-11 JST. Source branch: `v7/development`. Attempt PR: #1513.

## Locked source IDs / available slots

- `devotional.biblequest.anger.03`, `r1`, source `content/v7/devotionals/biblequest-original-emotions-03a.json`, checksum `sha256:42b41e6a946294d5dde344b2a67743fcf28bba7ea0a138cc6e8549fc66aeb714`. Guide: `03-third-narrative-shots.md` electronics-lab technician relaxing hands at workbench before calm dialogue.
- `devotional.biblequest.doubt.06`, `r1`, source `content/v7/devotionals/biblequest-original-emotions-06b.json`, checksum `sha256:52a5ef797f18a897b3336ca4861392c7021ec568cab1b60aa79e0c7c47b3fe13`. Guide: `06-faithful-action-shots.md` researcher seeking tutor.
- `devotional.biblequest.tiredness_weariness.09`, `r1`, source `content/v7/devotionals/biblequest-original-emotions-09b.json`, checksum `sha256:e0bd9f5be4ae887a2412139ec67a48b952bd03bc462a0c915437e7f01b79f8b8`. Guide: `09-trustworthy-sharing-shots.md` fatigued overnight worker requesting proper rest break from shift lead.

Open PR search found no matching active artwork for these exact IDs at task initiation. These are source-confirmed projects, NOT completed artwork.

## Execution and producer preflight

Claims were committed in `20d1fab0b435aa9b36e1f76af36d1e07eb434684` and exposed by PR #1513 before generation, honoring cross-chat discovery.

Three distinct generation attempts for the first target all failed the explicit electronics-lab scene and 4:5 source geometry (each 1536x1024 landscape). The generation metadata reported an empty prompt field even though source-bound instructions appeared in the conversation:

1. `a7139828-7f93-4a2e-8c8f-8ded7d500abd`: robed figure outside at sunset. Wrong era, subject, action, camera, and aspect. Measured 1536x1024; 2,236,363 bytes. Bytes deleted locally; SHA not captured.
2. `609e6178-8768-48dd-bab4-f60cebb5b527`: robed figure above old town at sunset. Same wrong concepts. 1536x1024; bytes deleted locally; SHA not captured.
3. `74173f5a-3e8d-4337-847a-b7de75133f9d`: robed group and footwashing. Wrong era, scene and devotional meaning, 1536x1024, 2,335,036 bytes, SHA-256 `b993496bfa44ead15466cafb90b9f1eeb8b5bb985f44bea2e47f3fe3651039dd`. Bytes deleted locally.

All failed producer-side scene+format checks, so there is NO `qa-candidates` image, production sidecar, independent QA verdict, acceptance or candidate PR with actual images.

## Collision and handoff

- The first slot's failed attempt stays as a *rejected tombstone* on this branch, with third-image SHA and generation IDs. No rejected pixel bytes retained.
- The second and third tasks were NOT generated. Their earlier claims have been withdrawn; they are available for future manual ChatGPT image production.
- The first ID may be retried only as a fresh claim/attempt with new `sceneRevision` and independently verified scene fidelity. Do not re-use failed scenes/hashes.
- **Never** merge these pixels into production, do not award any of the three image credits, and do not fabricate five-agent PASS evidence.
- Generator output not honoring a source-locked scene is a concrete provider/tooling blocker. If this continues, leave items eligible for a different interactive generator session rather than consume more unsuccessful batch attempts.

This is a failure record and is not independent artwork QA or a release gate waiver.
