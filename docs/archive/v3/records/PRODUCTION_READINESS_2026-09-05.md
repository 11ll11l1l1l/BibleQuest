# BibleQuest production-readiness plan — 2026-09-05

This is the current release-priority source of truth. Work from latest `main`. Source/backend implementation is not equivalent to real-device or multi-account acceptance.

## Current integrated baseline

- **Account-first:** signed-out startup shows Sign In / Create Account. Explicit **Preview BibleQuest** is limited to Home, Bible Reader and Tutorial. Account-backed journeys, games, progress, rankings, ministry, assignments, polls, media, Transform, Psychometrics, notes and community activity remain locked.
- **Daily Journey is primary:** recall → context → learn → apply → reflect; one meaningful activity can protect the streak.
- **Reader:** BSB and Tagalog in-app; Japanese 口語訳 with learning support; NLT/ESV/NIV/AMP use licensed/official external reader paths.
- **Safe in-game verse peek:** referenced BSB passages can open over a game without navigating away or destroying answer state.
- **Global Report/Flag:** available across ordinary BibleQuest content, including exact curated media entries; deliberately excluded from Bible Reader, Transform and Psychometrics.
- **Content stewardship:** Leader/Pastor/Admin can review automatic quarantine and member reports; edit wording/reference/answer; Include, Keep Quarantined, Remove, Retire, bulk-review, compare revisions, or escalate for Pastor decision.
- **Curated content depth:** Hard Situations & Wisdom >=24, Think Deeper >=18, Guided Study >=24, Story Adventure >=10. Hard wisdom uses plausible competing judgments and private reasoning-tendency feedback.
- **Congregation Recognition:** cloud rankings, member names/avatars/roles, badges, special award lanes and manual ministry recognition.
- **Ministry:** devotionals, announcements, activities, encouragements, photo/banner announcements, scheduling/pinning/expiration, congregation calendar, assignments, Journey Groups, Live Rooms and persistent polls.
- **Inbox:** assignments, feedback, devotionals/announcements, polls, recognition and curated-media notifications.
- **Curated Videos & Media:** congregation-scoped handpicked YouTube videos, playlists and channels. Video/playlist embeds are created only after **Play here** and use `youtube-nocookie.com`. Channel links remain curated outbound links. Optional covers reuse the private congregation image bucket. Publishing is limited to platform Owner/Admin or congregation Leader/Pastor/Admin; facilitators do not inherit curated-video publishing.
- **Leader Dashboard:** privacy-safe participation, assignment follow-up, Daily Journey activity, online state, recognition and badges. Private notes, journals, Transform and Psychometrics responses remain outside leader views.
- **Advanced assignments:** schedule/open time, reminders, stored recurrence rules, required reflection/evidence, minimum quiz score and linked activities. `bq-assignment` live baseline is v6.
- **Account/security:** device list, sign out other sessions, own-data export excluding recovery codes, deletion-request flow and Owner-only immediate account deletion with ownership safeguards.
- **Owner Operations / Health:** current online users, assignments, announcements, polls, curated media, rooms, sanitized client runtime failures, database feature counts and doctrinal/PWA identity. Live `bq-admin-ops` baseline is **v5**.
- **Runtime diagnostics/accessibility:** privacy-safe client diagnostics, capability registry, larger text, reduced motion, stronger contrast/focus and first-five-minutes onboarding.
- **PWA baseline:** **v73**, with required shell timeout 8 s and optional shell timeout 12 s. Media Library and the central runtime feature registry are wired into the production shell.
- **GitHub Actions remain manual-only (`workflow_dispatch`).** No automatic Actions were restored.

## Latest media / hardening work

1. Added `bible_media_library` with congregation-scoped RLS and no anonymous table access.
2. Added videos, playlists and channels; validates YouTube URLs and stores metadata/IDs only—BibleQuest does not download or rehost YouTube videos.
3. Added privacy-enhanced on-demand video/playlist embedding via `youtube-nocookie.com`.
4. Added optional private cover/banner uploads (JPEG/PNG/WebP/GIF, 5 MB) using the existing `biblequest-announcements` bucket.
5. Added feature/order/edit/archive controls for Owner/Admin/Pastor/Leader; facilitator publishing is intentionally excluded.
6. Added reviewer visibility for scheduled/archived media while ordinary members see only active, published congregation media.
7. Added exact media Report/Flag integration and media Inbox routing.
8. Added curated-media counts/status to Owner Operations and deployed `bq-admin-ops` v5.
9. Wired `runtime-feature-registry.js` into production and registered the Media Library capability.
10. Advanced PWA/controller generation to v73.
11. Removed direct browser DELETE privilege from `bible_media_library`; client removal is audited archival rather than raw deletion.
12. Revoked browser RPC execution from three trigger-only notification SECURITY DEFINER functions.
13. Added missing FK indexes and normalized new-feature RLS policies to initplan-safe `(select auth.uid())` lookups.
14. Added auto-discovered static guards for Media Library and the security/performance hardening contracts.

## P0 — remaining release blockers / acceptance work

### 1. Doctrinal corpus reconciliation
Generated `data/packs/manifest.json` still reports doctrinal policy v1 while `data/doctrinal-safety.js` runtime is v2. The prior corpus manifest reports 11,462 questions with 581 quarantined. Run the current classifier over active + quarantine, regenerate v2 pack/quarantine/manifest output, and run doctrinal/content/reference audits. The release gate should continue to fail until these versions really match.

### 2. Account lifecycle + multi-account acceptance
Use clean disposable accounts for Member, Facilitator, Leader, Pastor, Admin and Owner. Verify registration/recovery/logout/login, role boundaries, congregation isolation, leaderboard/badges, moderation, assignments/submissions/feedback, messages, media publishing/read access, polls, groups, teams, Live Rooms, couples, presence, account deletion and deletion requests.

### 3. Curated media field acceptance
With real test roles verify:
- member sees only published active media for own congregation;
- facilitator can read but cannot curate media;
- Leader/Pastor/Admin can add/edit/feature/order/archive;
- platform Owner/Admin can curate where they have/choose the intended congregation context;
- private cover images resolve by signed URL;
- specific video/playlist embeds only after Play and preserves the app surface;
- channel links open safely;
- exact Report captures the selected media record;
- Inbox opens Media Library from immediate media notifications.

No sample media was fabricated; live media count was zero at implementation time.

### 4. Scheduling infrastructure
Scheduled records become visible based on `publish_at`/`schedule_at`, but this Supabase project currently has no enabled `pg_cron` scheduler. Therefore future scheduled media/assignments do not get an exact-time background Inbox notification/materialized recurrence automatically. Do not describe recurrence as fully automated until a scheduler is deliberately enabled and tested.

### 5. Real mobile/browser/PWA acceptance
Verify Android browser + installed PWA at 320/360/390/412/430 CSS px, 100% zoom, keyboard open/close, rotation, slow/stalled network, offline/online recovery, old-cache upgrade to v73, Reader/verse peek, Media Library player, Ministry Hub, Inbox, assignments, Content Review, Admin Operations, Transform and Psychometrics.

### 6. Cloudflare deployment identity
GitHub `main` is not proof that Cloudflare has propagated the same SHA. Confirm the deployed build identity before release signoff.

## Security / performance notes

- Browser uses only the Supabase publishable key.
- `bible_media_library`: anon SELECT false; authenticated browser role has SELECT/INSERT/UPDATE grants only, with RLS deciding actual row access; direct DELETE grant is removed.
- Trigger-only notification functions are not callable by anon/authenticated browser roles.
- Authenticated aggregate poll RPC warnings remain intentional because signed-in congregation members need aggregate results and the functions perform membership checks.
- Supabase still reports **Leaked Password Protection Disabled**; enable when plan/project configuration permits.
- Current performance advisories after cleanup are predominantly low-traffic **unused index** INFO notices. Do not delete useful indexes solely because new tables have not accumulated production use.
- The duplicate-index warning on shared `live_exams` belongs to Karimen/shared DB, not BibleQuest.

## Release acceptance checklist

Do not call BibleQuest fully production-verified until:
- doctrinal generated policy = runtime v2 with audits passing;
- final Cloudflare build matches intended `main`;
- current account lifecycle passes on clean production devices;
- disposable multi-role acceptance passes congregation/ministry/media/admin boundaries;
- PWA v73 fresh install/update/offline/degraded-network behavior passes;
- 320–430 px physical/browser mobile acceptance passes;
- Transform/Psychometrics authenticated route behavior passes;
- Owner account deletion passes using an approved disposable account;
- scheduled/recurring behavior is described accurately for the available infrastructure;
- all auto-discovered static guards and canonical release validation pass except explicitly documented blockers;
- no exposed secret, unrestricted guest path, silent no-op, permanent loader, broken local asset reference, stale source claim or dummy production content remains.
