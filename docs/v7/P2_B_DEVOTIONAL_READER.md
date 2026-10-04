# P2-B Devotional reader and representative source bundle

Baseline: `b9749370a8197636db8388a14f68a582eab889b2` on `v7/development`.
Owner: Lane B. Shared search/category filtering remains Lane D; schema and global routes remain Lane A.

The existing Library browse content-type filter reaches Devotionals. The existing library-item detail surface now dispatches devotional records to `src/features/library/devotional.js`. It renders escaped plain text or paragraph/heading blocks, topic labels, a safe HTTPS source link, and reviewed current-revision translations. A title-only translation falls back to the source body and explicitly names its language. Display requires published, reviewed, rights-verified records with the display allowed use. Metadata/attribution remains in the shared detail surface. Locale messages use the existing localization translator with bounded EN/TL/CEB dictionaries.

## Source candidates

`content/v7/devotionals/spurgeon-samples.json` contains two short excerpts from Charles Haddon Spurgeon's *Morning and Evening*, January 2 AM (prayer) and January 6 AM (care/hope). They are excerpts, not generated or modernized readings. Only whitespace is normalized. Source text: https://ccel.org/s/spurgeon/morn_eve/ME01AM.html . Publisher's rights statement: https://ccel.org/s/spurgeon/morn_eve/morn_eve.html explicitly identifies the work as public domain and freely copyable. Retrieved 2026-10-04.

Both records remain `pending_review` with no invented reviewer or decision timestamp. They are import candidates, not a production catalog or approved content review. No database writes occurred. An authorized content reviewer must approve the named excerpts and their topic classification, then the existing schema owner/import path must publish the reviewed revisions in an approved environment. The runtime does not fall back to these candidates when remote content is unavailable.

## Evidence and remaining acceptance

23 affected Node tests pass (Library service/repository/page/adapter plus six devotional checks), including actual shared-detail mount/reset behavior. Local Node 24 development verification is not pinned-toolchain release certification. Browser/mobile/live-data evidence remains UNVERIFIED; Chromium is absent and production V7 schema is not installed. Full P2-B acceptance remains open until representative approved content is reachable end-to-end. No P2 exit or release claim is made.
