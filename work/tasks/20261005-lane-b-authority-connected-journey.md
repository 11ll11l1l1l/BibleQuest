# Lane B — authority-connected ONE 2 ONE journey contract

Starting integration: `e66051d6f3ec6e09a49e405ef3fb2bd923a9f24e`.

The P4-B mentor journey evidence still encoded #1168 and #1170 as unresolved blockers after the atomic publication and race-safe assignment authorities were integrated. Replace that stale read-only blocker assertion with deterministic cross-feature evidence that the immutable prepared curriculum path is accepted by the publication authority, then the same published lesson revision is selected and accepted by the assignment authority.

The assignment preparation service remains intentionally selection/request-only; backend mutation stays injected through the existing authoritative services. This tranche does not claim browser/mobile, live-backend, deployed, RLS, or production evidence. Those remain separate P4/P5 certification work.