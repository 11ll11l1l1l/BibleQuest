# BibleQuest v3 PWA Install Contract

## Scope

#97 makes the v3 shell discoverable and installable through a valid deployment-relative web app manifest and a single optional browser-prompt lifecycle owner.

## Boundaries

1. `manifest.webmanifest` is the sole declarative app identity and launch contract.
2. `src/app/pwa-install.js` alone owns `beforeinstallprompt`, `appinstalled`, deferred-prompt state, prompting, and listener cleanup.
3. Bootstrap only composes the owner; More only presents owner-supplied state and forwards the install action.
4. Install UI is hidden until the browser supplies `beforeinstallprompt`. It never claims unsupported browsers can display the custom prompt.
5. Manifest URLs remain relative so GitHub Pages and other subpath hosting stay in scope.
6. #97 adds no service worker, Cache Storage, fetch interception, offline fallback, asset precache, opened-pack cache, update/reload loop, persistence, or production dependency.
7. #98 alone may own a future offline shell lifecycle. #99 alone may extend that lifecycle to opened Bible packs.
8. Existing Client Diagnostics probes remain network-only and cannot be intercepted or answered by #97.

## Acceptance

- The linked manifest is valid JSON with a stable name, standalone display, matching theme/background color, relative identity/start/scope, and a valid 512-viewBox SVG icon.
- The install owner handles unavailable, available, prompting, accepted, dismissed, installed, repeated prompt, and disposal paths without leaking listeners.
- A 390px browser regression verifies manifest delivery, one visible prompt control only after browser eligibility, accepted flow, no overflow, and a 44px target.
- Architecture validation forbids service workers, Cache Storage, global compatibility APIs, or install ownership outside the dedicated owner.
