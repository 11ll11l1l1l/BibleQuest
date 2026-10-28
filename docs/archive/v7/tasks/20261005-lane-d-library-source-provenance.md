# Lane D runtime Library source provenance boundary

Owner: Lane D. Starting integration SHA: `e66051d6f3ec6e09a49e405ef3fb2bd923a9f24e`.
Branch: `lane-d/runtime-source-provenance-20261005`.

## Problem

The V7 content import contract allows only `first_party`, `external`, `licensed`, and `fixture` source kinds, requires non-fixture sources to carry an HTTPS URI or catalog ID, and validates any supplied source URI as absolute HTTPS. Runtime Library normalization previously rejected only `fixture` and the absence of both identity fields. An unsupported kind or non-HTTPS supplied URI could therefore cross the persisted publication boundary even though the same record would fail import validation.

## Fix

`normalizeLibraryItem` now aligns published Library records with the import provenance boundary:

- source kind must be one of the contract-supported values;
- `fixture` remains forbidden for published records;
- an HTTPS URI or non-empty string catalog ID is required;
- when a URI is supplied it must be an absolute `https:` URL;
- malformed supplied catalog IDs do not satisfy source identity.

Focused regression coverage verifies the supported published kinds (`first_party`, `external`, `licensed`), catalog-only identity, fixture/unsupported-kind denial, non-HTTPS/relative/malformed URI denial, and malformed catalog-ID denial.

No schema/RLS, routes, content approval, translation behavior, database write, workflow, deployment, or production-state change is included.
