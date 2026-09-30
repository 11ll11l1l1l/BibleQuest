# V6 inter-congregation sharing policy

Status: ACCEPTED KERNEL/DATA-ACCESS CONTRACT
Updated: 2026-09-30 JST

BibleQuest multi-congregation membership does not imply inter-congregation data sharing.

## Default

Every tenant-scoped repository/read/write operates against exactly one explicit active congregation.

A user who belongs to multiple congregations must select the active congregation before tenant data is loaded. Membership in congregation A and congregation B does not authorize a single query that combines A and B.

The V6 typed repository contract therefore carries one `TenantScope.congregationId`, not a collection of congregation IDs.

## Shared-resource exception process

There are currently **no approved inter-congregation directory or shared-resource features**.

A future feature may cross congregation boundaries only after all of the following are reviewed together:

1. an explicit product requirement names the shared resource and intended participants;
2. a V6 ADR approves the cross-tenant data model and privacy boundary;
3. server/RLS policy defines who may discover/read/write the shared resource;
4. client APIs expose a separately named cross-congregation operation rather than widening an existing single-tenant method;
5. executable DB and browser tests prove opt-in behavior and cross-congregation denial outside the approved share;
6. the acceptance inventory explicitly records the approved exception.

Do not implement cross-congregation behavior by accepting an array of congregation IDs in an ordinary tenant repository.

## Current Team Center correction

Team Center previously had a low-level API method that accepted an array of congregation IDs even though the live service had already been hardened to pass only the active congregation.

V6 narrows that API to one explicit congregation ID. The repository query now filters teams and member directory rows with equality against that single tenant. Arrays fail closed.

This removes an unnecessary latent cross-congregation capability without changing accepted Team Center behavior.
