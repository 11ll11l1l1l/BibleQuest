# V7 P1 Courage — one-image attempt rejected (2026-10-11 JST)

- **Canonical slot:** `need:courage:CLEAN`
- **Attempt:** `manual-20261011-need-courage-clean-04`
- **Claim commit:** `addab712dec654a559ccdb7b737c14e1eaab75dd`
- **Source:** `src/features/library/emotion-taxonomy.js` blob `e64366970838d62c11ea602dd606e0acfe5b0cb2`; canonical label *Courage*; reference-only `Joshua 1:9` and `2 Timothy 1:7`. No Bible quotation is embedded or approved here.
- **Guidebook:** `docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md` §6, blob `1f3b158542468f17d940a3aaca01f4ff743e6629`.
- **Required single scene:** an anxious present-day adult wearing correct safety equipment steps into a modest neighborhood learning workshop, preparing for a first hands-on practical task.

## Actual generator output and decision

- Generation ID: `82ecb1dc-6640-4ba1-97ae-4351995e64d2`.
- Actual format: decoded PNG, native **1122×1402** (4:5 within tolerance), **1,882,291 bytes**.
- Actual SHA-256: `944008fa6f9f9ff21e5fe349ce2b53fc7963858cae8d760639bff2d1c46e3409`.
- Observable image: a contemporary East Asian adult man seated at a desk at night with an open notebook and laptop, chin resting on hand; **no workshop doorway, equipment, safety goggles or entry/first-task action**.
- **Producer QA:** technical format/size and modern-person/single-scene check pass; mandatory source-action/setting check **FAIL**. Not reusable, not a `Courage` scene, no crop salvage.
- **Deletion:** source PNG deleted from interactive workspace, verified absent. No image or related sidecar was committed or proposed for production.
- **Ledger:** rejected tombstone on PR branch; no active claim after this PR is reconciled/merged to development. Fresh retry requires a new attempt ID and scene revision.
- **Independent five-agent QA:** not started, no evidence, no PASS/production-ready status.
- **Artwork actually delivered:** **0/1**.

One source-locked image was rendered because the user explicitly restricted the task to one image, and the renderer still substituted an unrelated setting. The detailed active brief immediately before generation specified the workshop. The returned generator metadata reported an empty prompt, and the rendered image did not follow that brief. This is a **generator instruction-control problem**; do not mark an unrelated attractive picture as source-valid. Avoid further generation in the same contaminated context until scene control is reliable.

No changes to app code, existing artwork, accepted sources, five-agent roles, CI, deployment, or other image claims.
