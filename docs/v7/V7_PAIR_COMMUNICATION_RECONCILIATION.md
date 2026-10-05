# V7 ONE 2 ONE communication reconciliation

Status: **accepted implementation boundary for V7**
Date: 2026-10-05 JST
Integration owner: Lane A

## Decision

BibleQuest V7 does not introduce a generic ONE 2 ONE private-chat/thread platform.

The V7 development plan requires bounded reuse of existing communication capabilities and explicitly prohibits a new messaging platform. The P1 inventory found no compatible V6 pair-private backend/RLS capability. Creating a message table, thread route or messaging adapter would therefore invent infrastructure outside the accepted V7 implementation contract.

The supported V7 pair communication path is deliberately narrower: a mentee may explicitly share an individual private lesson response with the active paired mentor. That flow uses the existing `v7_response_shares` contract, keeps the private response as the source record, names one mentor audience, requires explicit confirmation, and remains subject to active-pair/RLS authority. Sharing can be revoked without creating a general conversation history.

## Runtime boundary

`src/features/pairing/capabilities.js` is the client capability declaration:

- `lessonResponseSharing: true`
- `directPairMessaging: false`

The pairing controller exposes that frozen declaration. The ONE 2 ONE pair UI must not expose a message/chat/thread action while `directPairMessaging` is false. The discipleship service may expose explicit response share/revoke operations; it must not infer a generic send/list/open-thread API from those operations.

## Security-contract interpretation

The pair-thread language in `V7_SECURITY_TENANCY_CONTRACT.md` is conditional: it describes the security requirements that would apply **if** a compatible pair-private messaging backend were later authorized. It does not assert that such a backend exists.

Accordingly, `SEC-TEN-04A` is not a V7 release blocker unless V7 scope is explicitly changed to add pair-private messaging. The active V7 privacy gate remains the implemented per-item response-sharing contract (`SEC-TEN-05`) plus pair lifecycle, tenant isolation and stale-context protections.

This reconciliation does not weaken any private-data rule. Mentors still cannot browse unshared learner responses, congregation roles do not grant private-response access, and ending/suspending a pair cannot create a messaging bypass.

## Regression evidence required

The V7 unit suite must verify that:

1. response share/revoke operations remain available;
2. generic `sendMessage`, `listMessages`, `openThread` or equivalent service APIs are absent unless a later accepted contract intentionally adds them;
3. the pairing UI exposes no generic private-message action; and
4. the communication capability declaration stays frozen and explicit.

Browser/live-backend evidence for the implemented ONE 2 ONE journey remains a separate acceptance gate. This document does not claim those checks have run.
