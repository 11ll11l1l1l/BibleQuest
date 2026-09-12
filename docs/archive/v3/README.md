# BibleQuest V3 Archive

Status: **FROZEN HISTORICAL RELEASE / ROLLBACK REFERENCE**

## Exact backup

- canonical archive branch: `archive/v3.71-final-20260913`
- exact SHA: `c631bea8d5177a9a2ff68139cb104b6fbf26015b`
- original release reference: `release/v3.71-japanese-furigana`

Do not develop from this branch. Use it only for rollback, forensic comparison, or recovering a V3 behavior that is intentionally being reintroduced through a reviewed V5 change.

## Documentation map

V3 generated a large number of root-level documents. They are intentionally left at their tested paths rather than bulk-moved. Major entry points are:

- `/ARCHITECTURE_V3.md` — architecture ownership and boundaries.
- `/DEVELOPMENT_HANDOFF_V3.md` — historical V3 handoff.
- `/DEVELOPMENT_STATUS_V3.md` — historical V3 development status.
- `/FEATURE_INVENTORY_V3.md` — V3 capability inventory.
- `/RELEASE_OPERATOR_CHECKLIST_V3.md` — historical release procedure.
- `/ACCESSIBILITY_SUPPORT_V3.md`, `/ADMIN_CONSOLE_V3.md`, `/ADMIN_OPERATIONS_V3.md`, `/ASSIGNMENTS_V3.md`, `/CALENDAR_V3.md` and other `*_V3.md` files — feature-specific contracts and records.
- `/docs/V3_*` — additional V3 visual/feature contracts.

## V3-to-V5 rule

Nothing in V3 automatically becomes a V5 requirement. If V5 needs a V3 behavior or contract, adopt it explicitly in V5 documentation and verify it against the current production architecture rather than treating the historical V3 file as current authority.
