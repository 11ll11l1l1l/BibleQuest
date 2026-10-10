# BibleQuest V7 — Manual ChatGPT Artwork Only / Scheduled QA Only
**Binding user decision:** 2026-10-11 JST. **Applies to all image families, lanes, chat instances and scheduled visual agents.**
**Priority:** this policy supersedes contradictory producer/generation assignments in older V7 image documents, queue files, agent prompts and task plans. It does not waive quality, rights, privacy, Scripture, release or exact-SHA gates.

## 1. Who may make image pixels

- **Only an explicitly user-invoked, interactive ChatGPT chat instance** may generate or revise a V7 image. This includes all new Feeling, Need, Home hero, devotional cover, book/teaching thematic artwork, plus any re-generation, retouch, upscale, crop, CLEAN/TYPE/THUMB derivative, raster typography, and repair of image pixels. The user drives each image or bounded batch in chat; there is **no autonomous image generation**, periodic generator, cross-agent generation delegation or background image task.
- The active scheduled artwork agents are **QA-only**. They MUST NOT call image generators, invoke other image-generation services, produce procedural/vector images, compose text on art, run render/export tools to create altered image bytes, or write/replace any image binary. Do not make a new PR carrying agent-authored image bytes. They may read files, perform static/media/browser QA, gather evidence, document defect-specific remediation and comment on candidate PRs.
- Manual ChatGPT X (P1 Feelings/Needs/Home), Y (P1a image variant repair) and Z (P4 300 distinct devotional covers) are queues **for user-invoked chat conversations only**, never autonomous workers. Queue/scene generation prompts are reference material for those chat conversations, not permission for an agent to run them.
- Do not introduce alternate images by generating an SVG, a vector, an image-producing script, a contact sheet, a model-rendered multi-panel graphic, synthetic screenshots, or renamed/raster-wrapped files.
- All existing **agent-produced** candidates remain historical QA evidence, not newly approved manual-chat work. Record original provenance honestly; triage as HOLD/rejected or request explicit user disposition. Never relabel their origin as manual chat or copy/reuse rejected bytes to evade this policy. Production-accepted existing assets do not become invalid solely because the policy changed; new or changed bytes must use the manual path.

## 2. How manual-chat image submission works

1. Read the whole correct devotional content or canonical taxonomy + Scripture context, rights, exact revision, construction guide and actual accepted/pending/rejected scene inventory before generation. Choose ONE exact asset ID, scene and crop/format contract.
2. Generate **one standalone image at a time in the chat**; reject wrong-scene, collage, fake text, anatomy errors or near-duplicates before transferring files. Retry only at the user's direction in an interactive chat.
3. Export each required actual separate high-resolution raster file in that same user-invoked conversation (CLEAN/TYPE/THUMB if the category requires them). Do not silently replace image generation with hand-coded drawing. TYPE is exact reviewed locale + reference only; CLEAN and THUMB text-free; no SVG artwork.
4. Create a durable candidate PR without touching the published registry, `main` or deployments. Include the exact image files plus source-bound metadata, file dimensions/bytes/SHA256, original creation context, one unambiguous manual ChatGPT chat reference or user-supplied session identifier, scene ID/revision, asset-level rights, and user review status **PENDING**. Never fabricate a chat-session reference or verification evidence. If a chat reference cannot be shared, record `manualEvidenceStatus: pending_private_user_confirmation` and HOLD until the user explicitly confirms it. Preserve rejected hashes, avoid uploading rejected artifacts, and do not treat uploader identity as production approval.
5. Hand the candidate to QA agents. A GitHub CI PASS, self-declared `origin` field, or a passing byte checksum alone **cannot prove** that pixels came from manual chat or that the image is visually correct. Independent source review and explicit user art acceptance remain separate.

## 3. Four QA specialties + independent verdict

| Scheduled role | Exclusively allowed evidence work |
| --- | --- |
| QA Scene / Scripture (former producer 1) | Exact story, devotional meaning, approved verse context, scene/action/camera, correct subjects |
| QA Rights / Wording / Provenance (former producer 2) | Original source/licensing, manual chat evidence, typography and canonical wording/locale, consent |
| QA Technical / Browser (former producer 4) | Real binary SHA/bytes/dimensions, no SVG, all variants, safe areas, 320/390/430/800px and 200%, built-served bytes |
| QA Uniqueness / Art Direction (former producer 5) | Duplicate/near duplicate, composition, believable anatomy, 100px legibility, visual design and content fit |
| QA Independent Coordinator | Collect distinct specialist outcomes; publish independent QA disposition, never self-create/approve imagery |

- `PASS`, `FAIL` and `HOLD` are **dimension-scoped**. A reviewer must inspect the real pixels before a visual PASS and cite the actual PR head, asset ID, variant and evidence. Missing image access, absent source/right/context, stale CI or missing user approval are HOLD, never PASS.
- QA-only agents may create evidence reports and PR comments, but **not** edit image binaries or candidate approval/source flags, fix art, infer acceptance, create publication manifests, merge or deploy. They send a specific correction request back to a **manual ChatGPT image conversation**. No generator agents are permitted as a fallback.
- A/Content Review checks rights/Scripture and user approval; Lane D remains the sole final exact-SHA integration/release certifier. Nobody may convert technical QA into user approval automatically.

## 4. Release and backlog controls

- P1 retains **30 Feelings + 5 launch Needs (peace, hope, comfort, courage, strength) + Home hero**. P4 retains **300 distinct original first-party devotional covers**; P4 does not block the minimum P1 launch. Last historical counts are not a real-time re-audit.
- Work manual-chat one ID at a time (or user-directed bounded batch); prioritize repairing a failed variant without discarding sound CLEAN; never multiply near-duplicate PRs.
- Existing guidebook G0–G6, rejected-hash policy, independent Scripture and rights checks, true raster sizes, identity-integrity audit, user art QA, and exact deployed SHA remain mandatory. A candidate with incomplete independent evidence stays non-production.
- No change here permits automatically creating, scheduling, commissioning or approving image-generation tasks. When a reviewer has no real pixels, provide an actionable HOLD/report rather than generate an example.

## 5. Agent startup instruction

Before any visual task, read this file and `AGENTS.md`. If an older instruction says "produce one image per run", "regenerate after QA", "five generators", "continue producer", "manual lane autonomously", or "self-QA then commit artwork", treat that instruction as **revoked**. The sole authorized scheduled task is review of already-submitted images, not creation. New artwork may start only when the user manually invokes a ChatGPT image-generation conversation.

## 6. Machine-checkable new-image intake

All changed image binaries in a PR against `v7/development` must have **one** candidate receipt matching the actual image path and SHA-256 at:

`data/v7/visual-assets/manual-chat-intake/<first-20-hex-of-sha256-of-repository-relative-image-path>.json`

The image-path hash determines the receipt **filename**, while `sha256` inside it identifies the image **bytes**. The manual-chat conversation can author this JSON during explicit interactive submission:

```json
{
  "policyVersion": "2026-10-11",
  "assetId": "bqv7-emotion-example-01",
  "imagePath": "public/v7/images/emotion/bqv7-emotion-example-01.webp",
  "origin": "explicit_user_invoked_chatgpt_chat",
  "reviewStatus": "pending_qa",
  "sha256": "<measured 64-character SHA-256 of real image file>",
  "chatEvidence": {
    "origin": "explicit_user_invoked_chatgpt_chat",
    "reference": "<real user-supplied nonsensitive chat identifier>",
    "userConfirmationStatus": "pending_private_user_confirmation"
  }
}
```

Never fabricate a reference, actual hash, or user confirmation. A private chat can use a **nonsensitive user-provided identifier** and remain `pending_private_user_confirmation` until independently verified. An unsupported claim of confirmed provenance is not evidence. The PR guard checks presence, schema and **real image-byte** equality only; it cannot establish who generated the pixels. Reviewers must separately verify origin and quality and obtain explicit user art approval. Existing art files untouched by a PR are not rejected because they predate this rule; **changed** legacy candidate bytes must follow the new intake path and cannot falsely re-label agent work as manual.

CI: `node scripts/v7-manual-chat-origin-gate.mjs --base <exact_base_sha> --head <exact_candidate_sha>`, then `node --test tests/v7/manual-chat-origin-gate.test.mjs`. This is a **candidate PR rule**, not a global release approval.
