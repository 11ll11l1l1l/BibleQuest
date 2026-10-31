# Lane D — P5 evidence fail-closed hardening

Date: 2026-10-05 JST
Starting SHA: `8c7534d021f24e7a73cd24db9b5a0c264bfa7f53`
Target: `v7/development`
Owner: persistent V7 Lane D

## Outcome

Close a fail-open edge in the P5-D evidence helper so omitted localization inventory cannot be interpreted as complete localization evidence.

## Owned surface

- `src/v7/content/release-evidence.js`
- `tests/v7/content-release-evidence.test.mjs`
- this task record

## Acceptance

1. Every supported locale requires an explicit array entry in `missingV7KeysByLocale`.
2. V7 key inventory must contain at least one registered key.
3. Missing or malformed localization evidence throws instead of reporting ready.
4. Evidence item ordering remains deterministic regardless of input order.
5. No content review/right state is changed and no release-candidate ownership is assumed.

## Excluded

- no schema/RLS/router/PWA/workflow changes;
- no content approval/publication or inferred rights decision;
- no release-candidate freeze/promotion;
- no Lane A/B/C implementation;
- no V8 scope.
