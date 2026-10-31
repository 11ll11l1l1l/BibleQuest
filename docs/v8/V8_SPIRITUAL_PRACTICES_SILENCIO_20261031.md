# V8 spiritual practices and Silencio integration
Date: 2026-10-31 JST
Status: ACCEPTED SCOPE / implementation OPEN. This document maps owner-supplied teaching into executable V8 requirements; it does not claim shipped code, QA or deployment.
Parent authority: [V8 development plan](../../DEVELOPMENT_PLAN_V8.md).

## Source analysis and attribution
Owner supplied 1-SPIRITUAL-DISCIPLINES.pdf (7 pages) and 2.-SILENCIO.pdf (8 pages), analyzed in full.
Spiritual Disciplines pp.1-5 establishes intentional formation, grace rather than earning favor, Christlikeness and mission; pp.5-6 gives morning surrender (10-20 minutes), daytime 30-second prayer and five evening questions; pp.6-7 covers digital fasting, silence, Scripture, prayer, Sabbath, service and simplicity.
Silencio pp.1-2 distinguishes external and internal silence; pp.2-4 supplies biblical/historical teaching; pp.4-6 develops listening, awareness, discernment, humility and presence; pp.6-7 distinguishes attentiveness to God from empty-mindedness, avoidance and spiritual performance; pp.7-8 gives the exact two-hour flow.
Source-derived means faithful adaptation of these PDFs. Shorter programs, UI design and technical behavior below are proposed app adaptations. Uploaded availability does not establish redistribution rights: retain source identity and confirm permission before publishing substantial teaching text. Scripture comes through the existing licensed Bible provider; PDF quotations are not a replacement corpus.

## Product outcome
Add Spiritual Practices within existing Library discovery, with a Home shortcut and saved routines/history in You. Bible selected-passage actions offer Meditate. Reuse navigation, journal, reminders, offline storage and content review owners after inspecting actual runtime; do not create parallel systems. No new bottom navigation tab is required.
Journey: choose practice -> learn purpose and prepare -> choose duration/mode -> guided stages with silence -> optional private reflection -> choose one response in everyday life.
Default practice works for guests locally; cloud/account behavior must follow existing policy. Starting a practice must never require notification permission.

## Source-to-feature map
| Teaching | Executable experience | V8 integration |
|---|---|---|
| Silence and solitude | Silencio staged timer, quiet preparation and distraction-return cue | Shared practice player |
| Scripture reading and meditation | Select short licensed passage; read slowly, dwell, respond in prayer, rest, choose application | Existing Bible Reader and Library |
| Prayer and surrender | Guided morning routine, prayer intentions and closing surrender | Home and personal routines |
| Practicing God's presence | 30-second pause with a brief presence prayer | Home quick action; opt-in reminder |
| Evening examination | Five source questions, optional confession/prayer, gratitude and next response | Private journal |
| Gratitude and worship | Gratitude prompts; worship guide outside silent intervals | Same player and licensed media controls |
| Digital fasting | Choose an offline period; preparation card; put phone away; return reflection | Reminders and history; no claim to block other apps |
| Sabbath/rest and simplicity | Rest plan, release work prompt, one distraction to remove | Weekly routine |
| Service, giving and fellowship | Choose a concrete act, optional follow-up reflection | Personal action plan and existing Groups entry |
| Fasting | Prayer-focused intention guide; digital fast available | No prescribed food restriction or competitive fasting score |
| Becoming like Christ and mission | One loving/obedient response after practice | Private reflection; optional self-chosen action |

Confession is private reflection by default, never automatically sent to a leader. Service/giving have no money-transfer implementation. Fellowship may open existing Groups; it does not expose journal entries.

## Shared timer/player contract
- Presets: Silencio 5, 10, 20, 30 and 120 minutes; custom 1-120 minutes. Source-exact preset is 120; others visibly labeled adapted. Normal default is 10 minutes, not a two-hour commitment.
- Choose Guided or Silent. Guidance is concise stage text before silence, with optional user-initiated spoken introduction. Silence has no continuous narration, soundtrack or auto-playing Bible audio. Optional transition bell/vibration is off until chosen.
- Calm dark/low-light view, large remaining time, stage/total time, next-stage preview on request, pause/resume, skip stage, end early and optional keep-screen-awake. Collapse instructions after reading; no feed or unrelated prompts.
- Gentle distraction cue: notice the thought and return attention to God or the passage. No repeated interruption and no claim that a thought is God's verified speech.
- Store versioned session snapshot: session ID, template/version/locale, stage index, state, stage deadline, elapsed active time and paused remainder. Use deadline reconciliation on visibility/resume rather than counting interval ticks. Persist state transitions; reject malformed snapshots safely without deleting journal/history.
- State machine: ready -> running <-> paused -> completed; running/paused -> ended early. Skipped stages remain recorded as skipped; they do not count as silence practiced. Completion is idempotent.
- Background elapsed time follows the chosen running state. After a long suspension, show elapsed/finished state and the stage reached; do not replay a burst of old cues. Ask the user to confirm reflection/completion instead of inventing attention or prayer.
- Browser/PWA suspension may prevent precise background audio/vibration. Never promise lock-screen alarms. Foreground reconciliation must still be correct. Wake lock is optional, feature-detected and released on exit.
- Refresh, route-away/resume and offline restoration retain the session; explicit end stops timer/audio and releases resources. Account switches must not reveal another account's draft.

## Exact 120-minute Silencio template
| Stage | Minutes | Guide/focus |
|---|---:|---|
| Entering silence | 10 | Prepare a quiet place; settle; I am here, Lord |
| Silent sitting | 20 | Be still; return gently when distracted |
| Listening | 20 | Notice what arises in light of Scripture; What are You showing me? |
| Scripture and silence | 20 | Read a short passage, then let it settle |
| Heart examination | 20 | Notice anxiety, anger, fears, desires and resistance honestly |
| Gratitude | 15 | Thank God for specific gifts |
| Surrender | 10 | Release a concern, expectation or need to control |
| Reflection | 5 | What will I carry? Choose one response |
Total: 120 minutes. Source: Silencio pp.7-8. Do not silently scale this template.

Adapted 10-minute beginner template: prepare 1, stillness 2, Scripture meditation 3, gratitude/surrender 2, reflection 2. Other shorter durations require explicit stored allocations summing to the advertised duration; do not market them as the source's original flow.
Suggested references from the sources: Psalm 46:10; 1 Kings 19:11-12; Habakkuk 2:20; Ecclesiastes 5:2; Luke 5:16. Resolve actual passage text through approved providers. Missing passage shows Retry or an available licensed alternative; never fabricated text.

## Daily routines and guide content
Morning Surrender: selectable 10/15/20 minutes; silence -> gratitude -> Scripture -> formation question -> surrender schedule. Use the source question about what God wants to form today, with one optional practical response.
Daytime Remember: 30 seconds; a short prayer acknowledging Jesus' presence and asking help for the current moment. User may dismiss without a penalty.
Evening Reflect: preserve all five source questions: where did I see God; where did I resist; what am I thankful for; what do I need to confess; what is God teaching me? Finish with prayer. Responses are optional and editable.
Scripture Meditation: select passage, read slowly, consider a word/phrase in context, reflect, pray, rest and choose application. This sequence is an app adaptation, not an exact PDF exercise.
Each practice has purpose, biblical references, preparation, stage guide, beginner help and a completion reflection. Keep history teaching in expandable Learn content outside timed silence.

## Privacy, formation and accessibility
Private reflections stay out of URLs, analytics, group rooms, leader dashboards and AI recommendation inputs. No automatic cloud upload or ALAM ingestion of confession/heart examination. Any future sync requires existing authenticated ownership/tenant controls and an explicit user choice; local-only availability must be clearly labeled.
Only coarse session metadata may be used for opt-in progress summaries. No holiness score, ranking by minutes, streak-loss pressure or claim that duration measures closeness to God. Finishing early can still end with reflection; do not mark an abandoned session completed.
Reuse reminders and quiet hours with opt-in scheduling, timezone handling and cancellation. App cannot promise OS Do Not Disturb or other-app blocking.
EN/TL/CEB guides and controls use reviewed translations and visible source-language fallback. Ilocano follows V8's verified source/localization rollout; do not pretend English fallback is Ilocano completion.
Support screen readers, keyboard actions, large touch targets, reduced motion, text scaling and sufficient contrast. Avoid per-second screen-reader announcements; announce stage changes and user-requested remaining time. Audio guidance always has readable text.

## Implementation slices and acceptance
1. Practice content contract and deterministic timer core: versioned templates, exact 120-minute/10-minute allocations and session state persistence. Check stage sums, pause/reload/resume, background deadline reconciliation, skip/end, duplicate completion and invalid snapshots.
2. Connected experience: Library/Home -> setup -> real player -> optional reflection -> You history; Bible passage -> Meditate. Check guest/account isolation, private drafts, route reload and accessible phone controls.
3. Daily routines and offline: morning/day/evening guides, cached selected guides/passages, reminder integration and no-network recovery. Check warm offline launch, unavailable passage, storage denial and locale changes.
4. Additional disciplines: rest, digital fast, service, simplicity, worship, giving/fellowship and prayer-focused fasting guides through the same engine. Do not manufacture timers for activities better represented by a plan/action card.
5. Integration/release: affected automated checks during coding; full visual/device QA and exact-SHA release evidence remain OPEN until actually performed, consistent with the owner's coding-first direction.

Before implementation, inspect existing router, journal/storage, Bible action, reminders and localization owners and record actual file paths. This specification does not invent those paths or authorize replacing shared systems. No production deploy or migration is part of this mapping change.
