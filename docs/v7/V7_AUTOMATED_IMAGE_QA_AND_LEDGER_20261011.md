# BibleQuest V7: automatic image QA, work identity and deletion contract
Effective 2026-10-11 JST. Binding for every V7 chat, five scheduled agents, X/Y/Z, A–D, any task or workflow that touches artwork. Entry points: `AGENTS.md`, `work/README.md` and the complete construction guide.

## Authority, roles and accepted interpretation

The user's updated order replaces older requirements for a human to individually approve every generated image. **Five independent autonomous agent reviewers own 100% of image QA**: scene/Scripture, rights/wording/provenance, technical/format/crop, visual originality/aesthetics, and QA coordination/consolidation. They are QA-only: never make, edit, upscale, retouch, typeset, crop, regenerate, or export pixels and never launch image generation. The sole generator is an expressly user-invoked interactive ChatGPT image-production chat (manual X/Y/Z or equivalent). The human can audit after the fact, but human review is **not a blocking QA gate**.

No agent may mark a visual PASS when it did not actually inspect source pixels and comparators. If the environment cannot show the bytes/screenshots, HOLD that candidate and **immediately take the next independently reviewable candidate**. Automated five-agent QA is a work assignment, not proof every submitted image is automatically acceptable. Fail-closed Scripture/rights/privacy, exact release audits and observed browser checks are unchanged.

Five roles, in order of independent evidence:
- **scene:** exact locked ID/shot, original whole source body, Scripture meaning (speaker/audience/scope), text-free CLEAN and contextual integrity.
- **rights:** manual-chat generation provenance, usage/font/content rights, exact locale labels and only permitted Scripture reference, source revision.
- **technical:** real PNG/WebP decode and SHA, native dimensions/aspect, byte limits, 320/390/430/800 built views, 100px thumb, typography and actually served image hashes. No SVG.
- **uniqueness:** compare against approved + open PR + rejected history; action/setting/people/camera/lighting, anatomy, natural realism, novelty, mobile semantics.
- **coordinator:** independent consolidation of four reviews, evidence completeness, exact PR head, deletion/retry and safe release handoff. Must not fabricate any missing pass.

## Achievable final pixel requirements — native raster, not fictional upscale

| Family | Minimum release CLEAN/TYPE | THUMB minimum | Preferred when tool can genuinely deliver |
| --- | --- | --- | --- |
| Feelings 1:1 | **1024×1024** | 320×320 | 1024×1024 or larger native |
| Needs, devotionals and original thematic portraits 4:5 | **768×960** | 384×480 | 1024×1280 if natively available |
| Home hero 16:9 | **1536×864** | 640×360 | Native landscape with adequate crop room, e.g. 1536×1024 source cropped to 1536×864 |

These are **release output** minimums, not a request for a model to generate a specific unsupported dimension. Generator-native dimensions may have a different aspect ratio: use one honest derivative crop/export **only inside the user-invoked interactive image chat**, without distorting people/faces or enlarging a lower-resolution source to claim compliant pixels. If the source cannot support the minimum after crop, reject that candidate instead of accepting interpolation as true detail. Ratio tolerance ±2.5%; PNG/WebP actual encoding, max 10 MB. Existing original candidates at 1122×1402 4:5 meet the new portrait resolution floor (subject to their actual source/semantic QA). Standard P4 devotional original images need only ONE distinct CLEAN; TYPE/THUMB are optional for the P4 tally. Existing variants must not be regenerated just to chase an aspirational larger size.

Header-level native-size and encoded-format checks (not a full decoded-pixel visual inspection) are executable at `scripts/v7-image-work-ledger.mjs submit`. Existing release candidate/coverage audits remain binding; any other file with conflicting legacy high-resolution prose must not be used as a rejection rule unless it is a real executable release requirement.

## Central ledger and collision contract

Repository-owned machine-readable record: `data/v7/visual-assets/production-ledger.json`. Operational CLI: `scripts/v7-image-work-ledger.mjs`. Source-of-truth evidence is a **union** of this ledger, existing production + pending sidecars, open PRs, published assets, and SHA-bound rejected history. A newly opened chat must **first** read the union, not trust that the ledger has yet backfilled every historical candidate. The ledger initially reserves the five real merged `candidate_qa_pending` Lane-Z covers from PR #1476; older Feeling/Need PRs must be reconciled by canonical ID/variant before a new claim. Successful existing CLEAN images remain frozen if only TYPE/THUMB is bad.

Slot key: `family:canonicalContentId:variant`. Each attempt has an immutable unique ID, manual-chat producer identity, exact source/scene revisions, claim timestamp, per-role verdicts/evidence, optional candidate path, SHA and measured pixels. A failed attempt becomes a **tombstone** with a bounded reason; never reuse the same sceneRevision for its slot. Tombstones persist for dedupe/forensics without keeping rejected pixels.

Usage from a checked-out current `v7/development` branch:

```bash
node scripts/v7-image-work-ledger.mjs status
node scripts/v7-image-work-ledger.mjs next scene
node scripts/v7-image-work-ledger.mjs claim devotional devotional.biblequest.anger.01 CLEAN bq7-anger01-r1 manual-chat-z r1 shot-v2
# In the interactive image chat, create a single original PNG/WebP:
# data/v7/visual-assets/qa-candidates/bq7-anger01-r1.png
node scripts/v7-image-work-ledger.mjs submit bq7-anger01-r1 data/v7/visual-assets/qa-candidates/bq7-anger01-r1.png
node scripts/v7-image-work-ledger.mjs qa bq7-anger01-r1 scene PASS https://github.com/11ll11l1l1l/BibleQuest/pull/1234
node scripts/v7-image-work-ledger.mjs qa bq7-anger01-r1 technical FAIL "Decoded source has missing image data"
node scripts/v7-image-work-ledger.mjs next technical
node scripts/v7-image-work-ledger.mjs audit
```

These are command examples, **not evidence** that the sample devotional ID, PR, file or image exists. Actual commands must use verified live IDs, provenance and evidence URLs. A successful `claim`, `submit` or `qa` changes a file locally. **Commit/PR the ledger state and run its audit; it is not persisted on GitHub until integrated.** Use one serialization owner or Git conflicts/compare-and-swap against the current branch head for concurrent writes. Before generation, ensure the claim is already discoverable in the canonical GitHub branch or registered intake PR: local-only claims do not prevent parallel chats from duplicating work. If a live PR already has a claim, skip it and choose another unique ID.

## QA loop — no single-image blocking

At each scheduled run, review **as many existing candidates as can be checked within the run**, not just the oldest asset. Each role calls `next <role>`, opens the exact PR/bytes, checks the relevant evidence and records one of:
- **PASS**: concrete separately inspectable GitHub PR/comment/CI/screenshot evidence for that role and exact unchanged candidate SHA; no blanket approval based on other agents' marks.
- **FAIL**: reject the candidate or exact bad variant immediately, mark a bounded reason, **remove its unapproved staging pixels** and related unapproved candidate-only sidecars, and advance to the next candidate in the **same run**. Reassignment to an image-production chat uses a new attempt ID and sceneRevision or fixes only the failed TYPE/THUMB.
- **HOLD**: missing readable pixels, rights/source mismatch, inaccessible CI or uncertain Scripture. Do not claim PASS; mark precise missing evidence then advance to the next candidate without waiting for an hourly update. A later run may re-queue HOLD only if new evidence actually arrived.

In the CLI, a role's verdict is sticky; on HOLD only, after genuinely new linked evidence the coordinator may explicitly run \`requeue <attemptId> <role> <newGitHubEvidenceUrl>\`; the prior HOLD is retained in reviewHistory. A FAIL requires a new attempt/scene or verified derivative fix, never silent rewriting. Five distinct role PASSES change only ledger status to `qa_passed`; Lane A still binds the genuine binary to a canonical production sidecar and existing immutable approval mechanism, and Lane D checks the exact integrated build/release SHA. No human approval flag is required. Agents cannot publish assets by toggling a status without the existing pixel/source/content evidence.

**Deletion scope:** CLI removes a technically failing/rejected candidate's unique staging file only under `data/v7/visual-assets/qa-candidates/<attemptId>.png|webp`. A successful deletion is required before the ledger can record FAILED. Never delete common reusable approved CLEAN source, production registry/metadata or unrelated library content. Failed image bytes must not be committed to production or retained in staging after FAIL. Candidate-specific abandoned local exports/previews should also be removed by the owner; keep only one small no-image audit tombstone. Previously merged rejected images outside this staging subtree require safe provenance/reference audit before deletion; otherwise quarantine them and open a precise cleanup task. Do not rewrite Git history or purge certified rollback refs.

## Required preflight for EVERY new chat and image QA agent

1. Read this policy, `AGENTS.md`, guidebook `00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md` and the *one* matching shot chapter; check latest V7 status and existing rights/Scripture.
2. Inspect current ledger (`status`, `next`), **all current open image PRs** and `data/v7/visual-assets/records/**`. Reconcile any existing candidate/claimed/rejected source ID first; do not produce a second image just because its first PR is unmerged.
3. For a generator chat, make and commit a unique slot claim and only then render. Avoid any rejected visual fingerprint/sha. If a slot is already owned/pending/accepted, immediately choose a different missing slot.
4. For any QA agent, process another queued candidate immediately after FAIL/HOLD/PASS; do not call image generation or make a replacement file. Append per-asset/variant proof and exact PR SHA.
5. Verify staged byte deletion, run `node scripts/v7-image-work-ledger.mjs audit` and existing `v7-visual-candidate-policy`, `v7-visual-assets-audit` and Lane-Z image integrity checks as appropriate. QA counts only evidence-backed unique canonical slots; never count claims as accepted artwork.

## Continuous application and limits

The existing **five hourly QA automations** are independent role reviewers, not image producers. They run only when scheduled; there is no claim of instantaneous background execution, no external paid image service, and no automatic replacement artwork generation. Within one scheduled execution they must continue past failures without waiting for the next scheduled run. Automated pixel/semantic QA is limited by what candidate image, sidecar, source text and screenshot evidence those agents can access. If they cannot observe actual pixels, they hold the slot and continue to another rather than inventing success.

Existing `docs/v7/V7_EIGHT_STREAM_ARTWORK_EXECUTION_20261009.md` producer timetable and older guidebook human-approval wording are historical **and superseded for artwork production/QA only**. All stronger release privacy/rights/Scripture/source-integrity and ownership contracts remain in force.
