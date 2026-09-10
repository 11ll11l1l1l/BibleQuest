# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- Total capabilities: 100
- Current bookkeeping: 87 Regression-tested / 1 Verified / 0 Implemented / 12 Not started
- Implemented or better: **88/100**
- Regression stability: **87/100**
- Latest frozen checkpoint: `release/v3.60-content-reporting` at `17071432a815ef5cf53f5f4538df982285114bd0`
- #88 functional candidate: `8cd39e48eeb2affc7a4a2b27a319879bdda05b19`
- #88 targeted run: `34519519936` — green
- #88 complete functional run: `34519691125` — green
- #91 Content Review workbench is next only after v3.61 bookkeeping verification/freeze.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

## Recent frozen release line

- `release/v3.58-tutorial-avatar-reactions` — `c71db1502618a0a5679bf880fbd830762f9f5ef4`
- `release/v3.59-accessibility-support` — `5594f9802e40b25c6df9b6331668c0bbfcedacc7`
- `release/v3.60-content-reporting` — `17071432a815ef5cf53f5f4538df982285114bd0`
- `release/v3.61-content-moderation` — pending exact bookkeeping verification/freeze

## Recent milestone sequence

| Capability | State now | Evidence |
|---:|---|---|
| #86 Accessibility support | Regression-tested | frozen v3.59; survived #87/#88 full suites |
| #87 Content reporting | Regression-tested | frozen v3.60; survived #88 full suite |
| #88 Content moderation | Verified | exact candidate `8cd39e48...`; targeted `34519519936`; full `34519691125` |
| #91 Content Review workbench | Not started | waits for v3.61 freeze |

## #88 functional chronology

1. Started from frozen v3.60.
2. Recovered the retained congregation-scoped moderation contract without porting legacy global fetch interception, direct storage ownership or global registries.
3. Added the missing shared `bible_content_decisions` read owner to the central API boundary.
4. Extended the Recall owner so quarantined rows remain inaccessible to normal play but can be supplied to moderation for explicit `include` restoration.
5. Composed moderation through Session, Congregation Membership, Recall, Games and bootstrap without a second Supabase/navigation owner.
6. Added permanent architecture and edge regressions plus accumulated workflow invocation.
7. Exact product candidate `8cd39e48eeb2affc7a4a2b27a319879bdda05b19` passed targeted run `34519519936` and complete accumulated functional run `34519691125`.
8. #88 is promoted to Verified in bookkeeping and #87 advances to Regression-tested; changed bookkeeping still requires its own exact-SHA full gate.

## Next sequence

1. Full exact-SHA bookkeeping verification including inventory/status validation.
2. Freeze v3.61 only if green.
3. Create #91 branch from frozen v3.61.
4. Recover/rebuild the Content Review workbench through existing Session/Congregation/API/Router owners, preserving actual schema/RLS and rejecting legacy-incompatible `delete` decisions.

## Release discipline

Production v2, `main`, production Supabase/data and production Cloudflare remain untouched. Normal CI stays manual-only; temporary push triggers are isolated and removed after use.
