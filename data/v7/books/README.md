# Representative Books catalog

`representative-catalog.json` is a real-source import bundle, not a synthetic fixture or a published seed. Both entries remain `pending_review`. No database writes or publication are performed by loading this file.

Source checks on 2026-10-04:

- https://www.gutenberg.org/ebooks/131 — John Bunyan, The Pilgrim's Progress; English; catalog update 2021-09-23.
- https://www.gutenberg.org/ebooks/5657 — Brother Lawrence, The Practice of the Presence of God; English; catalog update 2025-02-22. This edition is marked copyrighted. Do not infer hosting permission from its age or availability.
- https://www.gutenberg.org/policy/linking.html — links to canonical ebook landing pages are permitted; direct file links and making provider text appear to originate from BibleQuest are excluded.

`external_link` in `rights.allowedUses` is the exact permitted action consumed by the Books renderer. This record grants no hosted text, image, translation, offline-copy or derivative use. Metadata is catalog identity; no source text is included. Source revision identifies the catalog update, not a verified ebook checksum.

Before end-to-end publication acceptance: perform the normal content review, import through the shared database owner into a V7 development/test target, preserve source/rights/review records, and exercise browse → detail → external link → return at mobile width. Published runtime records require the existing approved-review/verified-rights gate; this pending bundle cannot bypass it.
