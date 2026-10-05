# Lane D runtime Library taxonomy boundary

Owner: Lane D. Starting integration SHA: `7351ed96ab4bc018b225a95fda20101f950c113f`.
Branch: `lane-d/runtime-taxonomy-boundary-20261005`.

## Problem

The V7 import contract validates taxonomy-link IDs, restricts link kinds to `category`, `topic`, or `tag`, requires non-negative integer order values, rejects duplicate IDs and duplicate kind/order positions, and returns deterministic ordering. Runtime Library normalization previously required only that `taxonomyLinks` be an array. Malformed persisted publication data could therefore expose invalid or duplicate topic/category/tag metadata even though the same content would fail import validation.

## Fix

`normalizeLibraryItem` now validates the runtime subset of the V7 taxonomy-link contract:

- stable lowercase taxonomy IDs;
- supported `category` / `topic` / `tag` kinds;
- non-negative integer order;
- no duplicate taxonomy IDs;
- no duplicate positions inside the same kind;
- deterministic kind/order/id ordering while preserving presentation metadata such as localized labels.

Focused regression coverage verifies deterministic normalization, malformed ID/kind denial, invalid order denial, duplicate ID/position denial, and import-consistent ID trimming.

The runtime boundary cannot re-prove membership in the complete controlled taxonomy from an isolated item row; that remains enforced by the import/database taxonomy relationship. This change validates only the metadata that is available on the published item itself.

No schema/RLS, routes, content approval, database write, workflow, deployment, or production-state change is included.
