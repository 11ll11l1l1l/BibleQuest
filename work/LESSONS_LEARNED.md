# Lessons learned

Recorded from V6 release and repository cleanup on 2026-10-04 JST. These observations do not certify future candidates.

| Observed fact | Working rule |
|---|---|
| README and documentation index still presented V4/V5 as current after V6 release. | Update repository entry points when a release or development authority changes. |
| 42 historical root documents had no executable filename references; other older documents remained referenced by validators. | Archive only after reference checks and run affected existing contracts. Version labels alone are not deletion evidence. |
| Source branch, certified RC and production build identity had to agree. | Record one exact candidate and verify deployed artifact identity; do not assume branch names prove a release. |
| Cloudflare production used `main`, while V6 integration and later closeout evidence lived separately. | Distinguish released source from documentation follow-up and development baseline. |
| Physical/manual tests were owner-waived; final V6 inventory retained 8 OPEN rows. | Keep waiver and PASS distinct and preserve outstanding verification after shipment. |
| An old RC PR and older push-evidence PR were superseded; another UI PR contained distinct changes. | Close only proved superseded work. Preserve divergent work until explicitly resolved. |
| Local Git HTTPS push had no credentials while the connected GitHub writer succeeded. | Use the authorized connector if CLI writes are unavailable; compare tree identities before publishing. |
| Local cleanup static checks used Node 24.19.0; the certified toolchain pins Node 22.23.2. | Report the actual environment. Do not call a different local runtime a pinned-toolchain release certification. |

Evidence: [V6 production record](../docs/v6/evidence/RC_20261003/v6-production-promotion-evidence.json), [cleanup baseline](../docs/V7_STARTING_POINT.md), [backup manifest](../BACKUP_MANIFEST.md).
