# BibleQuest production-readiness plan — 2026-09-05

This is the current release-priority source of truth. Work from latest `main`. Do not restore retired architectures merely because an old file, branch, PR, test, or comment still exists.

## Current integrated baseline

- **BibleQuest is account-first.** Signed-out startup shows Sign In / Create Account. A visitor may explicitly choose **Preview BibleQuest**, but preview is intentionally limited to Home, Bible Reader and Tutorial. Journeys, games, saved progress, rankings, groups, assignments, polls, ministry messages, Transform, Psychometrics, notes and community activity require an account.
- **Standalone Transform and Psychometrics are account-gated too.** Direct production URLs verify a persisted Supabase session before exposing the feature. Localhost-only bypass exists for repository E2E tests and is not available on Cloudflare/GitHub production hosts.
- **Daily Journey remains the primary daily experience.** Continue My Journey → recall → context → learn → apply → reflect. Modern Home uses the Journey engine, real resume/completion state and local-calendar date logic.
- **Account creation is immediate** through live `bq-signup` v8: email + password + confirmation. Recovery uses the private rotating recovery code through `bq-password-reset`.
- **ICAC is the default active congregation path for new production registrations** when the signup resolver finds the active ICAC congregation.
- **Platform and ministry authority are separate.** Platform roles: owner/admin/member. Congregation roles: admin/pastor/leader/facilitator/member.
- **Owner account deletion is implemented server-side.** Only the platform Owner can delete another account. The active Owner cannot delete itself, another Owner cannot be deleted, and congregation/small-group ownership must be transferred first. Shared team and live-room history are preserved; active rooms owned by the deleted user are ended before deletion.
- **Admin Ministry Operations is implemented.** Owner/Admin can inspect current online presence, recent assignments and completion counts, devotionals/messages, persistent congregation polls/vote totals, and live-room status/participant counts.
- **Leader/Pastor ministry workflow is integrated.** The existing assignment engine remains canonical. A new Congregation Ministry hub adds devotionals, announcements, activities, encouragement messages and persistent congregation polls.
- **Persistent polls are now congregation-scoped.** Anonymous/public poll read access was removed. Authenticated congregation members can read/vote; ministry roles can create/update according to RLS. Aggregate poll totals use a membership-checking RPC; anonymous RPC execution is explicitly revoked.
- **Content stewardship is integrated.** Leaders/Pastors/Admin can review automatically quarantined questions and member reports; edit wording/answer/reference; Include, Keep Quarantined, Remove or Retire. Retire removes content from normal congregation use while preserving an audit record.
- **Curated content pools have been expanded.** Hard Situations & Wisdom >=24, Think Deeper >=18, Guided Study >=24, Story Adventure >=10, with regression minimums.
- **Congregation Recognition is cloud-backed.** Rankings can show member names, avatars, roles, points, badges and special-award lanes by Today / This Week / All Time.
- **Reader source truth:** BSB and Tagalog in-app; Japanese 口語訳 live with Japanese-learning support; NLT/ESV/NIV/AMP use licensed/official external reader paths on current `main`.
- **PWA cache baseline is v71.** Required shell fetches abort after 8 seconds and remain fatal if unavailable; optional shell fetches abort after 12 seconds and remain non-fatal. Preview restriction and standalone-account gate are install-required.
- **GitHub Actions remain manual-only (`workflow_dispatch`).** No automatic Actions were restored.

## Latest corrective changes

1. Replaced unrestricted guest use with explicit, limited Preview BibleQuest.
2. Added capture-phase feature blocking plus visual account-required locks for preview users.
3. Added production account verification to direct Transform/Psychometrics URLs.
4. Added localhost-only E2E access so browser tests can still exercise deep UI without a real production account.
5. Added Owner-only account deletion with typed confirmation and server-side authorization.
6. Hardened deletion against self-delete, other-owner delete and unresolved congregation/small-group ownership.
7. Changed shared-session/team creator FKs to preserve shared history on account deletion; active rooms are ended before deletion.
8. Added Admin Ministry Operations page for online users, assignments, messages, polls and rooms.
9. Added `bible_ministry_messages` with congregation RLS for devotional/announcement/activity/encouragement posts.
10. Converted persistent polls from global/public to congregation-scoped authenticated content.
11. Added secure aggregate poll totals and removed anonymous RPC execution.
12. Added member/leader Congregation Ministry hub linking devotionals/messages/polls to the existing assignment, Journey Group and Live Room tools.
13. Added static release guards for preview limits, standalone account gating, Owner deletion, Ministry Operations, message/poll RLS and PWA v71 assets.

## Feature audit status

### Implemented and structurally covered

- Account sign-in/registration, recovery-code security and onboarding.
- Limited signed-out preview: Home + Bible Reader + Tutorial.
- Daily Journey, adaptive review, Bible World/progression, seasons/support paths, avatars/achievements.
- Bible Reader, BSB, Tagalog, Japanese 口語訳 and licensed translation links.
- Question/play modes, expanded hard Situations & Wisdom, Story Adventure, Think Deeper, Guided Study, sequence/context/decks/review.
- Transform and Psychometrics Lab, now account-required in production.
- Congregations, ministry roles, Journey Groups, assignments, Cloud Teams, Live Rooms, Play Together and challenges.
- Congregation Recognition, cloud badges and presence.
- Ministry messages/devotionals/activities/encouragements and persistent congregation polls.
- Admin Ministry Operations oversight.
- Content Review, member report/flag flow and congregation-scoped moderation decisions/edits.
- Couple Journey and couple-shared state/challenges.
- Notes, highlights/bookmarks/workspace and cloud profile/progress/devices.
- Owner/Admin membership/group correction tooling and Owner account deletion.
- PWA/offline shell architecture and narrow-phone static contracts.

Static/source presence is not equivalent to real-browser acceptance. In particular, as of this audit the live production tables still had no real assignment, assignment-progress, ministry-message, persistent-poll, poll-vote, live-room/session-response or current-presence records. These flows therefore remain **implemented but not field-proven**.

## P0 — release blockers / acceptance work

### 1. Doctrinal/content reconciliation

Generated `data/packs/manifest.json` still reports doctrinal policy v1 while `data/doctrinal-safety.js` is runtime policy v2. The existing corpus manifest reports 11,462 questions with 581 quarantined. The canonical release validator intentionally fails until generated/runtime policy versions match.

Required: run the current classifier over the active + quarantine union; regenerate policy-v2 pack/quarantine/manifest outputs; review recovered/context-framed items; run content/reference/doctrinal audits.

### 2. Account lifecycle E2E

On a clean production browser/device verify:
1. signed-out startup blocks the full app behind Sign In/Create Account;
2. Preview BibleQuest must be explicitly chosen;
3. preview can open Reader/Tutorial but cannot open account-backed features;
4. direct Transform/Psychometrics URLs redirect signed-out users back to account entry;
5. new v8 signup succeeds and joins the expected congregation;
6. recovery code is issued/saved and tutorial completes;
7. logout returns to account entry, not unrestricted guest use;
8. login restores profile/progress;
9. recovery-code password reset rotates the code;
10. Owner/Admin membership corrections take effect.

### 3. Multi-account ministry field validation

Use multiple real accounts/roles to verify:
- Pastor/Leader/Facilitator assignment creation and member completion/submission/feedback;
- devotional/announcement/activity/encouragement publishing and expiration/archive behavior;
- persistent congregation poll creation, voting, vote changes, closing and aggregate totals;
- Admin Operations accurately identifies creator name/role, completion counts and vote totals;
- online presence appears/disappears within the intended heartbeat window;
- Live Room host/join/reconnect/poll/team sprint/end behavior;
- congregation isolation and role boundaries.

At the time of this audit these production activity tables were still at zero real records, so this is a high-priority acceptance pass.

### 4. Owner account deletion acceptance

Do **not** test by deleting a real member unintentionally. With an approved disposable test account verify:
- Admin cannot delete accounts; Owner can.
- self-delete and other-Owner deletion are refused.
- congregation/small-group owners are refused until ownership transfers.
- ordinary member deletion succeeds.
- active rooms from that account are ended.
- shared team/room history is preserved with nullable creator reference.
- cascade-owned private progress is removed as designed.
- audit record survives with target reference set null after deletion.

### 5. Real mobile/browser acceptance

Issue #6 remains open until 320/360/390/412/430 CSS px at 100% zoom is verified on Android browser and installed PWA. Include account/preview wall, Ministry Hub, Admin Operations, Content Review, Reader, Together and Transform.

### 6. Transform/Psychometrics operational acceptance

Verify authenticated direct/launcher routes, signed-out redirect, Escape/close, browser Back, Reader/Wisdom return action, reload, progress persistence and Android behavior.

### 7. PWA/update/offline acceptance

Current merged cache baseline is v71. Verify fresh install, upgrade from old caches, controller-change reload, slow/stalled network behavior, signed-out account wall, limited preview, installed-PWA reload, offline Home/Reader, and the intended behavior of account-required standalone tools when authentication/network state cannot be refreshed.

### 8. Cloudflare deployment identity

A GitHub `main` commit is not proof that Cloudflare has propagated the same SHA. Confirm the deployed static build corresponds to the intended final `main` before release signoff.

## Security notes

- Browser configuration uses the Supabase publishable key only.
- Anonymous persistent-poll read and anonymous poll-total RPC execution are removed.
- `bible_poll_totals` intentionally remains a SECURITY DEFINER function executable by authenticated users because ordinary congregation members need aggregate totals; the function itself verifies active congregation membership before returning totals.
- Server-only/RLS-no-browser-policy tables may continue to produce informational advisor notices by design.
- Supabase still reports **Leaked Password Protection Disabled**. Enable it when available/appropriate for this project.
- Never expose service-role credentials, recovery codes, private reflections or raw individual poll voting records unnecessarily.

## Performance notes

Current advisor output is mainly unused-index INFO notices, expected for a new/low-traffic schema. Do not delete useful indexes based only on zero/low production usage. The pre-existing duplicate-index warning on shared Karimen `live_exams` is not a BibleQuest regression.

## Release acceptance checklist

Do not call BibleQuest production-ready until all P0 items have evidence:

- final Cloudflare build matches intended `main`;
- account-first startup + limited preview works on clean production devices;
- direct standalone account gates cannot be bypassed on production hosts;
- v8 registration → congregation → recovery → tutorial → logout → login → recovery reset passes end-to-end;
- Owner account deletion is verified with an approved disposable account;
- Daily Journey remains the obvious primary action;
- 320–430 px mobile layouts pass;
- Transform/Psychometrics account-gated routes pass on Android;
- Reader paths pass;
- doctrinal generated policy equals runtime policy v2;
- PWA v71 install/update/offline/recovery paths pass;
- congregation/groups/teams/assignments/messages/polls/rooms/couples/admin privilege boundaries pass multi-account testing;
- all auto-discovered static guards and repository-owned release validation pass other than explicitly known blockers;
- no obvious runtime crash, silent no-op, permanent loader, broken local asset reference, exposed secret, unrestricted guest path, stale source claim or dummy production content remains.
