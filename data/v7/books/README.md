# Representative Books catalog

`representative-catalog.json` is a real-source import bundle, not a synthetic fixture or a published seed. All eight entries remain `pending_review`. No database writes or publication are performed by loading this file.

Source checks retained for the original 2026-10-04 records and expanded on 2026-10-06:

- https://www.gutenberg.org/ebooks/131 — John Bunyan, *The Pilgrim's Progress*; English; catalog update 2021-09-23.
- https://www.gutenberg.org/ebooks/5657 — Brother Lawrence, *The Practice of the Presence of God*; English; catalog update 2025-02-22. This edition is marked copyrighted. Do not infer hosting permission from its age or availability.
- https://www.gutenberg.org/ebooks/1653 — Thomas à Kempis, *The Imitation of Christ*; English; William Benham translation; catalog update 2023-05-05.
- https://www.gutenberg.org/ebooks/395 — John Bunyan, *The Holy War*; English; catalog update 2017-05-29.
- https://www.gutenberg.org/ebooks/130 — G. K. Chesterton, *Orthodoxy*; English; catalog update 2024-10-29.
- https://www.gutenberg.org/ebooks/77585 — Augustine of Hippo, *Confessions of St. Augustine*; English; catalog release 2025-12-31.
- https://www.gutenberg.org/ebooks/8120 — Teresa of Ávila, *The Life of St. Teresa of Jesus*; English; David Lewis translation; catalog update 2014-03-27.
- https://www.gutenberg.org/ebooks/65688 — G. K. Chesterton, *The Everlasting Man*; English; catalog update 2026-08-27.
- https://www.gutenberg.org/policy/linking.html — links to canonical ebook landing pages are permitted; direct file links and making provider text appear to originate from BibleQuest are excluded.

`external_link` in `rights.allowedUses` is the exact permitted action consumed by the Books renderer. These records grant no hosted text, image, translation, offline-copy or derivative use. Metadata is catalog identity; no source text is included. Source revision identifies the catalog update or release date, not a verified ebook checksum.

Before end-to-end publication acceptance: perform the normal content review, import through the shared database owner into a V7 development/test target, preserve source/rights/review records, and exercise browse → detail → external link → return at mobile width. Published runtime records require the existing approved-review/verified-rights gate; these pending records cannot bypass it.
