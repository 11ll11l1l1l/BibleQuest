# Lane B — ONE 2 ONE workspace composition contract

Original starting integration: `9b2b084c6dd119cfa39d89a4e52628884acf2c73`; rebased before review onto `4a6a2078412ec891dda51294d105133f3313e168` after concurrent non-overlapping V7 integrations landed.

The Lane B preparation page, assignment authority, and immutable mentor-journey contract already had separate coverage, but the actual `createV7WorkspacePage` composition that joins those boundaries did not. Add a focused integration contract against that real composition instead of duplicating lower-level tests.

The contract covers:

- the shared active account/congregation context used by authoring, including fail-closed author-role handling;
- the assignment workspace loading the active mentor pair and published curriculum path;
- the exact selected pair/track/module/lesson/revision reaching `bible_v7_create_pair_assignment` through `createV7AssignmentAuthority`;
- a stable successful assignment acknowledgement reaching the composed page;
- an active-congregation change while the assignment RPC is in flight, with the workspace context notification invalidating local preparation and the authoritative post-RPC context check preventing a stale success receipt.

This is deterministic composition evidence only. It does not claim an authenticated built-artifact journey, a live Supabase/RLS PASS, publication/assignment success against a deployed V7 backend, physical-device evidence, or production certification. Those remain separate P4-B/P5 evidence requirements.
