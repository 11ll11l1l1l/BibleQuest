# V7 manual visual attempt: failure evidence and released reservations

Date: 2026-10-11 JST. Draft PR #1514. Interactive user-invoked image generation was attempted for `devotional.biblequest.tiredness_weariness.05` from `content/v7/devotionals/biblequest-original-emotions-05b.json` at source checksum `c6cfab8fdf80b4a01b6ad3279adc54d7f1878d18664a40090dd0916298cc9ad8`. Locked scene `docs/v7/unfinished-artwork-guide/05-next-hour-action-shots.md`: care worker hangs jacket, prepares water, closes curtains for overdue sleep. At least 768x960 final 4:5 clean raster, no text.

Two independent source generations visibly failed:

| Attempt | Actual file | Native pixels | Original bytes | SHA256 | Why rejected |
| --- | --- | --- | ---: | --- | --- |
| first | PNG | 1536x1024 | 2495977 | `794b871404830a4d9a73cd63334c273e5a2e9dc20f7c5d8a9c4f5542f05602ca` | Ancient prayer-at-sunrise hilltop, wholly unrelated to care worker and wrong 4:5 geometry |
| retry | PNG | 1536x1024 | 2242975 | `cbf373eb8d49dd12ad9d8da5d1581c9ee363e03dcfb49a94a4c53a13b9c0a333` | Woodworking class entrant, source identity collision with unrelated Need Courage brief; wrong story and geometry |

Both were decoded/measured locally using Pillow and hashed with SHA-256, inspected, then physically deleted from the execution workspace. **No image bytes, derivative, release registration, source art, candidate or QA PASS were committed to GitHub.** These are rejection tombstones, **not** an independently verified image QA pass. Do not reuse their exact hash or scenes.

The other two source-locked planned slots `devotional.biblequest.rejection.07` and `devotional.biblequest.frustration.09` were **not generated**. Their pre-generation claims were removed from this draft branch to avoid blocking concurrent manual producers. No other slots are held by this work. PR #1514 should not merge until reconciled with the live integration ledger; it exists only as a bounded evidence handoff.

Exact guidebook blob: `1f3b158542468f17d940a3aaca01f4ff743e6629`; central policy blob: `959ed918dc7ca000b6772340e413f880f852f19d`. Retry only through a newly source-locked interactive generation environment that actually follows the scene; do not bypass visual semantic check simply because PNG bytes are decodable.
