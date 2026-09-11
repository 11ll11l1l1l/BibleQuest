# BibleQuest v3 release operator checklist — 2026-09-11

This checklist is subordinate to `RELEASE_6PM_2026-09-11.md` and exists to keep every chat/agent on the same release track.

## Before changing code

- Read `RELEASE_6PM_2026-09-11.md`.
- Read `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md`.
- Recover live `feature/v3-post-parity-closeout` HEAD.
- Check for concurrent release-branch changes before writing.
- Do not start new features or retired Kids/Kana work.

## Allowed work before 14:30 JST

- Reproduced P0/P1 release fixes.
- Cloudflare compatibility fixes.
- Low-risk artwork/icon/color asset replacement only when architecture/layout/behavior remains unchanged.
- Regression tests/evidence required by a release-affecting change.

## After 14:30 JST

- No discretionary polish.
- No refactor.
- Release blockers only.

## Candidate gate

For the exact candidate SHA:

- `bash build.sh` / Cloudflare deployment gate.
- accumulated v3 architecture validators.
- accumulated edge/security tests.
- accumulated Playwright browser/mobile tests.
- PWA/offline checks.
- relevant accessibility checks.
- syntax/static/diff validation.

No PASS transfer across changed product SHAs.

## Production promotion

When the exact candidate is green:

- freeze exact SHA;
- record evidence;
- promote that verified v3 product state to `main` without unrelated legacy changes;
- allow existing Cloudflare Pages projects to deploy `main`;
- verify canonical `https://mybiblequest.pages.dev/` and compatibility `https://biblequest-7th.pages.dev/`;
- do not infer propagation from GitHub alone.

## User involvement

Do not ask the user for routine approvals. Production promotion after green gates is already authorized for today's deadline. The only expected user action is optional/preferred physical Android/PWA smoke after deployment: Home, Reader, one Game, Account/sign-in.

## Mandatory next-release gates — added 2026-09-11

Do not promote the next production release until every item below is evidenced on the exact candidate SHA and, where schema/RLS is involved, against the intended Supabase environment.

- [ ] Bible Workspace loads without `column bible_notes.book does not exist` or other notes-schema errors; notes create/read/update/delete is verified.
- [ ] Bible Workspace runtime note fields exactly match the deployed Supabase schema/migrations.
- [ ] Live Room open/create/join/leave/reconnect and realtime presence/messages/synchronization pass on desktop and supported mobile widths.
- [ ] Live Room pastor/host controls, congregation scoping, and authorization boundaries pass.
- [ ] A new or pending pastor assignment is conspicuous on the Home/front page and opens the correct assignment directly.
- [ ] Pastor can review submitted assignment answer bodies for every member inside the pastor's authorized congregation/scope.
- [ ] Authorized admin can review submitted assignment answer bodies for every member inside the admin's authorized scope.
- [ ] An ordinary member cannot read another member's assignment answer body.
- [ ] Assignment responder/completion identity/status behavior passes the approved privacy/authorization rules.
- [ ] A dedicated admin account-control/management page is reachable by authorized admins and denied to non-admins.
- [ ] Admin account list/search and every supported account/role-management control pass authorization, failure-state, and audit/safety checks.
- [ ] Assignment private-answer work is integrated only after rebuilding/rebasing draft PR #93 from its older v3.71 base onto the current approved baseline and rerunning exact-SHA regression plus required Supabase/RLS verification.