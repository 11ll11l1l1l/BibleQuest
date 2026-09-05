# Transform quarantine

Transform is intentionally disabled in production as of 2026-09-05 after repeated Android browser crashes persisted across both the legacy assessment runtime and a replacement safe runtime.

Production must not load `transformation.js`, `transformation-taglish.js`, `transformation-safe.js`, `transformation-state-guard.js`, their Transform styles, or the temporary `operational-hardening.js` layer. The Grow entry is intercepted by `transform-quarantine.js` and must fail closed with a small informational notice rather than opening a Transform page. The fifth Transform bottom tab is removed, leaving the stable four-tab navigation.

Do not re-enable Transform until a rebuilt implementation passes a real Android-browser reproduction test independently from the production shell. Repository-only static checks or direct API calls are not sufficient evidence.

Legacy Transform localStorage is preserved and is not deleted by quarantine.
