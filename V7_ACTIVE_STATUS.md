# BibleQuest V7 Active Status

Updated: 2026-10-04 JST

Phase: P0 — contracts and boundaries.
Development branch: `v7/development`.
Production: V6 `7997d60e6069aa406ec005c32e33e46fee39bc12` on `main`.

Repository preparation is complete. P0-B has a working navigation/IA proposal at [P0-B Navigation and Information Architecture](docs/v7/P0_B_NAVIGATION_INFORMATION_ARCHITECTURE.md) on branch `agent/v7-p0-b-information-architecture`, based on `7d972a0ecdc048fc435e5ca44f94f6d7d38692d3`. It maps the 50 current V6 page-route keys into proposed product families and covers Library, discipleship curriculum, and small-group journeys. Cross-lane review found unresolved navigation and discipleship-scope decisions; P0-B is not integrated or complete. No runtime, database, authorization, or production change has been made.

V6 closeout evidence through `894ee1396e88704a6d552722a3498ddf2d6f57ae` remains preserved. Eight V6 acceptance rows remain OPEN; physical/manual waivers are not PASS, and authenticated production session observation remains unperformed. See the original V6 checklist for their evidence.

Canonical work folder: [work/README.md](work/README.md). The [rulebook](work/RULEBOOK.md) is the operational authority; the [V7 starting point](docs/V7_STARTING_POINT.md) records the development baseline and preserved contracts. V1–V6 lessons are consolidated in the rulebook and qualified issue ledger.

Next: the P0 integration owner reconciles A/B/C/D, ratifies the route placement and V7 discipleship scope, and freezes one contract before P1 begins. P0 remains open. Keep production `main` pinned until an explicitly authorized V7 promotion; preserve rollback references.

Repository cleanup archived 42 unreferenced V3–V5 root documents, repaired affected Markdown links, refreshed documentation entry points, and recorded release/rollback baseline. Runtime, tests, deployment workflows, migrations, and released build configuration were preserved. Existing deployment gate and inherited regression checks passed on the cleanup candidate; local evidence was on Node 24.19.0, while the certified production toolchain remains pinned to Node 22.23.2.

Superseded PR #1120 (older RC marker) and #1109 (assignment-push evidence superseded by final acceptance) were closed. PR #1119 is retained because its UI changes differ from the released baseline and must not be silently deleted or merged. Existing historical branches remain for traceability; frozen release and rollback references were checked remotely.

V7 implementation changes must use the existing PR gates only after confirming their branch filters include the V7 branch. This documentation work does not create replacement infrastructure.
