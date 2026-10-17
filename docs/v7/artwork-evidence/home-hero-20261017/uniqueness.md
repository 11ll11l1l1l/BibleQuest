# Home hero independent uniqueness review

- Role verdict: **PASS for inspected source identity and local duplicate checks** (2026-10-17).
- File: `assets/bq-home-scripture-study-20261017.webp`.
- SHA-256: `e8cd85eab7d29366a11711a2940f31c4df617528ec79ceb75a296c6dc65f96bc`.
- Inspected actual decoded master pixels. A contemporary pair studies an open Bible at a table while two people arrive in the background. The study action, open book, shared setting and landscape composition visibly support BibleQuest's reading/community identity. This is a single continuous photographic scene with left-side quiet space, rather than the previous hug-and-flowers image.
- Visually inspected existing `public/v7/images/emotion/bqv7-emotion-gratitude-01.webp` (hug/flowers) and `bqv7-emotion-joy-01.webp` (solo woman at sunset). Subject action, arrangement, camera composition and location differ. Hope's existing record describes a woman tending a greenhouse seedling; its recorded SVG/source identity also differs.
- Calculated SHA-256 for all 239 local repository raster files (`webp/png/jpg/jpeg/avif`, excluding `.git`, dependencies and build output). Only the new hero itself matched. The hash had no existing mention in local `data/v7` or `docs/v7` JSON histories at review time.
- Source inspection: `src/features/home/index.js` now renders the dedicated `assets/bq-home-scripture-study-20261017.webp` with `data-art-source="home-editorial"`. That file contains no hopeful/gratitude/joy or visual resolver selection. This avoids choosing an emotion tile as the application identity image.
- Natural realism: no obvious duplicated person, collage boundary or major anatomy defect observed at the inspected full-master size. This is not proof of identity, real-world photography or provenance.
- Scope: this independent role does not certify a current external open-PR/rejected-image union; no unmerged external pixels were supplied to this reviewer. Integration owner must reconcile that history before claiming exhaustive novelty. No browser, responsive crop, contrast, rights or release PASS is asserted here.
