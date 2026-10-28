# Lane D runtime Library locale boundary

Owner: Lane D. Starting integration SHA: `a5e077ee37f5fd333b6c720fa08bdfcd4ea84d48`.
Branch: `lane-d/runtime-locale-boundary-20261005`.

## Problem

The V7 content import contract validates and canonicalizes BCP 47 source and translation locales, rejects translations whose canonical locale equals the source locale, and rejects duplicate canonical translation locales for a revision. Runtime Library normalization previously accepted any non-empty locale string and preserved non-canonical values. Malformed or canonically duplicate persisted metadata could therefore cross the publication boundary and alter translation selection or fallback behavior even though the same record would fail import validation.

## Fix

`normalizeLibraryItem` now:

- validates and canonicalizes the source locale with `Intl.getCanonicalLocales`;
- validates and canonicalizes the requested/presentation locale;
- validates and canonicalizes every reviewed current-revision translation locale;
- rejects a translation whose canonical locale equals the canonical source locale;
- rejects canonically duplicate current translation locales;
- exposes canonical locale values in the normalized Library item.

Focused regression coverage verifies canonicalization (`EN-us` -> `en-US`, `JA-jp` -> `ja-JP`), invalid source/requested/translation locale denial, source-locale translation denial, and duplicate canonical translation denial.

No schema/RLS, routes, content approval, database write, workflow, deployment, or production-state change is included.
