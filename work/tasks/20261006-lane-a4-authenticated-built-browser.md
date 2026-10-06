# Lane A4 — authenticated populated built-browser acceptance

Date: 2026-10-06
Base branch: `v7/development`
Starting base SHA: `0d7f00f358ade1d8fcc26e27a591c50b6be67f6c`
Branch: `v7/lane-a4-authenticated-built-browser-20261006`

## Scope

Reconstruct the stale PR #1256 authenticated populated-browser gate on the current V7 integration base and make failures diagnosable without weakening the acceptance journey.

The gate uses an exact built artifact, a disposable local Supabase stack, real password sign-in through the Account UI, synthetic populated Library data, and synthetic ONE 2 ONE mentor/mentee data.

## Acceptance covered

- exact candidate SHA checkout and build
- disposable current-schema Supabase reset
- real leader/mentor password sign-in through Account UI
- populated Library rendering at 390px viewport
- taxonomy filtering and keyboard focus order
- locale change/reload while preserving authenticated state
- mentor ONE 2 ONE pair, authoring, and assignment preparation surfaces
- sign-out/account switch to member/mentee
- assigned curriculum track/module/lesson navigation
- horizontal-overflow guard on key mobile surfaces
- no browser page errors during the journey
- per-SHA JSON evidence artifact for both PASS and browser-journey FAIL, including the failing stage but no credentials

## Evidence boundary

This automated gate uses disposable synthetic data. It does not establish production-backend verification, production promotion, physical-device evidence, representative editorial approval, representative rights approval, or final V7 release certification.

## Prior stale attempt

PR #1256 was based on `50e19078e9daa6b6b587b5595e81acacd100e2c9`. Its latest run completed Supabase preparation, reset, build, and preview startup; the browser journey itself failed. This replacement starts from the current integration SHA and writes a sanitized failure artifact so any remaining interaction defect can be repaired from exact CI evidence.
