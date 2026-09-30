# BibleQuest V6 CSP compatibility inventory

Status: enforcing candidate — exact-SHA report-only prerequisite passed

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

## Enforcing policy

The following policy passed the report-only built-artifact stage and is now the root `_headers` enforcement candidate:

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' https://cdn.jsdelivr.net https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://i.ytimg.com; font-src 'self' data:; connect-src 'self' https://zkfmgezvzugchcwppreq.supabase.co wss://zkfmgezvzugchcwppreq.supabase.co https://openbible.com https://cdn.jsdelivr.net; media-src 'self' blob: https://openbible.com; frame-src 'self' https://www.youtube.com; worker-src 'self' blob:; manifest-src 'self'; form-action 'self';
```

The policy now includes evidence-backed image, media, font and style boundaries. `style-src 'unsafe-inline'` remains a documented transitional concession for inherited presentation code; script execution does not permit `'unsafe-inline'` or `'unsafe-eval'`.

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

## Required work before enforcement

The report-only prerequisite on exact candidate `ad2b688b66cd0fc18764c33c0597027f1be13f56` passed Phase-1 run `36716674641` and inherited regression run `36716674561`. The report-only browser step recorded zero CSP violations. Root enforcement may now proceed, but checklist acceptance still requires green exact-head enforcement evidence.

The enforcement evidence must preserve all of the following:

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


## Report-only built-artifact gate

The report-only prerequisite passed Phase-1 run `36716674641` with zero `securitypolicyviolation` events and inherited regression run `36716674561`. The enforcement stage uses `tests/v6/csp-enforcement-browser.mjs` to apply the exact same policy as an enforcing response header against the built artifact, while `scripts/v6-build-evidence.mjs` independently proves `dist-v6/_headers` contains that exact policy. The checklist remains open until this enforcing candidate's exact-head Phase-1 and inherited regression runs are green.
