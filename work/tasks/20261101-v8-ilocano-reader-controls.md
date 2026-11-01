# Ilocano Reader controls preview

Baseline: integration `289e49dc0fc38c022b4eb3205598bce9c6c5e764`.

The Ilocano Bible Reader now has an explicit opt-in control preview. Ten labels cover search, translation, tools/context, settings, external passage opening, previous/next and close. English remains the default. The choice lasts for this mounted Reader visit and survives chapter navigation; it is not a global app language or persisted preference. The toggle restores focus after rendering and stops current speech before replacing controls. Localized text nodes carry Ilocano language metadata.

Provider Scripture, canonical references, source/license attribution and other translations are untouched. Scope copy explicitly identifies remaining English controls. The authored Ilocano interface phrases are provisional and require independent language review; no full-app localization or publication approval is claimed.

Verification: ten affected Ilocano tests PASS, including actual Reader mount/delegated toggle/chapter navigation and Scripture escaping preservation; typecheck PASS; production build PASS (Node 24.22.1, not pinned release certification). No physical-device or visual-browser evidence is claimed. Existing CI must verify the new PR candidate. Frozen release candidate `release/v8-rc-20261101` remains unchanged; this continuation does not promote production.
