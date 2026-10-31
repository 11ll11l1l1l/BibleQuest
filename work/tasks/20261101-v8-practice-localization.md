# V8 Spiritual Practices EN/TL/CEB — 2026-11-01 JST

Continuation of integration PR #1558 from remote candidate `3f2e233221d5792f8ca62e5585fe18d81b2947bb` (locally equivalent source). All eleven distinct workflows on that previous candidate PASS. New localization requires fresh exact-head evidence.

## Implemented

Authored 184 aligned Tagalog and Cebuano phrase translations per language, covering stage names/guides, daily-life guides, timer controls/states, reflection UI, reminder settings, offline preparation, wake lock/cues, known validation/errors and privacy/scope explanations. Dynamic practice titles preserve their canonical duration and source-exact/adapted distinction. Compact launcher copy covers Home, Library, You, Reader verse meditation and the app-open reminder banner; the larger guide dictionary stays lazy with the practice route.

Reuses the app locale owner and its existing reload-on-language-change behavior. Unsupported practice locales, including Ilocano, explicitly fall back to English. This does not claim full Ilocano support. Scripture remains in the selected licensed provider translation; private notes and reflections are escaped but never translated. Unknown provider details remain in their source language with a visible language notice, and untranslated status messages use English language metadata.

Session IDs, template versions, allocations, completion states and stored private text are unchanged by localization. The rendering path calls translations explicitly; no DOM text observer, user-text substitution or new language engine is added. Existing offline/package ownership is preserved.

## Development evidence

Aggregate local units 1,668/1,668 PASS: V6 880, V7 779 and media V8 9, plus the existing 31-attempt ledger audit. New checks cover every timed stage/daily-life guide, rendered labels and service-error dictionaries, unchanged timing/identity across translations, actual TL/CEB controller paths, escaped unchanged private text through language restoration, unsupported-language fallback and actual Home/Library launcher rendering through the app locale owner.

Typecheck, production build, existing lint/format policies, whitespace and affected inherited Home/Japanese contracts PASS on Node 24.22.1. No independent native-speaker/theological editorial review, phone wrapping/screen-reader QA or new physical-device evidence is claimed. Authored translations are implemented; independent editorial and device validation remain open.

## Remaining

Finish integrated exact-head/device/localization/offline/audio acceptance, closed-app practice reminders, broader media/provider configuration, source/license-valid full Ilocano Bible/UI and accepted content/Couples/discovery expansion. No production deploy, provider writes, user notifications, new dependency, new artwork or migration occurred.
