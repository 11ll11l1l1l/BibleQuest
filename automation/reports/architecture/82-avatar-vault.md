# A3 architecture/security review — #82 Avatar Vault

Agent: `BQ-A3-ARCH-SECURITY`
Date: 2026-09-10 JST

## STATE / PROVENANCE

FACT:
- Active canonical branch: `feature/v3-avatar-vault`.
- Exact canonical HEAD at final live re-read: `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Dedicated `agent/a1-work/082-...` candidate: **not found**.
- Frozen base: `release/v3.54-psychometrics` at exact `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Exact #82 functional candidate recorded in the durable handoff: `37f1dc671804a1bb67ede2e5104002160b24c9dd`; isolated run `34483151962` completed `success`.
- Current canonical is later bookkeeping/docs lineage and has no Actions run for exact `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`; no PASS transfers to it.
- First bookkeeping candidate `dde924f86f83baf78659f303e442930b38749aca` failed run `34483915685` in accumulated architecture validation; current lineage records a bookkeeping-only correction but has no exact complete gate yet.
- This report becomes stale on any canonical/candidate/frozen SHA change, server/RLS/API/avatar persistence change, or new exact workflow evidence.

## PRIMARY EVIDENCE — CURRENT OWNER / TRUST FLOW

FACT:
- `src/engines/avatar-vault.js` is the catalog/unlock evaluator. Five styles are currently evaluable from Progress (`starter`, `sakura`, `lantern`, `flame`, `crown`); ten retained styles are explicitly unavailable pending owners.
- `src/app/avatar-vault.js` obtains `xp`/`streak` from the existing Progress owner, performs the locked-style check in the browser/app layer, persists owner-scoped private device state, and delegates signed-in cloud writes to `api.avatarVault.save`.
- `src/core/progress.js` is client/device state. The #82 implementation therefore does not possess a server-authoritative XP/streak source from which a backend can presently prove the five unlock thresholds.
- `src/core/api.js` performs direct browser Supabase writes. `avatarVault.save(userId, selectedStyle)` upserts `bible_avatar_cosmetics(user_id, selected_style)` and then updates `bible_congregation_members.avatar` for `user_id`.
- Existing `bible_avatar_cosmetics` RLS constrains SELECT/INSERT/UPDATE to `user_id = auth.uid()`.
- `20260905_congregation_member_column_hardening.sql` revokes table-wide member UPDATE and grants authenticated UPDATE only on `(display_name, avatar)`.
- `20260910_avatar_vault_visibility.sql` adds `avatar jsonb` if absent and adds an authenticated UPDATE policy whose `using` and `with check` are both `user_id = auth.uid()`.
- Leaderboards read `bible_congregation_members.avatar`, normalize its `cosmetic` string, and render it through the Avatar Vault engine's fallback helper.

INFERENCE:
- Row ownership is constrained, so the examined RLS prevents this client path from updating another user's cosmetic/member row through ordinary authenticated access.
- Unlock eligibility is **not** a server trust boundary. An authenticated client can bypass `createAvatarVaultService.select()` and call the Supabase tables/API boundary directly with its own row. The RLS policies validate ownership only; they do not allowlist style IDs or validate XP/streak eligibility. Consequently a cross-user-visible cosmetic cannot safely be interpreted as proof that its unlock requirement was earned.
- The two cloud writes are separate operations with no atomic server transaction in the examined path. A successful cosmetics upsert followed by a failed member-avatar update can leave private selected state and leaderboard-visible avatar out of sync.

## WORKFLOW / TEST EVIDENCE

FACT:
- Permanent tests exist at `tests/v3-avatar-vault-edge.mjs` and `tests/v3-avatar-vault-smoke.mjs`.
- The edge test covers catalog parity, thresholds, unavailable styles, malformed metrics, local locked-selection failure, guest/account isolation and cloud-failure reporting at the service level.
- The current canonical manual workflow does invoke the Avatar Vault validator, edge test, and 390px browser smoke while retaining the accumulated prior suites.
- However, the exact verifier workflow that produced successful run `34483151962` checked out/asserted `37f1dc671804a1bb67ede2e5104002160b24c9dd` and invoked the #82 validator and edge test, **but its browser/mobile loop did not contain `tests/v3-avatar-vault-smoke.mjs`**. Therefore that run is not evidence that the #82 390px smoke executed, despite the later handoff wording.
- `scripts/validate-v3-avatar-vault.mjs` requires workflow invocation of the validator and edge test but does not require workflow invocation of `tests/v3-avatar-vault-smoke.mjs`; this allowed the omission above to pass architecture validation.
- No examined permanent test exercises real Supabase authorization semantics or proves server-side unlock eligibility, because no such server-side eligibility enforcement exists in the current path.

## SAFE TRUST BOUNDARY

RECOMMENDATION:
- Keep Progress as the sole owner of client progress calculations; Avatar Vault must consume it rather than duplicate counters.
- Treat browser/device unlock computation as presentation/local-selection logic only unless a trusted backend authority exists.
- If leaderboard-visible cosmetics are intended merely as user-controlled decoration, explicitly classify `bible_congregation_members.avatar.cosmetic` as untrusted self-presentation. It must not grant score, permissions, rank, ministry status, or serve as evidence that an unlock requirement was earned.
- If leaderboard-visible cosmetics are intended to represent earned achievements, current direct table writes are insufficient. Use an authenticated trusted server/RPC/Edge path that derives the user from `auth.uid()`/verified JWT, allowlists the requested style, verifies unlock eligibility from server-authoritative progression facts, and writes the public selected cosmetic only after that validation.
- Do not accept client-supplied XP/streak or an `unlocked=true` flag as authorization evidence.
- Prefer one authoritative persisted selection source or a trusted transactional/reconciliation path for private selection plus public avatar projection; do not leave two independently writable representations without recovery semantics.

## REQUIRED SERVER / AUTHORIZATION PATH

FACT:
- Current #82 has **no trusted server function/RPC/Edge Function for cosmetic selection**. Authorization consists of browser-side unlock checks plus table RLS ownership checks.

RECOMMENDATION:
- For an earned public cosmetic, introduce a narrow trusted mutation such as `selectAvatarCosmetic(styleId)` behind an authenticated server/RPC/Edge boundary. It must derive caller identity server-side, allowlist `styleId`, validate the corresponding unlock predicate from trusted server-side facts, then update the canonical selection/public projection atomically or with explicit retry/reconciliation.
- Because current Progress XP/streak is device-local, the server cannot honestly validate those unlocks today. Either keep the public cosmetic explicitly untrusted/self-selected, or first establish an authoritative progression source through a separately reviewed milestone. Do not silently broaden #82 into a new progression authority.

## WHAT MUST NOT BE BROADENED

- Do not grant broader UPDATE privileges on `bible_congregation_members`; role, active status, congregation identity and other membership authority must remain outside browser self-update.
- Do not broaden `bible_avatar_cosmetics` RLS beyond own-row access.
- Do not let Avatar Vault own or synthesize XP/streak, assignments, Journey mastery, couples/community counts or other deferred metrics.
- Do not make cosmetic state an input to scoring, permissions, spiritual/doctrinal status, or congregation authorization.
- Do not deploy the migration to production Supabase as part of this review; repository migration presence is not deployment authorization.

## MISSING EVIDENCE / BLOCKING CONDITIONS

FACT:
1. No exact complete accumulated run exists for current canonical `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
2. Successful functional run `34483151962` did not execute `tests/v3-avatar-vault-smoke.mjs`; therefore the required real 390px Avatar Vault browser acceptance is not proven for exact functional candidate `37f1dc671804a1bb67ede2e5104002160b24c9dd`.
3. No server-side allowlist/unlock authorization protects the cross-user-visible selected cosmetic; current RLS proves own-row authority only.
4. No test proves the authorization counterfactual: a signed-in user below an unlock threshold must be unable to publish that locked cosmetic by bypassing the app service.
5. No trusted atomic/reconciliation test proves consistency if the cosmetics write succeeds and the congregation-avatar write fails.
6. No dedicated `agent/a1-work/082-...` quarantine candidate exists at final inspection.

## DISPOSITION

RECOMMENDATION: **A3 HIGH-RISK — TRUST BOUNDARY NOT SATISFIED / NOT READY for promotion at exact canonical `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.**

The decisive security issue is not cross-user row ownership; the examined RLS is correctly self-scoped. The issue is that an earned, congregation-visible cosmetic is authorized only by browser logic, while the database accepts any self-row cosmetic value. If public cosmetics are meant to communicate earned unlocks, move selection behind trusted authorization backed by authoritative progression facts. If they are intentionally untrusted self-expression, document and test that trust classification and ensure no downstream feature treats them as earned authority.

The exact functional verification record also has a concrete evidence defect: run `34483151962` did not invoke the permanent Avatar Vault browser smoke. A new exact candidate must execute the corrected accumulated workflow, including that smoke, before A3 can treat #82 functional acceptance as complete.

`automation/TRIAGE.md` was read only after the independent findings above were formed. Its conclusions were not used as primary evidence; where it makes additional live-backend claims not established by this repository inspection, this A3 report does not adopt them without separate primary evidence.
