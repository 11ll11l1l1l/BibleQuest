# BibleQuest V6 CSP compatibility inventory

Status: characterization only — **NOT an enforcement authorization**

Official integration observed: `b8c5fe7fafe016720cf33d6913984b2db49df4d9`

This document records the browser origins and CSP compatibility constraints that must be preserved before BibleQuest can enforce a root Content-Security-Policy. It deliberately does not modify `_headers` and does not claim the checklist-M CSP item complete.

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
- `transform.html`: contains both an inline script body and an inline `<style>` block, plus direct jsDelivr Supabase loading.
- `psychometrics.html`: contains both an inline script body and an inline `<style>` block, plus direct jsDelivr Supabase loading.

Therefore the enforcement path is **not** to add blanket `'unsafe-inline'` permanently. The preferred migration is to externalize or nonce/hash the remaining inline blocks, then validate the resulting policy in report-only Chromium before enforcement.

## Required work before enforcement

An enforcing CSP in root `_headers` is blocked until all of the following are complete:

1. Run an inline script/style inventory across every root/standalone HTML route covered by the global Cloudflare header.
2. Audit unsafe DOM sinks and dynamic script/style injection. CSP must not be used to hide an unresolved unsafe-DOM path.
3. Exercise Reader, authentication/session restore, Supabase Realtime, YouTube Recordings, notification settings, Web Push subscription, service-worker registration, install/update/offline recovery and standalone Admin/Transform surfaces with a report-only policy.
4. Capture CSP violation evidence from built-artifact Chromium, not source inspection alone.
5. Tighten origins/directives from observed evidence; do not add wildcard domains as a convenience.
6. Only then change root `_headers` from no CSP → report-only → enforcing, with exact-head Phase-1 and inherited regression evidence at each meaningful transition.

## Acceptance interpretation

This tranche advances checklist M by making the compatibility contract explicit and executable. It does **not** satisfy:

> CSP is compatible with media/push/build architecture and enforced as accepted.

That checkbox remains open until an enforcing policy is browser-proven and accepted on the integrated V6 candidate.
