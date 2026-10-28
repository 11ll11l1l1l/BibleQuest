# Lane D runtime Library rights boundary

Owner: Lane D. Starting integration SHA: `dde24cbd75c76787495c8d92e7a05556fa9fa45d`.
Branch: `lane-d/runtime-rights-guard-20261005`.

## Problem

The V7 import contract already rejects `rights.status = verified` when `allowedUses` is empty, but the runtime Library normalization boundary accepted an empty array as long as it was syntactically valid. A malformed persisted published record could therefore cross the Library domain boundary even though no use was actually permitted.

## Fix

`normalizeLibraryItem` now requires verified rights to include at least one non-empty permitted use. This aligns the runtime boundary with `src/v7/content/contract.js` and keeps persisted publication data fail-closed even if an invalid row bypasses or predates the import validator.

Focused regression coverage proves `allowedUses: []` is rejected with `BQ_LIBRARY_RIGHTS` while a verified record with `allowedUses: ['display']` remains accepted.

No schema/RLS, routes, localization, content approval, source metadata, database write, workflow, deployment, or production state changes are included.
