# P5-C — Build, PWA, offline and performance evidence preparation

Prepared against development `1d911d2edfe85507de013f89a9c6bc0a2187207a`. This is Lane C release-evidence preparation, not a candidate freeze, deployment certification or production release PASS. [Current status](../../V7_ACTIVE_STATUS.md) remains the progress authority; the [acceptance contract](V7_ACCEPTANCE_AND_CONTENT_CONTRACT.md) defines evidence classes and requires final release evidence to be tied to one exact candidate SHA.

## Existing executable evidence

[Run 37386420130](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37386420130) completed successfully for source `aa579e7dba29583f49f59c6c020c32356e57296c`. That source tree equals the integrated #1252 merge tree recorded by the remaining-acceptance handoff. The subsequent #1254 merge changed acceptance documentation only; this run remains development evidence for the unchanged executable tree, but it does **not** certify current development HEAD as the final release candidate.

The run completed every step in the existing [`V7 Build PWA Performance Gate`](../../.github/workflows/v7-build-pwa-performance.yml):

- validates a full 40-character selected SHA, checks out exactly that SHA and proves checkout identity;
- uses the pinned Node version, committed lockfile and deterministic `npm ci`;
- passes lint, formatting, typecheck and the V7 unit/contract suite;
- records exact-source content/localization evidence before building;
- embeds and verifies exact build identity plus artifact integrity;
- enforces existing artifact/startup/feature-route/image/font performance budgets and route splitting;
- exercises built-artifact browser parity plus V7 ONE 2 ONE and Library browser smoke;
- installs and exercises the built service worker, manifest/icons/shortcuts, assignment push handling and offline Home-shell reopen;
- runs automated accessibility smoke;
- seals `certification.json` and checksums the preserved reports and artifact-integrity manifest.

The run's evidence artifact is `v7-build-pwa-performance-aa579e7dba29583f49f59c6c020c32356e57296c` (artifact id `11379150935`, 54,871,149 bytes, archive digest `sha256:3fcad31f0ac70f66fc415912168927d64d38ee427422148d4d2d4806018351b2`). GitHub currently retains it through `2026-10-19T23:07:39Z`.

## What the existing PWA/offline evidence establishes

The built PWA harness verifies the manifest identity and standalone metadata, required icons, four manifest shortcuts and their routes, active service-worker registration, assignment/due push payload handling, and an offline reopen of the previously loaded Home shell at a 390 px viewport. The offline check proves cached application-shell availability after one online load. It does not claim physical install UI, arbitrary uncached feature routes, online-only backend data while disconnected, or offline Scripture-package acceptance.

The build evidence enforces the existing numeric budgets rather than relying on an informal size review. These include total artifact size, browser-entry and startup JavaScript, startup stylesheet size, per-feature route JavaScript/stylesheets, image/font limits and minimum dynamic feature-route splitting. Scripture package manifests and payload checksums are also verified for the inherited downloadable translations covered by the build script.

## Lane C P5 readiness matrix

| Evidence row | Current state | Basis / remaining boundary |
|---|---|---|
| Deterministic exact-source build | READY FOR FINAL CANDIDATE | Existing workflow validates and checks out the selected SHA, embeds build identity and verifies artifact integrity. Final execution must use the frozen release candidate SHA. |
| Performance budgets / route splitting | READY FOR FINAL CANDIDATE | Existing successful run proves the gate is executable and passing on the corrected source. Re-run on the frozen candidate is required if the exact source differs. |
| PWA manifest, icons, shortcuts and service worker | READY FOR FINAL CANDIDATE | Automated built-artifact coverage exists and passed. Physical installed-PWA behavior remains a separate evidence class where required. |
| Offline application shell reopen | READY FOR FINAL CANDIDATE | Automated Chromium proves previously loaded Home shell reopen while offline. Do not generalize this to uncached content/data or physical-device offline behavior. |
| Exact-candidate evidence artifact | OPEN | No final V7 candidate is frozen. The serialized candidate owner must dispatch the existing workflow with `candidate_sha` equal to that frozen SHA and preserve the resulting certificate/checksums/artifact. |
| Deployed identity / production smoke | OPEN | Requires the serialized release owner after P5/Q4 go/no-go. This preparation performs no deployment or production mutation. |
| Applicable physical-device / installed-PWA observation | OPEN / inherited where valid | Automated headless Chromium is not physical-device evidence. Preserve valid V6 evidence only where V7 did not invalidate its inputs; otherwise record a new observation against the final candidate/deployment. |

## Final candidate execution contract

1. Do not invent a second build/PWA/performance gate. Use the existing workflow's `workflow_dispatch` input `candidate_sha` with the single frozen 40-character V7 candidate SHA.
2. Require a successful run whose selected source exactly equals that candidate. Preserve `certification.json`, `build-report.json`, `content-report.json`, `evidence.sha256`, `bq-artifact-integrity.json` and the built artifact before retention expires.
3. Treat any source-changing fix after certification as a new candidate requiring affected recertification. Documentation-only changes may be evaluated by the serialized candidate owner, but must not be silently represented as a different certified source.
4. Keep CI/BUILD/ARTIFACT, DEPLOYED and physical-device evidence distinct. A green workflow does not prove deployment identity or device-only behavior.
5. Production remains on V6 until the shared P5/Q4 release gate authorizes promotion. This packet performs no migration, deployment, candidate freeze, promotion or rollback action.

## Lane C completion boundary

Lane C's bounded P5 preparation is complete when this packet and the reusable exact-SHA gate are integrated. The only remaining build/PWA/performance actions are candidate-dependent shared release actions: freeze the candidate, run the gate for that exact SHA, preserve the resulting artifact, and attach any required deployed/device evidence. Those actions cannot be truthfully completed before the candidate exists and the shared release gate is reached.

Preparation verification: workflow and built-PWA harness inspected at development HEAD; successful run identity, step completion, artifact metadata/digest/retention and evidence boundaries verified. No runtime, workflow, service-worker, production or canonical-status change was made by this preparation packet.
