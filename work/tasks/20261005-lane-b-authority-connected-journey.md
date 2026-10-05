# Lane B — authority-connected ONE 2 ONE journey contract

Started from `e66051d6f3ec6e09a49e405ef3fb2bd923a9f24e`; refreshed onto `002ba1e3334548d412e859b479c77b9cd3109efb` after Lane B PR #1223, then onto integration `a5e077ee37f5fd333b6c720fa08bdfcd4ea84d48` after non-overlapping Library provenance PR #1225.

The P4-B mentor journey evidence still encoded #1168 and #1170 as unresolved blockers after the atomic publication and race-safe assignment authorities were integrated. Replace that stale read-only blocker assertion with deterministic cross-feature evidence that the immutable prepared curriculum path is accepted by the publication authority, then the same published lesson revision is selected and accepted by the assignment authority.

The assignment preparation service remains intentionally selection/request-only; backend mutation stays injected through the existing authoritative services. This tranche does not claim browser/mobile, live-backend, deployed, RLS, or production evidence. Those remain separate P4/P5 certification work.