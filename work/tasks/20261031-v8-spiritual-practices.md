# V8 spiritual practices: first implementation slice

Branch: `v8/spiritual-practices-20261031`; baseline `3a82f6444afb9c4fb439f8f9213fd849352a13f2` from the current unmerged V8 Library branch. One executor. Scope: shared timer/content core and connected Library practice page. No production deployment or backend/schema write.

## Implemented locally

- Lazy route `#/spiritual-practices`, reachable from Library and retaining Library primary navigation ownership.
- Source-exact eight-stage 120-minute Silencio, adapted ten-minute Silencio, morning surrender, daytime 30-second pause and five-question evening reflection.
- Quiet low-light player with stage guidance, pause/resume, skip and end early. Elapsed-time reconciliation on reload/visibility return handles browser suspension without a tick counter or replayed cues. No background alarm claim.
- Existing `privateStorage` namespace, per-account/guest separation, stale-owner action denial, optional reflection save/update/delete, bounded history and escaped rendering. No private text in URLs, analytics, broadcasts or cloud APIs. Storage failure is visible.
- English guides are explicitly labeled. No fabricated translated guides or Scripture text. Reader entry reuses existing free-reader navigation; selected-passage return integration remains open.

## Verification

21 affected timer/controller/Library/router/shell tests PASS; the full V7 suite passes 749/749, plus the existing 31-attempt image-ledger audit. Includes original stage allocations, background/reload recovery, paused-time exclusion, skips, idempotent completion, invalid snapshots, account switching, storage denial, private-text escaping and the real Library launcher callback.
Typecheck, existing lint/format policies, production build, JS syntax checks and diff whitespace PASS on local Node 24.22.1. Repository requires Node 22.23.2; this is development evidence, not pinned release certification. Build emits the existing large-app-chunk advisory. No test or release gate removed.
Browser launch failed because the runtime Playwright Chromium executable is not installed; an installation attempt returned a truncated/non-ZIP archive. No browser, visual, physical-device, offline or exact-SHA deployment PASS is claimed. Controller tests omit only the CSS import for Node execution and are not layout evidence.

## Publication authorization and review

The owner explicitly authorized pushing this bounded change and opening its review PR on 2026-10-31 after an initial automatic approval rejection. Target repository: `11ll11l1l1l/BibleQuest`; task branch `v8/spiritual-practices-20261031`, review base `v8/library-group-handoff-20261028`. This remains a stacked, unmerged V8 implementation and does not authorize production deployment.

Follow-up alignment review hardened malformed-history recovery, disabled per-second live-region countdown announcements, and preserved existing Library bootstrap contracts. No private reflection text is consumed by the global telemetry descriptor (it uses stable element identifiers only).

## Remaining scope

This first slice does not complete the full spiritual-practices roadmap. Next: additional duration presets and custom allocation, reviewed localization, reminder and offline package integration, additional discipline guides, optional transition cues and wake lock. Full browser/device QA and release certification remain deferred/open per owner direction. Preserve existing exact-SHA production boundaries.


## Continuation: discovery and selected-verse meditation

Added Home and You entry points using existing phone tile/shortcut patterns. Bible Reader verse peek now offers an English meditation action, pauses reader audio/speech, validates the selected canonical identity through the existing Bible provider and opens Practices. A new ten-minute Scripture meditation guide carries that reference into its own session snapshot; choosing a new passage cannot silently replace an active session. Reload uses the stored reference and provider-owned Scripture, preserving attribution without storing copied Scripture text or adding prose to URLs.

The passage service rejects invalid book/chapter/verse/translation, licensed-link-only text, mismatched provider responses, missing verses, offline failures and cross-account late responses. Practice rendering also discards detached/old-account async results. Entering Practices disposes background Bible audio so silence is not accompanied by a previous narration. A completed Reader navigation does not steal focus back after the user has moved to a different passage/route.

Validation: full V7 suite 754/754 PASS, including five new selected-passage/controller cases; 31-attempt ledger audit, typecheck, production build, lint/format and diff whitespace PASS on Node 24.22.1. Browser/device/offline UI certification remains OPEN, as before. New service tests verify failure handling; they do not certify a physical offline device journey. Remaining scope above is retained explicitly.
