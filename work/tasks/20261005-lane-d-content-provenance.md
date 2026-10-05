# Lane D representative content provenance hardening

Owner: Lane D. Starting integration SHA: `08c530b2eeef4abe3199eb022e7428b4d4485b82`.
Branch: `lane-d/content-provenance-20261005`.

## Scope

Tighten the representative Devotional content evidence used by V7 without approving or publishing content. The two Spurgeon *Morning and Evening* candidates now identify the exact CCEL reading pages, retain a durable rights-evidence URL and verification timestamp, and name Christian Classics Ethereal Library as the source organization.

The candidate excerpts, taxonomy choices, publication state and review state are unchanged. Both remain `pending_review`. No reviewer, approval, database write, schema/RLS, router, runtime rendering, workflow or production change is introduced.

## Evidence

- January 2 AM source: `https://www.ccel.org/ccel/spurgeon/morneve.d0102am.html`.
- January 6 AM source: `https://ccel.org/ccel/spurgeon/morneve/morneve.d0106am.html`.
- Rights evidence: `https://ccel.org/s/spurgeon/morn_eve/morn_eve.html`, which identifies *Morning and Evening* as public domain / copy freely.
- Verification timestamp recorded in the candidate rights metadata: `2026-10-05T09:45:00Z`.

Focused regression coverage requires both exact source identities, source organization, stable catalog IDs, retained rights evidence and verification timestamp after the V7 import contract normalizes the bundle. This prevents a later content edit from silently degrading representative provenance while leaving human content review as a separate gate.

The rights evidence applies to the named text source only. It is not a claim that separately formatted CCEL PDF/media assets inherit the same use terms.
