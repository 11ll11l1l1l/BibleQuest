# BibleQuest Original → Rebuild Feature Parity Matrix

Parity policy: no original capability is removed during the rebuild. A capability is either **Clean** (rewritten on the explicit `bq2` runtime), **Standalone** (kept as an isolated original application), or **Compatibility** (available through `classic.html` while its clean rewrite is pending). The original current `main` tree is retained as the resource source; it is not the root boot runtime.

| Capability | Original resources | Rebuild access | Status |
|---|---|---|---|
| Daily Journey | `journey-loop.js`, `frontpage-daily.js` | `bq2.js` | Clean |
| XP / streak / badges | `app.js`, engagement modules | `bq2.js` | Clean |
| Bible reader | `reader.js` | `bq2-reader.js` | Clean |
| BSB Bible | `data/packs/bible/*` | `bq2-reader.js` | Clean |
| Tagalog Bible | `data/packs/tagalog/*` | `bq2-reader.js` | Clean |
| Quick recall / quizzes | `app.js`, `decks.css` | `bq2-games.js` | Clean |
| Context challenge | question/context resources | `bq2-games.js` | Clean |
| Mixed Quest | question resources | `bq2-games.js` | Clean |
| Character detective | original game resources | `bq2-games.js` | Clean |
| Timeline game | original game resources | `bq2-games.js` | Clean |
| Large per-book recall | `data/packs/questions/*` | `bq2-bookquiz.js` | Clean |
| Bible World | `growth.js`, world assets | `bq2-grow.js` | Clean |
| Transformation basic | transformation resources | `bq2-grow.js` | Clean |
| Transformation full | `transform.html`, transformation modules | `transform.html` | Standalone |
| Same-room group play | `group-play.js` concepts | `bq2-games.js` | Clean |
| Kids games | `extra-games.js` concepts | `bq2-games.js` | Clean |
| Hiragana learning game | Japanese resources | `bq2-games.js` | Clean |
| Story Journey | `storyjourney.js`, `data/stories.js` | `bq2-study.js` | Clean |
| Wisdom situations | `hard-wisdom.js`, story data | `bq2-study.js` | Clean |
| Deep questions | original story/question data | `bq2-study.js` | Clean |
| Private notes local | `notes.js` | `bq2-study.js` | Clean |
| Recordings safe links | media concepts | `bq2-study.js` | Clean |
| Couples/family local | `couples.js` | `bq2-study.js` | Clean |
| Backup/import/reset local state | account/profile resources | `bq2-grow.js` | Clean |
| Professional home hierarchy | `modern-home.css`, `home-professional.css` | `bq2-parity.css`, `bq2-parity.js` | Clean |
| Pinoy/Japan hero art | `assets/bq-pinoy-japan-hero.svg` | root home | Clean resource reuse |
| Original avatars | `assets/avatar-*.webp` | parity/compatibility UI | Resource retained |
| World artwork | `assets/world-*.webp` | resource retained for clean migration | Resource retained |
| Japanese 口語訳 | `translations.js`, `japanese-learning.js` | `classic.html` | Compatibility |
| Furigana / Japanese vocabulary | `japanese-learning.js` | `classic.html` | Compatibility |
| NLT live path | `translations.js` | `classic.html` | Compatibility |
| ESV / NIV / AMP reader links | `translations.js` | `classic.html` | Compatibility |
| Verse Peek | `verse-peek.js` | `classic.html` | Compatibility |
| STEPBible lexical/context tools | context packs + context modules | `classic.html` | Compatibility |
| Adaptive learning / weak-area review | `adaptive-learning.js`, `learning-engine.js`, `open-review.js` | `classic.html` | Compatibility |
| Expanded guided study | `guided-study-expanded.js` | `classic.html` | Compatibility |
| Email/password accounts | `account.js` | `classic.html` | Compatibility |
| Signup enhancements | `signup-enhancements.js` | `classic.html` | Compatibility |
| Recovery codes/password recovery | `password-recovery.js` + cloud functions | `classic.html` | Compatibility |
| Cross-device cloud progress | `cloud.js`, `journey-cloud-sync.js` | `classic.html` | Compatibility |
| Cloud notes | `cloud.js`, `notes.js` | `classic.html` | Compatibility |
| Remembered devices/security | account/cloud modules | `classic.html` | Compatibility |
| Congregation membership / roles | `community.js`, cloud modules | `classic.html` | Compatibility |
| Community bridge | `community-bridge.js` | `classic.html` | Compatibility |
| Journey Groups | `journey-groups.js` | `classic.html` | Compatibility |
| Encouragements | journey/community modules | `classic.html` | Compatibility |
| Live Rooms | `live-rooms.js` | `classic.html` | Compatibility |
| Trusted scores / leaderboards | `leader-dashboard.js`, cloud modules | `classic.html` | Compatibility |
| Congregation recognition | `congregation-recognition.js` | `classic.html` | Compatibility |
| Presence | `presence.js` | `classic.html` | Compatibility |
| Team Center | `team-center.js` | `classic.html` | Compatibility |
| Assignments | `assignment-center.js`, `assignment-push.js` | `classic.html` | Compatibility |
| Advanced assignments | `assignment-advanced.js` | `classic.html` | Compatibility |
| Ministry Hub | `ministry-hub.js` | `classic.html` | Compatibility |
| Media Library | `media-library.js` | `classic.html` | Compatibility |
| Notification Center / inbox | `notification-center.js` | `classic.html` | Compatibility |
| Workspace | `workspace.js` | `classic.html` | Compatibility |
| Couples cloud | `couple-cloud.js` | `classic.html` | Compatibility |
| Linked activities/challenges | `linked-activities.js` | `classic.html` | Compatibility |
| Personality profile | `personality-profile.js` | `classic.html` | Compatibility |
| Psychometrics suite | `psychometrics.html`, psychometrics modules | `psychometrics.html` | Standalone |
| Avatar vault | `avatar-vault.js` | `classic.html` | Compatibility |
| Innovation suite | `innovation-suite.js` | `classic.html` | Compatibility |
| Onboarding/tutorial trainer | `onboarding-tutorial.js`, `tutorial-launcher.js`, trainer art | `classic.html` | Compatibility |
| Accessibility support | `journey-accessibility.js`, mobile readability CSS | `classic.html`; clean shell semantic nav | Compatibility + clean base |
| Content reporting | `content-report.js` | `classic.html` | Compatibility |
| Content moderation | `content-moderation-runtime.js` | `classic.html` | Compatibility |
| Doctrinal safety/context | `data/doctrinal-safety.js`, `data/doctrinal-context.js` | resources retained; compatibility mode | Compatibility |
| Source labels/attribution | `source-labels.js`, attribution files | clean reader + compatibility mode | Mixed |
| Content Review workbench | `content-review.html` + modules | `content-review.html` | Standalone |
| Admin console | `admin.html` + modules | `admin.html` | Standalone |
| Admin operations | `admin-operations.html` + modules | `admin-operations.html` | Standalone |
| Reset/recovery page | `reset.html`, `reset.js` | `reset.html` | Standalone |
| Client diagnostics | `client-diagnostics.js` | `classic.html`; clean host error boundary | Compatibility + clean base |
| Operational recovery | recovery/hardening modules | isolated from clean boot; compatibility mode only | Compatibility isolation |
| PWA/offline | `sw.js`, `pwa-runtime.js` | `bq2-sw.js` | Clean |

## Parity definition

**Feature-surface parity is complete when every original row remains reachable either through a clean replacement, a standalone page, or compatibility mode.** That condition is met by this integration branch.

**Native-rewrite parity is a stricter target:** every Compatibility row must eventually become Clean while preserving behavior, data contracts, security, licensing, and mobile usability. Compatibility mode exists specifically so native migration never requires deleting or hiding an original capability.

## Boot isolation

Root `index.html` loads only `bq2-*` runtime modules plus original data/assets. It does not load the legacy script chain. `classic.html` is the explicit compatibility boundary and intentionally does not load `pwa-runtime.js`, preventing the original service worker from replacing the clean host service worker.
