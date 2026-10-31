# V8 bulk content intake coding

Baseline: remote integration `b0fd80ae2a7c092495c6847657134e304ae16bac`, PR #1558. Single executor; content expansion preparation only. No runtime article, source license or publication changes.

## Implemented

`scripts/v8-library-intake.mjs` / `npm run intake:v8` validates local new devotional/teaching manifests and UTF-8 text, preserves source/rights identity, pins byte hashes, mechanically normalizes text and emits deterministic revision-bound review packets through `parseV7ContentBundle`. Reviews/publication are always draft, translations empty. Approval/publication fields are rejected, not accepted as authority. Unknown rights are not promoted; verified link-only grants cannot authorize text drafts.

Existing repository-published IDs and normalized prose hashes are checked before output; duplicate batch IDs/prose also fail. Bounded per-file/batch/manifest sizes and source-root/symlink containment prevent unbounded reads or outside files. Output is exclusive/new, prohibited in served trees (including resolved parent symlinks), and created only after the complete batch validates. Partial writes clean up the newly owned directory. Raw source/packet content is not printed. Private `work/intake/` is ignored by Git and not copied by the app build.

This is preprocessing, not AI sermon adaptation or automatic publication. Actual sources, editorial adaptation, permission/context/Scripture/language review and existing import/publication remain open. No source corpus was invented or ingested as released content.

## Verification

Ten intake tests PASS, including the documented CLI against synthetic temporary sources and the real generated public-catalog baseline. Existing content contract, teaching rendering and media regressions also pass (55 affected checks total). Tests verify deterministic hashes/revisions, unpublished compatibility/rights, literal source markup, duplicate/size/UTF-8/path/symlink/hash/approval denials, existing-output preservation and no output for failed batches. Application typecheck/build, existing lint/format, syntax and whitespace PASS locally on Node 24.22.1; fresh CI remains separate. Temporary test packets are removed after verification.

No database migration/write, external source download, approval, runtime publication, provider operation or real-user message/notification occurred. Full V8 release/device acceptance remains open.
