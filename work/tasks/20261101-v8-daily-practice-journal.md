# V8 daily routines and editable private journal

Baseline: remote integration `ae0b489fa5139bccaa411181c630e1f304da1c99`, PR #1558. Single executor; coding-first implementation of remaining accepted daily-practice requirements.

## Implementation

Morning Surrender now offers 10, 15 and 20 minutes. Existing 10-minute identity/allocations remain unchanged. New adapted templates preserve silence → gratitude → Scripture → formation → surrender, with explicit second allocations 180/90/270/180/180 (15 min) and 240/120/360/240/240 (20 min). Existing timer reconciliation, pause/resume and versioned restoration own execution; no second timer.

Evening reflection keeps the five source questions and adds separate optional answer fields after an ended/completed session. Answers use canonical notice/resistance/gratitude/confession/learning keys, max 1,200 characters each, alongside the existing optional 6,000-character note. Answers are stored on the private journal row, not timer metadata. Legacy rows without answers remain readable; malformed/unknown answer fields cannot replace valid prose.

Saved journal rows now support Edit, Save and Cancel without replacing the current timer. In-memory drafts survive redraws during the visit, clear on owner change/disposal and are explicitly labeled unsaved until submitted. Failed writes preserve the previous saved row and keep a retryable draft; deletion cannot be undone by a stale editor. Text is escaped and never UI-translated, broadcast, sent to analytics or used for recommendations. Uses the existing guest/account private key and 50-row bound; no cloud/ALAM/new storage owner. EN/TL/CEB controls and source questions are localized.

## Verification and limits

58/58 affected checks PASS: all practice modules plus Library practice/conversation handoffs. Covers exact morning allocations and terminal accounting, real player restore, five bounded answers, legacy data, escaping/source-language preservation, old-row edits during another timer, redraw drafts, cancel/write failure/delete and stale-account denial. Application typecheck, production build, existing lint/format, browser-script syntax and diff whitespace PASS locally on Node 24.22.1. These are development checks, not pinned release/physical acceptance.

The existing built Library/practice browser flow now exercises 15-minute morning selection and five-answer evening save/edit/reload at its existing locales/viewports. Execution awaits exact-head CI. Source/theological review, full browser/phone/offline/audio and closed-app reminder work remain open. No DB/provider writes, real-user notifications or production promotion.
