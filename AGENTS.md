# BibleQuest agent instructions

## V7 image-work policy — 2026-10-11 (supersedes older artwork staffing/size/manual-approval language)

**Mandatory first read:** [Image QA automation and work ledger](docs/v7/V7_AUTOMATED_IMAGE_QA_AND_LEDGER_20261011.md). It governs ALL image work on V7 in every new chat, project lane, QA automation and scheduled task. When older documents disagree, use this policy while retaining stronger Scripture, rights, security, provenance and exact-SHA release safeguards.

- ONLY explicitly user-invoked interactive ChatGPT chats create/repair/derive image pixels. All five hourly visual agents are QA-only (scene/Scripture, rights/wording, technical/responsive, uniqueness, coordination). **No routine human visual approval or owner sign-off is a V7 artwork acceptance step.** Automated agent decisions must be backed by independently observable pixels/evidence; missing evidence remains HOLD rather than imaginary PASS.
- Native generator output is acceptable after deterministic crop/format export to **1024×1024 square**, **768×960 4:5**, or **1536×864 16:9 hero** minimum; THUMB has separately defined smaller minimum. Higher is welcome, but not required. No fake upscaled-resolution claim, SVG, canvas placeholder or text burned by the generator.
- Before ANY image request, check [committed attempt ledger](data/v7/visual-assets/production-ledger.json), the matching exact-ID construction-guide chapter, existing production/candidate/rejected sidecars **and open PRs**. Claim the exact content ID + variant + source/scene revision in a committed ledger update before generation; concurrent claims must reconcile on Git merge. Do not reproduce QA-pending or finished pixels.
- QA uses `scripts/v7-image-work-ledger.mjs` to choose the next waiting asset; on FAIL reject **and delete its unapproved staged candidate bytes immediately**, retain only tiny hash/scene/reason tombstone, then continue reviewing the **next** available candidate in the SAME run. Never delete approved CLEAN sources, unrelated variants or user content.
- An individual agent PASS is NOT final approval; all five independent role evidences plus unchanged canonical binary, source/rights/Scripture and exact-SHA browser/release gates are necessary. QA agents may report/triage/reject, not create images or forge QA state. Lane D alone releases V7.


Start at [work/README.md](work/README.md). The [rulebook](work/RULEBOOK.md) is the single operational policy for new work. Read its fast-start section and only task-relevant sections; do not execute every listed check for every task.

Use current status and live branch/CI evidence. Fetch the task baseline once, make bounded changes, run affected existing checks, integrate or publish the result and leave an exact handoff. Do not redo completed certification, create replacement infrastructure or stop at reporting a plan.

Use one executor by default. Parallel agents require explicit authorization or applicable instructions, disjoint ownership and one integration owner. Older fixed staffing/scheduled-worker protocols are historical, not automatic V7 requirements.

Production main, rollback references, valid tests, migrations and user data remain protected by the rulebook. Never fabricate physical evidence or turn waivers into PASS. User instructions and already-established authorization take precedence over routine process preferences.

## V7 artwork — mandatory across chats and agents (2026-10-10)

For **any** BibleQuest V7 image-related task in **any** chat, agent, manual lane X/Y/Z, scheduled producer, QA, Lane A/B/C/D or release integration, first consult [V7 unfinished-artwork construction guidebook](docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md) and the **matching individual image scene chapter**. This is a required project contract, not an optional creative suggestion. It applies to generation, repairs, reused legacy art, acceptance, reviews, registry changes and releases. The guide supersedes older generic scene suggestions where they conflict, but never waives Scripture, rights, security, privacy, or release gates.

Do not create a generic substitute scene, low-detail vector/SVG, contact-sheet crop or duplicate variant. Produce original high-resolution WebP/PNG, exact source-ID narrative, source-bound professionally raster-typeset locale TYPE and separate text-free focal THUMB when required. Before claiming complete, check approved **and unmerged** art/QA-rejected pixels, hash/size/format, source/rights/Scripture context, actual responsive previews and independent artistic QA; require exact-head release proof by Lane D. Sound CLEAN source scenes stay unchanged for TYPE/THUMB-only defects. Every new/reworked scene follows the guidebook's preflight and explicit revision/novelty rules. Reviewer cannot waive those rules just by changing status fields.

If the guidebook is not yet on the branch used for a task, read its review branch `docs/v7-complete-artwork-construction-guide-20261010` / PR #1481 first, refresh source identities from current `v7/development`, and **do not** fall back to old generic prompts. Prefer a bounded hold over generating unreviewable art. Record exact guidebook revision/shot ID in each image PR handoff.
