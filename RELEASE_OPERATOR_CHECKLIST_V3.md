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
