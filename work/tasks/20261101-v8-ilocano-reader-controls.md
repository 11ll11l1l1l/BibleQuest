# Ilocano Reader controls preview

Baseline: integration `289e49dc0fc38c022b4eb3205598bce9c6c5e764`.

The Ilocano Bible Reader now has an explicit opt-in control preview. Ten labels cover search, translation, tools/context, settings, external passage opening, previous/next and close. English remains the default. The choice lasts for this mounted Reader visit and survives chapter navigation; it is not a global app language or persisted preference. The toggle restores focus after rendering and stops current speech before replacing controls. Localized text nodes carry Ilocano language metadata.

Provider Scripture, canonical references, source/license attribution and other translations are untouched. Scope copy explicitly identifies remaining English controls. The authored Ilocano interface phrases are provisional and require independent language review; no full-app localization or publication approval is claimed.

Verification: ten affected Ilocano tests PASS, including actual Reader mount/delegated toggle/chapter navigation and Scripture escaping preservation; typecheck PASS; production build PASS (Node 24.22.1, not pinned release certification). No physical-device or visual-browser evidence is claimed. Existing CI must verify the new PR candidate. Frozen release candidate `release/v8-rc-20261101` remains unchanged; this continuation does not promote production.

## Search and read-status continuation

Integration baseline `a42e7ad94bf1cbbc0824e6b5741d0c7ae8822b14` includes PR #1566. The preview now also translates search progress, result heading/count, no-result and unavailable-pack feedback, plus mark-read labels and progress acknowledgements. Provider errors remain unaltered. Search hit text/identity is still owned by the existing validated presentation model. Read-label overrides use the existing chapter renderer with required nonblank, HTML-escaped labels and unchanged English defaults.

Verification: 10 affected Ilocano route/provider/reference checks and 9 chapter/search presentation checks PASS; typecheck and build PASS locally. Route test now covers submit/result/unavailable-pack/empty-result states and mark-read action as well as opt-in, chapter navigation and English restoration. Renderer regression checks hostile label escaping and rejects blank labels. Language review, visual/physical-device acceptance and exact-head integration CI remain separate.
