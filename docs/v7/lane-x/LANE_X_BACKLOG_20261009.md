# BibleQuest V7 — manual Lane X visual backlog

Snapshot: 2026-10-09 JST, `v7/development` (re-query live GitHub before claiming an assignment). This is a **source-level inventory**, not a claim of visually approved or publicly served images.

## Scope / no overlap

Lane X runs **only when explicitly invoked**. It produces original standalone artwork for **missing Feelings, Needs, and Home hero** cards. It does not repair older candidates (Lane Y), produce 300 distinct devotional covers (Lane Z), edit the runtime/release gates (Lane D), or reassign five visual-agent work partitions. Never replace an in-flight or original source asset without first checking its current PR/record.

The real source-of-truth remains the ordered exports in `src/features/library/emotion-taxonomy.js`, visual records in `data/v7/visual-assets/records`, the original asset bytes in `public/v7/images`, and `docs/v7/V7_VISUAL_ASSET_PRODUCTION_20261008.md`.

## What is actually represented on integration

- Feelings: **22 master records among 30** taxonomy entries (not equivalent to 22 release-ready, approved image bundles). **8 canonical feeling concepts are absent** from this integration snapshot.
- Needs: **0 master records among 19** canonical Needs on integration; a separate Peace candidate exists in PR #1421 and a Rest candidate now exists in Lane X draft PR #1445.
- Home: **0 hero master records on integration**, with one separate Home candidate in PR #1429.
- The historical scripts, sidecar claims, metadata, draft PRs, and contact sheets **do not count as published assets**. Pending QA remains pending unless independently evidenced.

## Eight Feeling gaps in this snapshot

| Queue concept | Canonical emotion | Evidence / immediate action |
| --- | --- | --- |
| anger | angry | Original three-WebP candidate PR #1438; **do not duplicate** |
| insecurity_unworthiness | insecure | Candidate PR #1423; **do not duplicate** |
| doubt | doubtful | Candidate PR #1439; **do not duplicate** |
| overwhelm | overwhelmed | Lane X CLEAN/TYPE/THUMB draft PR #1434; source-level QA commented; **do not duplicate** |
| stress | stressed | No integration master in snapshot; check newest PRs and generate a distinct commuter/pressure scene only if still unclaimed |
| tiredness_weariness | tired | No integration master; distinct exhausted-caregiver scene (not Rest Need) if still unclaimed |
| frustration | frustrated | No integration master; a craft/workbench failure narrative distinct from Anger |
| numbness_emptiness | numb | No integration master; a quiet disengaged commuter scene distinct from Loneliness |

## Nineteen Need IDs

Five-agent ownership is determined from `NEED_VISUAL_ASSIGNMENTS` (the canonical taxonomy order modulo five). Listed here for work claiming, **not** as published:

| Assigned agent | Need concepts |
| --- | --- |
| visual-agent-1 | peace (candidate PR #1421), wisdom, rest (Lane X candidate PR #1445), self_control |
| visual-agent-2 | hope, guidance, renewal, encouragement |
| visual-agent-3 | comfort, forgiveness, patience, trust |
| visual-agent-4 | courage, grace_identity, perseverance, celebration |
| visual-agent-5 | strength, healing, connection |

The new Lane X Rest asset records agent ownership as visual-agent-1 to match the official static validation contract, but is manual-Lane-X-authored and **not claimed as a passed agent run or production delivery**.

## Home

- Hero candidate: `bqv7-hero-home-01` PR #1429. CLEAN 16:9 and cropped THUMB are pending rendered/aesthetic/browser QA. TYPE intentionally excluded pending approved Home copy.
- Do not create duplicate Home artwork just because it is not yet merged.

## Actual verification done in this invocation

1. Read back exact GitHub file contents for PR #1434 (Overwhelmed) and PR #1429 (Home). Standalone SVG paths exist and reported byte lengths match; source-level scans found no remote image/font imports, data-URI embeds or baked wording in CLEAN/THUMB. Overwhelmed TYPE text nodes contain only `Overwhelmed` and `Matthew 11:28`, consistent with taxonomy. Comments posted on those PRs; this does **not** count as rendered visual QA.
2. Added manual Lane X Rest source art: an original single-scene self-contained SVG CLEAN and focal THUMB, a source-of-truth sidecar with exact per-file SHA-256 measured after GitHub readback, and declared production blockers in PR #1445. No TYPE or biblical prose generated.
3. No generated dashboard/contact-sheet image was accepted as an asset. Never upload promotional boards, invented completion figures or contact-sheet extracts as standalone artwork.

## Next real completion steps

1. On current HEAD, choose the earliest **unrepresented and unclaimed** concept, preserving other agents' PRs.
2. Produce *one original single-scene master*, not an asset grid, and a separately decoded/cropped THUMB; optional TYPE only with approved exact locale label and Bible reference.
3. Inspect actual rendering including 100-pixel card readability, anatomy/materials, composition, duplicate scenes, no fake text; reject as needed.
4. Verify binary or SVG source file hashes/bytes/dimensions, sidecar, typography/Scripture source blob, and inspect screenshots of the built app at 320/390/430 CSS px.
5. Keep metadata as candidate until exact-head visual audit, rights/content review and Lane D release certification pass. Production metrics must count only approved, physically present and app-consumed assets.

No claim of completion, merge or deployment follows from this snapshot.

## October 10, 2026 — verified delta (supersedes counts above; source inventory only)

- `v7/development` master-record inventory as independently checked today: **22 / 30 Feelings**, **1 / 19 Needs (Wisdom)**, **0 Home**. PR #1454 landed Wisdom's original three-WebP artwork; this does not imply deployed-browser approval of every card. Other Needs have active draft producer PRs and must not be independently duplicated.
- The manually produced Rest candidate in PR #1445 now contains **three separate real SVG files**, not two: CLEAN 1024×1280, TYPE 1024×1280 with exact EN-only `Rest` and `Matthew 11:28-30`, THUMB 384×480. SHA-256 and byte counts are bound in the metadata on the draft branch.
- `tests/v7/lane-x-rest-candidate.test.mjs` adds three targeted Node regression cases: the canonical manual-candidate integrity verifier, standalone SVG/TYPE source policy, and sizes/hashes/portrait crop. The tests are committed but their actual CI results must be inspected; source-level assertions are not evidence of rendered pixels.
- The Rest PR was reconstructed on the then-current `v7/development` base via a compare-and-swap ref update without editing integrated assets or other lanes. It remains intentionally **draft and unpublished**, pending rendered aesthetic inspection, 320/390/430 mobile app proof, exact-head canonical audit and release checks.
- Do not update the prior date-stamped baseline to count pending PR candidates as approved production assets. Always re-run the live registry audit when reporting published coverage.

### October 10 — actual browser QA correction (supersedes earlier Rest pending label)

- PR #1445 Rest now has exactly three distinct physical SVGs with measured metadata, but **artistic QA FAILED**: the exact-head [Chromium artifact](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37996649857) accepted the three source files for decode/phone geometry at 320/390/430, while independent inspection of its TYPE/THUMB PNG screenshots found a low-detail flat-vector look inconsistent with the photographic/editorial visual requirements. `report.json` says technical-only pass, `publicationApproved:false`. Sidecar status is now `candidate_visual_quality_repair_required`; do not merge/promote. A genuinely cinematic photo-style original replacement is needed; do not relabel the existing vector as compliant.
- PR #1434 Overwhelmed: [Chromium run](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37996842055) itself was green, but exact run artifact `report.json` **rejected** this candidate as `TYPE has an explicitly failed visual/wording QA check`. No Overwhelmed screenshot was made and no candidate pass can be claimed. Preserve quarantine until an independently reviewed replacement.
- PR #1429 Home: source-only original clean + thumb remains draft; the standard Feeling/Need candidate triage does not validate `hero` records. A separate `tests/v7/lane-x-home-hero-candidate.test.mjs` structural/hashing/unit gate was added on the Home draft branch; it must not be mistaken for built Home card/browser aesthetic approval.

**Production accounting must distinguish file exists, source/hash verified, Chromium fixture decoded, independent artistic acceptance, app-served and integrated.** Never report one column as another or treat a green workflow as QA approval for excluded candidates.
