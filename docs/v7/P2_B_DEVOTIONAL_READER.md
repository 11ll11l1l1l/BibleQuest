# P2-B Devotional reader and representative source bundle

Baseline: `b9749370a8197636db8388a14f68a582eab889b2` on `v7/development`.
Owner: Lane B. Shared search/category filtering remains Lane D; schema and global routes remain Lane A.

The existing Library browse content-type filter reaches Devotionals. The existing library-item detail surface now dispatches devotional records to `src/features/library/devotional.js`. It renders escaped plain text or paragraph/heading blocks, topic labels, a safe HTTPS source link, and reviewed current-revision translations. A title-only translation falls back to the source body and explicitly names its language. Display requires published, reviewed, rights-verified records with the display allowed use. Metadata/attribution remains in the shared detail surface. Locale messages use the existing localization translator with bounded EN/TL/CEB dictionaries.

## Source candidates

`content/v7/devotionals/spurgeon-samples.json` contains two short excerpts from Charles Haddon Spurgeon's *Morning and Evening*, January 2 AM (prayer) and January 6 AM (care/hope). They are excerpts, not generated or modernized readings. Only whitespace is normalized.

Lane D reverified the representative provenance on 2026-10-05. Each candidate now points to the exact CCEL reading page instead of only the legacy monthly container: January 2 uses `https://www.ccel.org/ccel/spurgeon/morneve.d0102am.html`; January 6 uses `https://ccel.org/ccel/spurgeon/morneve/morneve.d0106am.html`. The recorded rights-evidence page remains `https://ccel.org/s/spurgeon/morn_eve/morn_eve.html`, which explicitly identifies *Morning and Evening* as `Public Domain -- Copy Freely`. The candidate records preserve that rights-evidence URL, the verification timestamp, author, and Christian Classics Ethereal Library as the source organization. This evidence applies to the named CCEL text source; it does not broaden rights to separately formatted CCEL PDF/media assets.

Both records remain `pending_review` with no invented reviewer or decision timestamp. They are import candidates, not a production catalog or approved content review. No database writes occurred. An authorized content reviewer must approve the named excerpts and their topic classification, then the existing schema owner/import path must publish the reviewed revisions in an approved environment. The runtime does not fall back to these candidates when remote content is unavailable.

## Evidence and remaining acceptance

The affected Node tests cover Library service/repository/page/adapter, devotional rendering, source identity, and retained rights-evidence metadata. Local development verification does not replace pinned-toolchain release certification. Browser/mobile/live-data evidence remains UNVERIFIED until run against the exact release candidate and an approved backend target. Full P2-B acceptance remains open until representative approved content is reachable end-to-end. No P2 exit or release claim is made.
