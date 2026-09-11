# BibleQuest v3 generic continue prompt

Use the following prompt in a new ChatGPT/Work development chat.

---

Continue development of my BibleQuest v3 project from the **exact current repository state**.

Repository: `11ll11l1l1l/BibleQuest`

## FIRST — recover truth before writing

1. Read `DEVELOPMENT_PRIORITY_V3.md` first.
2. Read `RECONCILIATION_V3.md`, `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md`.
3. Read `FEATURE_INVENTORY_V3.md` only as the release-parity ledger, not as the complete post-release roadmap.
4. Read `ARCHITECTURE_V3.md` and milestone-specific contracts as needed.
5. Recover live `main`, frozen production/release refs, all relevant `postrelease/v3-*` and `release/v3-*` feature refs, verifier refs, exact product SHAs, documentation-only HEADs, recent commits and actual GitHub Actions evidence.
6. Recover agent/investigator findings, but revalidate any blocker reported against an older SHA before acting.
7. Recover unapplied/unknown migrations separately from committed migrations.
8. Repository evidence and my latest explicit instruction override stale prose.

## DO NOT CONFUSE RECENCY WITH CUMULATIVE PRODUCT TRUTH

A newer commit timestamp does **not** make a divergent feature branch the global latest product.

If exact-green feature branches diverge, report that there is **no single cumulative latest exact-green product SHA** until the intended work is deliberately integrated and the resulting exact SHA passes the complete accumulated verification suite.

At the known reconciliation checkpoint:

- production/runtime SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`;
- Assignment Private Responses exact-green: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`;
- Workspace schema compatibility exact-green: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`, cumulative on Assignment;
- Calendar v1.5 exact-green: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`, on a divergent Calendar line;
- therefore the known state has **no single cumulative post-release product SHA**.

Re-check all of this live before acting; these are reference points, not permission to skip repository recovery.

## DOCUMENT AUTHORITY / CONFLICT RULE

When instructions conflict:

latest user instruction → `DEVELOPMENT_PRIORITY_V3.md` → `RECONCILIATION_V3.md` → current handoff/status → feature contracts within their own feature scope → exact-SHA evidence → release-parity ledger → historical release/visual/agent records.

A feature-contract file is authoritative for that feature's behavior/ownership only. It cannot overwrite global planning/status just because another branch used the same filename for planning prose.

Before product promotion to `main`, **diff the conflicting documents and divergent product lines**. Do not guess which side wins. Preserve newer verified behavior per feature, preserve cross-feature planning authority explicitly, build one cumulative candidate, then verify that exact SHA.

For Calendar specifically, the implemented v1/v1.5 behavior recovered from the verified Calendar line is the Calendar feature authority. The older generic pre-implementation Calendar prose must not erase implemented behavior. `CALENDAR_V3.md` still does not become global priority authority.

## IMMEDIATE DEVELOPMENT ROUTE WHILE DIVERGENCE EXISTS

Until a newer cumulative exact-green successor is proven:

1. use the cumulative Assignment → Workspace exact-green line (`61ee54f...`) as the dependency-preserving integration base;
2. diff/replay the intended verified Calendar v1.5 product changes from `01ba15e...` onto that line;
3. resolve conflicts by established feature ownership, architecture and verified behavior, not commit date;
4. preserve `src/core/api.js` as the single browser Supabase/backend owner unless an intentional architecture change is separately selected and verified;
5. create one cumulative candidate SHA;
6. run focused Assignment + Workspace + Calendar checks;
7. run the complete accumulated architecture, edge/security/static, browser/mobile, PWA/offline and accessibility suite against that exact SHA;
8. fix root causes; never weaken tests to force green;
9. only after a cumulative exact-green SHA exists may product promotion to `main` be selected.

Do not detour into unrelated speculative work while the repository cannot identify a cumulative product checkpoint.

## ASSIGNMENT RESPONSE PRESENCE MIGRATION — REQUIRED RELEASE GATE

Canonical migration:

`supabase/migrations/20260911131000_assignment_response_presence.sql`

Known verified Assignment-line blob: `bbbceb057c631f08ec32826384ef6fcd61da4527`.

Read `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md` before any production integration involving Assignment Private Responses.

Rules:

- committed migration != production-applied migration;
- treat production state as `NOT APPLIED / UNKNOWN` until positively verified;
- if SQL is supplied in a prompt, compare it against the committed reviewed migration before use; do not silently run an ad-hoc variant;
- the migration replaces `private.bible_assignment_visible(...)`, so compare the deployed helper body/current production schema before applying;
- do not apply this migration on an unrelated product line that does not contain/expect Assignment Private Responses;
- when compatible Assignment code is selected for production, apply the migration before the code when possible or immediately after it if necessary;
- a brief lag is expected mainly to affect the leader/ministry “who completed this?” presence view, but it must be closed and verified promptly;
- after application, run live authorization/privacy smoke and record the applied migration/version;
- do not declare Assignment Private Responses fully production-live until the migration is `APPLIED + LIVE VERIFIED`.

Privacy boundary that must remain true:

- private answer/feedback stays in `bible_assignment_progress`/its existing private owner;
- peer-visible completion presence is physically separated in `bible_assignment_response_presence`;
- authenticated clients cannot write the presence projection;
- RLS limits reads to authorized assignment audiences;
- the private SECURITY DEFINER sync trigger function is not an anon/authenticated callable RPC surface;
- no answer/feedback text is added to the peer-visible projection.

## REBUILD-AND-VERIFY

- one owner/source of truth per responsibility;
- no competing Supabase/API/state owners;
- reproduce defects before fixing them;
- focused tests for changed owners/surfaces;
- complete accumulated verification at exact candidate checkpoints;
- never transfer PASS across changed product SHAs;
- never claim an unexecuted test;
- documentation-only commits are not verified product candidates;
- do not call the app bug-free;
- GitHub promotion is not proof of Cloudflare propagation.

## VISUAL / ARTWORK RULE

Visual Phase B remains required product-quality work once dependency-safe integration permits it.

Before replacing/generating icons, consult `docs/V3_ICON_ASSET_MAP.md` if present. Use its canonical assignments; do not invent new features merely to consume an icon. If the asset map is only on another visual branch, reconcile it deliberately before relying on it as global repository truth.

For a selected visual improvement that requires a generated image, icon, illustration, background, texture or similar asset:

**generate → choose → optimize → implement → test**.

Do **not** ask me whether I like the generated image, whether to implement it, or which routine option to choose. Pick the best result based on established art direction, readability, mobile behavior, consistency, performance, accessibility and purpose; wire it into the real UI; verify it. Ask only when the decision would materially change information architecture, product behavior, core theme direction, ownership or another major product decision.

Preserve navigation, information architecture, feature ownership, persistence, backend contracts and responsive/accessibility behavior unless a separately selected product change explicitly requires otherwise.

## AGENT FINDINGS / PRIORITY FIREWALL

Use investigator results as evidence, not automatic orders. Validate the inspected SHA, reproduction and user impact. Reject stale, speculative, duplicate, already-fixed or low-impact findings.

- P0: production unusable, severe security/privacy/data-loss/core availability issue;
- P1: major user-facing capability broken with no reasonable workaround;
- P2: real defect/usability issue but not a primary-use blocker;
- P3: cosmetic/theoretical/speculative/low impact.

Only current credible P0/P1 may interrupt the selected integration route.

## EXECUTE, DO NOT ONLY REPORT

In each development run:

1. recover live refs and branch ancestry;
2. report production SHA, relevant feature exact-green SHAs, and cumulative exact-green SHA or explicitly `NONE`;
3. identify the highest-value dependency-safe unfinished gate;
4. execute safe work immediately rather than stopping at a plan;
5. run focused and accumulated verification appropriate to the changed SHA;
6. preserve exact evidence and update docs when product truth changes;
7. continue to the next dependency-safe task while safe executable work remains.

Do not repeatedly ask me to type “continue.” Do not ask me to repeat repository context already available. Do not ask for routine approval already authorized by these instructions.

Keep production and development separate. Production database migration, product promotion, Cloudflare propagation and live authorization/privacy smoke are separate evidence gates.

Retired #39 Hiragana Match and #40 Kids Bible Who Am I remain retired unless explicitly reopened.

At the end of each response, state factual status only:

- production SHA;
- live `main` HEAD;
- active branch;
- relevant feature exact-green SHAs;
- cumulative exact-green SHA or `NONE`;
- work actually completed;
- tests/workflows actually executed;
- credible unresolved blocker;
- migration state;
- next gate;
- whether production/Supabase were touched;
- anything that truly requires user action.

---
