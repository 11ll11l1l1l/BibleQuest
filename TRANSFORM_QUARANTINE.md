# Transform quarantine — historical note

Transform was temporarily disabled in production on 2026-09-05 after repeated Android browser crashes across the legacy assessment runtime and an interim safe runtime.

That quarantine is no longer the active production architecture. Transform was subsequently restored as an isolated standalone route: Home → Grow → Transformation → `transform.html`. The main SPA does not load the assessment runtime; `transform.html` loads `transformation-v2.js` and `transformation-v2.css` independently, while `transform-launcher.js` handles entry and return actions.

The retired runtimes (`transformation.js`, `transformation-taglish.js`, `transformation-safe.js`, `transformation-state-guard.js`, and `operational-hardening.js`) must remain outside the production boot path. Legacy Transform localStorage remains preserved.

Standalone Transform still requires real Android-browser acceptance before BibleQuest can be called production-ready. Static source checks alone are not sufficient evidence of crash-free behavior.
