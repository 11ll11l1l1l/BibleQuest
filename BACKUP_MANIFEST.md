# BibleQuest Release Backup Manifest

Updated: 2026-09-13 JST

This file is the canonical map of preserved BibleQuest release backups. Archive branches are **read-only by project policy**: never develop on them, force-move them, or use them as active integration branches.

## Canonical backups

| Version | Purpose | Branch | Exact SHA |
|---|---|---|---|
| V3.71 | Final V3 rollback/final reference | `archive/v3.71-final-20260913` | `c631bea8d5177a9a2ff68139cb104b6fbf26015b` |
| V4.0 RC3 | Exact application candidate promoted to production | `archive/v4.0-rc3-app-20260913` | `7de1c53ddd33c028498b35bee77be30e56878dec` |
| V4.0 production | Exact production merge verified on Cloudflare | `archive/v4.0-production-20260913` | `3c74d4f3600dbb05070ba57adb7c3c0b539a9aeb` |
| V4.0 accepted docs state | Production plus post-release acceptance documentation | `archive/v4.0-production-accepted-20260913` | `74db0239ab0aec4cf111da9a1579c0e561f8f106` |

V4 production authority is `mybiblequest` / `https://mybiblequest.pages.dev`. The production merge above passed the post-main exact-SHA Cloudflare deployment and production browser/PWA smoke.

## Historical branches retained for traceability

These are historical development or release branches, not the preferred backup entry points:

- `release/v3.71-japanese-furigana` — original V3 final reference.
- `release/v4-rc1` — historical V4 RC1.
- `release/v4-rc2` — superseded V4 production candidate.
- `release/v4-rc3` — final V4 application candidate.
- `release/v4-videos-merge` — Videos consolidation workstream.
- `v4/modern-ui-overhaul` — completed V4 integration line; frozen after V4 closeout.

## Redundant setup aliases

The following branches were created during archive setup and are **not canonical backups**. They must never be used as a baseline: `archive/v4.0-production-docs-20260913`, `archive/v4.0-production-metadata-20260913`, and `temp-dummy`. The current GitHub connector does not expose branch-ref deletion, so they are documented here rather than silently treated as valid archives. If branch deletion becomes available, these aliases should be deleted without affecting any canonical backup above.

## Restore rule

For rollback or forensic comparison, use the exact SHA from this manifest rather than a moving development branch. V5 must start from the cleaned, verified `main` line after the archive-cleanup PR, not from any V3/V4 archive branch.
