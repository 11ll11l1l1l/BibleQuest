# V6 Offline Mutation Policy

Status: IMPLEMENTATION CONTRACT
Authority: V6_ACTIVE_STATUS.md, DEVELOPMENT_PLAN_V6.md
Scope: offline mutation/sync safety boundary

## Default

BibleQuest V6 is fail-closed for offline writes. A mutation is never queued merely because a request failed or the browser is offline. Only operations explicitly listed as queueable below may enter a future outbox. Everything else must remain online-only and surface a retryable/offline state without pretending success.

## Domain allowlist

| Domain / mutation class | Offline queue | Required context / rule |
| --- | --- | --- |
| Reader local-only presentation state (font, theme, local reading position) | Local persistence only; not a server outbox | Account-scoped where applicable; safe to replace with latest local value |
| Notification read/unread acknowledgement | DEFERRED; not queueable until an idempotent server contract and outbox adapter exist | Must bind account + notification identity; stale account work must be discarded |
| Ordinary member assignment response/submission | DEFERRED; not queueable until version/idempotency and conflict semantics are implemented | Must bind account + congregation + assignment; never infer tenant from current UI at replay time |
| Journey/reflection/private-note server writes | NOT ALLOWED | Sensitive authored content must not enter a generic offline queue |
| Leader assignment publish/schedule/review/complete | NOT ALLOWED | Privileged workflow; requires fresh authorization and server state |
| Leader announcements / push dispatch | NOT ALLOWED | Privileged and externally visible |
| Membership, invitation, role, group/team/room administration | NOT ALLOWED | Authorization/tenant membership can change while offline |
| Congregation profile/settings/provisioning | NOT ALLOWED | Privileged configuration |
| Admin/Owner operations, account deletion, moderation, audit actions | NOT ALLOWED | Destructive or privileged |
| Media curation/publishing | NOT ALLOWED | Requires current server authorization |
| Authentication/session changes | NOT ALLOWED | Session authority is online/server-owned |
| XP/leaderboard/progression award writes | NOT ALLOWED | Server-authoritative anti-farming/idempotency boundary must remain authoritative |
| Push subscription lifecycle | NOT ALLOWED as a generic outbox item | Browser/service-worker subscription lifecycle has its own server contract |

No row marked DEFERRED is an implementation approval. It becomes queueable only after its domain has executable tests for the requirements below and this policy is updated in a reviewed tranche.


## Executable policy registry

The reviewed code inventory is `src/v6/offline/policy-registry.ts`. `resolveV6OfflineMutationPolicy(domain, operation)` fails closed for unknown pairs, and the registry rejects duplicate entries or any queueable policy whose risk is not `safe-idempotent`. Its focused tests are in `tests/v6/offline-policy-registry.test.ts`.

The current executable registry deliberately certifies **zero production server mutations as queueable**. It explicitly denies Leader announcement publishing, server notification publishing, assignment publishing/deletion, Admin role/suspension/deletion/temporary-password actions, and account recovery/password changes. Reader progress recording and ordinary assignment-response submission remain explicit non-queueable/unknown-risk entries until their domain-specific idempotency, privacy, tenant and server-authority contracts are proven.

## Mandatory outbox contract before enabling any server mutation

A queueable mutation must carry an immutable schema version, operation kind, opaque idempotency key, authenticated account ID, explicit congregation ID when tenant-scoped, entity ID, creation time, bounded retry metadata, and the minimum non-sensitive payload required by that operation.

Replay must revalidate the current authenticated account before dispatch. Tenant-scoped operations must use the congregation captured at enqueue time and revalidate membership/authorization server-side; replay must never substitute whichever congregation is currently selected. Sign-out or account switch must make prior-account entries inaccessible to the new account.

Retries require bounded exponential backoff with jitter and a terminal failure state. HTTP/network ambiguity must be safe under duplicate delivery through server idempotency. Authorization, validation, conflict, and not-found failures are terminal until explicit user action; they must not retry forever.

Conflicts require a domain-specific version/precondition contract. Generic last-write-wins is forbidden for authored, privileged, destructive, assignment lifecycle, membership/role, or progression mutations.

## Storage and privacy

Outbox storage must be account-partitioned and versioned. Sensitive free-form Scripture reflections, private notes, credentials, tokens, service-role material, and privileged secrets must never be stored in a generic queue. Queue inspection/diagnostics may expose counts and safe operation categories, not private payload contents.

## Acceptance evidence required for the first enabled mutation

The enabling tranche must prove: offline enqueue; browser reload/restart durability; reconnect replay; duplicate replay idempotency; bounded retry/terminal failure; account A to B isolation; same-account congregation A to B isolation; stale membership/role denial; schema upgrade handling; explicit removal/recovery behavior; and no queued execution of privileged/destructive operations.

Until that evidence exists, the V6 application must continue to fail closed rather than claim offline-write support.
