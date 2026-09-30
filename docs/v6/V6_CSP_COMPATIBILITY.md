# BibleQuest V6 CSP compatibility inventory

Status: enforcing candidate — exact-head CI acceptance pending

Official integration observed: `b8c5fe7fafe016720cf33d6913984b2db49df4d9`

This document records the browser origins and CSP compatibility constraints for the enforcing V6 candidate. Root `_headers` now carries the reviewed policy, but the checklist-M CSP item remains open until the exact candidate passes Phase-1 and inherited regression.

## Evidence-backed external requirements

### Supabase client/runtime

`src/core/api.js` currently loads the pinned Supabase browser ESM client from:

- `https://cdn.jsdelivr.net`

The same client is configured against the BibleQuest project origin:

- `https://zkfmgezvzugchcwppreq.supabase.co`

The client contains Realtime/channel usage, therefore an enforcing policy must permit the corresponding WebSocket origin as well:

- `wss://zkfmgezvzugchcwppreq.supabase.co`

Minimum CSP impact:

- `script-src` must account for the current jsDelivr ESM delivery until that dependency is bundled locally.
- `connect-src` must allow same-origin traffic plus the exact Supabase HTTPS and WSS origins.
- Do not broaden this to `*.supabase.co` unless repository evidence demonstrates a real multi-project requirement.

### YouTube media

V6 uses the official YouTube IFrame Player contract through `src/v6/media/youtube-iframe-adapter.ts`, including `new YT.Player(...)`-equivalent behavior and `enablejsapi: 1`.

Compatibility requirement:

- `script-src` must permit `https://www.youtube.com` if/while the official IFrame API script is loaded from that origin.
- `frame-src` must permit `https://www.youtube.com` for the player iframe.
- Do not add broad Google/YouTube wildcard origins merely as a precaution. Add any additional origin only after executable browser evidence proves it is required.

### Web Push / service worker

`src/app/push-subscription.js` delegates subscription creation to `ServiceWorkerRegistration.pushManager.subscribe()` and persists the resulting subscription through the existing application persistence boundary. It does not directly fetch a separate push-provider URL.

Compatibility requirement:

- the app/service worker remains allowed from `'self'`;
- Supabase persistence remains covered by the exact `connect-src` entries above;
- no arbitrary push endpoint belongs in `connect-src` merely because a subscription endpoint exists. Browser-managed Web Push delivery is not an application fetch allowlist.

### Same-origin app/PWA assets

The Vite application, route chunks, manifest, icons, CSS, service worker and normal app assets are same-origin. A future policy should keep `'self'` as the default ownership boundary.

## Provisional report-only policy shape

The following is an **inventory template**, not a header to deploy yet:

```
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'self';
script-src 'self' https://cdn.jsdelivr.net https://www.youtube.com;
connect-src 'self' https://zkfmgezvzugchcwppreq.supabase.co wss://zkfmgezvzugchcwppreq.supabase.co;
frame-src 'self' https://www.youtube.com;
manifest-src 'self';
worker-src 'self';
```

Image, media, font and style directives are intentionally not frozen here. The current application still contains substantial inherited presentation/runtime code, so adding restrictive directives without browser evidence could break existing V5/V6 behavior.

## Standalone-page compatibility findings

The global Cloudflare `/*` header applies beyond the Vite root route, so standalone pages must be compatible before root enforcement.

Current characterization:

- `index.html`: external module script only; no inline `<script>` body or `<style>` block.
- `admin.html` and `admin-operations.html`: external entry modules only; no inline script/style blocks.
- `content-review.html`: external scripts only, but still directly loads the pinned Supabase browser client from jsDelivr.
- `transform.html`: bootstrap script and shell style are external files; direct jsDelivr Supabase loading remains explicitly inventoried.
- `psychometrics.html`: bootstrap script, shell style, and retry/return handlers are external files/listeners; direct jsDelivr Supabase loading remains explicitly inventoried.
- `classic.html`: the Classic-mode bootstrap flag is external.
- `v5-push-device-field.html`: the field-harness style block is external.

Transform and Psychometrics inline execution debt has been externalized. The report-only candidate does **not** use blanket `'unsafe-inline'` for scripts; transitional `style-src 'self' 'unsafe-inline'` remains scoped to inherited presentation compatibility while built Chromium reports are collected.

## Required work before acceptance

The implementation prerequisites have been converted into executable checks. Acceptance still requires all of the following:

1. Run an inline script/style inventory across every root/standalone HTML route covered by the global Cloudflare header.
2. Audit unsafe DOM sinks and dynamic script/style injection. CSP must not be used to hide an unresolved unsafe-DOM path.
3. Exercise Reader, authentication/session restore, Supabase Realtime, YouTube Recordings, notification settings, Web Push subscription, service-worker registration, install/update/offline recovery and standalone Admin/Transform surfaces with a report-only policy.
4. Capture CSP violation evidence from built-artifact Chromium, not source inspection alone.
5. Tighten origins/directives from observed evidence; do not add wildcard domains as a convenience.
6. The exact enforcing candidate must pass Phase-1 plus inherited regression before checklist promotion; deployment exact-SHA verification remains a separate release gate.

## Acceptance interpretation

This branch implements the enforcing candidate for checklist M but does **not** claim PASS before exact-head CI. The target remains:

> CSP is compatible with media/push/build architecture and enforced as accepted.

The checklist remains open until exact-head CI proves both report-only and enforcing built-browser compatibility and inherited regression passes on the same candidate.


## Report-only built-artifact gate

`tests/v6/csp-report-only-browser.mjs` injects the candidate policy as `Content-Security-Policy-Report-Only` into built `dist-v6` document responses inside Chromium. It covers the root application and every standalone root HTML surface copied by Vite and fails on any `securitypolicyviolation` event. Root `_headers` now contains the same policy as the browser gate. `tests/v6/csp-enforcing-browser.mjs` injects that policy as an enforcing `Content-Security-Policy` against built output so CI can prove that the deployable policy and rendered application agree before promotion.
