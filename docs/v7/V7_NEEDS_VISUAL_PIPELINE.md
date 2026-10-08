# V7 Lane A — Needs artwork queue and release contract

The Library's `LIBRARY_NEEDS` taxonomy currently contains **19 canonical Needs**. The first 30 emotion images remain P0. Once an agent has exhausted the high-priority emotion master/TYPE/THUMB backlog, it can start its assigned Needs queue before generic devotional/Home imagery.

The canonical mapping is derived from the actual ordered `LIBRARY_NEEDS` exports in `src/features/library/emotion-taxonomy.js`. `NEED_VISUAL_ASSIGNMENTS` in `scripts/v7-visual-assets-audit.mjs` allocates entry index modulo five agents without maintaining a second shared writable queue. Always read this mapping from the current checked-out source if the taxonomy is changed.

| Agent | Canonical Needs in production order |
|---|---|
| visual-agent-1 | peace, wisdom, rest, self_control |
| visual-agent-2 | hope, guidance, renewal, encouragement |
| visual-agent-3 | comfort, forgiveness, patience, trust |
| visual-agent-4 | courage, grace_identity, perseverance, celebration |
| visual-agent-5 | strength, healing, connection |

## Three-file publication contract

Use a single unique master record `data/v7/visual-assets/records/bqv7-need-<id>-01.json` with `family: "need"`, `contentType: "need"`, `contentId: "<canonical_need_id>"`, `canonicalNeedId: "<canonical_need_id>"`, `visualRole: "need_tile"`, `agentId` from the mapping, and `imagePath: "/v7/images/need/bqv7-need-<id>-01.<format>"`. Keep the source CLEAN master text-free. Portrait 4:5 artwork/crop is the design target (not a hardcoded brittle acceptance breakpoint).

For V2 complete bundles use `schemaVersion: 2`, `status: "production_ready"`, `bundleStatus: "complete_three_real_files"` and independently audited `CLEAN`, `TYPE`, `THUMB` variants with distinct real binaries, exact file metrics, rights/source attribution, accessibility, focal region and genuine reviewed QA.

For a Need TYPE image, `wordingEvidence` must identify `sourcePath: "src/features/library/emotion-taxonomy.js"`, exact current Git blob SHA `sourceBlobSha`, `canonicalNeedId`, `locale`, `exactLabel` from the matching taxonomy entry and only a Scripture `reference` listed in that entry; set `scriptureTextIncluded: false` unless a separate exact Bible-text provenance contract is implemented. TYPE `embeddedWording` must match verified locale label and reference exactly. Professional raster typography is approved for TYPE only; do not fabricate source text or font permissions. The app must use CLEAN plus localized live text when a matching TYPE locale has not passed QA.

A production-ready master is registered deterministically at `manifest.byContent["need:<canonical_need_id>"]`. A missing Need image is a valid empty lookup (fallback to a readable live-text card). Candidate derivative files and unresolved rights remain unpublishable; their mere presence does not satisfy bundle completion.

Validation: `node scripts/v7-visual-assets-audit.mjs` and `node --test tests/v7/visual-assets-audit.test.mjs`. Do not edit Lane B or D runtime UI, another agent's asset files or a shared mutable registry from this lane.
