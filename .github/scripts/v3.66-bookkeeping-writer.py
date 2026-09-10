from pathlib import Path

inv=Path('FEATURE_INVENTORY_V3.md')
text=inv.read_text()
replacements={
    '- **Regression-tested:** 91':'- **Regression-tested:** 92',
    '- **Not started:** 8':'- **Not started:** 7',
    '| 42 | Same-room Play Together | Yes | Clean | Not started | 2–6 players; rotating turns; scoreboard; finish |':'| 42 | Same-room Play Together | Yes | Clean | Verified | 2–6 players; rotating turns; scoreboard; finish |',
    '| 94 | Reset/recovery page | Yes | Standalone old | Verified | reset path; cancellation; invalid state |':'| 94 | Reset/recovery page | Yes | Standalone old | Regression-tested | reset path; cancellation; invalid state |',
}
for old,new in replacements.items():
    if text.count(old)!=1:
        raise SystemExit(f'inventory anchor mismatch: {old}')
    text=text.replace(old,new,1)
inv.write_text(text)

validator=Path('scripts/validate-v3-same-room-play-together.mjs')
v=validator.read_text()
old="assert.ok(inventory.includes('| 42 | Same-room Play Together | Yes | Clean | Not started | 2–6 players; rotating turns; scoreboard; finish |'));"
new="assert.ok(/^\\| 42 \\| Same-room Play Together \\| Yes \\| Clean \\| (?:Not started|Implemented|Verified|Regression-tested) \\| 2–6 players; rotating turns; scoreboard; finish \\|$/m.test(inventory),'inventory #42 row is missing or malformed');"
if v.count(old)!=1:
    raise SystemExit('same-room lifecycle validator anchor mismatch')
validator.write_text(v.replace(old,new,1))

Path('DEVELOPMENT_STATUS_V3.md').write_text('''# BibleQuest v3 Development Status

Updated: 2026-09-11 JST during #42 Same-room Play Together bookkeeping verification.

`FEATURE_INVENTORY_V3.md` is authoritative. Live GitHub refs and executed Actions evidence supersede stale text.

## Deployment safety

- Latest frozen release: `release/v3.65-reset-recovery` at `ab3584906b3d017ea555416910f23e9414ed2ef8`; exact bookkeeping verification run `34535332838` passed.
- Active branch: `feature/v3-same-room-play-together`.
- #42 green functional candidate: `22d054725ba983c4fe81fbd220688a3c12ee211c`; complete run `34539110697` passed architecture, edge, and browser/mobile regressions.
- `main`, production v2, Supabase/data, and Cloudflare remain untouched.
- Product regression workflow remains `workflow_dispatch` only; temporary push triggers stay isolated.

## Current bookkeeping candidate state

| State | Count |
|---|---:|
| Regression-tested | 92 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 7 |
| Total | 100 |

Strict parity is **93/100**; regression stability is **92/100**. #94 is now Regression-tested because it survived the complete #42 functional gate; #42 is Verified. #15 and Kids #38–40 remain deferred. #43 Live Rooms is next; #44–45 Bible World remain unfinished.

## #42 verified functional boundary

#42 restores same-device pass-and-play for 2–6 players inside the clean Games owner. It provides player-count setup, rotating turns, an in-session scoreboard, explicit finish, and a final winner/tie result. Same-room score state is ephemeral and does not award profile XP or write persistence. #43 Live Rooms remains separate and is not absorbed by this milestone.

Permanent evidence: `docs/V3_SAME_ROOM_PLAY_TOGETHER_CONTRACT.md`, `src/app/games.js`, `src/features/games/index.js`, `scripts/validate-v3-same-room-play-together.mjs`, `tests/v3-same-room-play-together-edge.mjs`, `tests/v3-same-room-play-together-smoke.mjs`, `.github/workflows/v3-regression.yml`.

## Defect / root-cause ledger

- The first partial #42 feature commit exposed service methods but no reachable Play-page UI or permanent regression wiring, so it was rejected as a promotion candidate.
- The first isolated writer failed because it assumed `docs/` already existed; after correction, the product patch passed focused architecture/edge checks. Its initial push then hit GitHub App workflow-write restrictions. Product files were pushed separately and the permanent manual regression workflow was updated through the connected GitHub writer.
- Exact functional candidate `22d054725ba983c4fe81fbd220688a3c12ee211c` passed complete run `34539110697`.
- Lifecycle audit run `34539369826` found one promotion pin: the new #42 validator required literal `Not started`. It is corrected to accept valid lifecycle states while retaining exact row identity and acceptance text. Because bookkeeping changes the SHA, the resulting candidate requires a fresh complete exact-SHA gate.

## Next major milestone

Run complete exact-SHA bookkeeping verification. On green, freeze `release/v3.66-same-room-play-together` at that exact successful bookkeeping SHA, verify refs, then recover #43 Live Rooms from retained behavior before implementation.

## Release rule

Never freeze an untested bookkeeping SHA. Temporary verifier commits are never release SHAs.
''')

Path('DEVELOPMENT_HANDOFF_V3.md').write_text('''# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST during #42 Same-room Play Together bookkeeping verification.

Live GitHub refs and exact executed evidence are authoritative; recover them first.

## Frozen baseline

- Repo: `11ll11l1l1l/BibleQuest`.
- Latest frozen: `release/v3.65-reset-recovery` at `ab3584906b3d017ea555416910f23e9414ed2ef8`.
- v3.65 exact bookkeeping verification run `34535332838`: **success**.
- `main`, production v2, Cloudflare, data and Supabase untouched.
- Normal v3 Actions are dispatch-only; temporary push triggers stay isolated.

## Current #42 state

- Active branch: `feature/v3-same-room-play-together`.
- Green functional SHA: `22d054725ba983c4fe81fbd220688a3c12ee211c`.
- Complete functional run `34539110697`: **success** across accumulated architecture, edge and browser/mobile suites, including the dedicated #42 smoke path.
- Bookkeeping state after promotion: **92 Regression-tested / 1 Verified / 0 Implemented / 7 Not started**; strict parity **93/100**, regression stability **92/100**.
- #94 is Regression-tested; #42 is Verified. The changed bookkeeping tip requires a fresh complete exact-SHA gate before v3.66 freeze.

## #42 verified boundary

Same-room Play Together is local pass-and-play only: 2–6 players, rotating turns, visible in-session scoreboard, explicit finish, and winner/tie summary. Games remains the single service owner and the Play page delegates to it. Same-room score state is ephemeral; it does not award profile XP or persist its scoreboard. #43 Live Rooms remains a separate networking/reconnect capability.

Permanent evidence: `docs/V3_SAME_ROOM_PLAY_TOGETHER_CONTRACT.md`, `src/app/games.js`, `src/features/games/index.js`, `scripts/validate-v3-same-room-play-together.mjs`, `tests/v3-same-room-play-together-edge.mjs`, `tests/v3-same-room-play-together-smoke.mjs`, `.github/workflows/v3-regression.yml`.

## Reproduced defects and permanent handling

- Partial SHA `3d0d3591e10abc45cb24687a6ecd32ca4951bd4d` added service state without a reachable clean UI and was not promoted.
- Writer verification initially failed on a missing `docs/` directory and later on GitHub App workflow-write permission; neither was counted as product verification. The repaired writer produced the clean product patch, focused architecture/edge checks passed, and workflow wiring was committed through the connected GitHub writer.
- Candidate `22d054725ba983c4fe81fbd220688a3c12ee211c` then passed complete functional run `34539110697`.
- Lifecycle audit `34539369826` found no other #42 lifecycle pins; only the new same-room validator pinned `Not started`. That assertion is made lifecycle-tolerant for legitimate promotion without weakening capability identity or acceptance checks. The bookkeeping SHA must now pass the entire suite from scratch.

## Next capability boundary

#43 Live Rooms is next after v3.66 freeze. Recover retained create/join/leave, reconnect, and stale-room-state behavior before coding. Do not fold Live Rooms into #42. #15 and Kids #38–40 remain deferred.

## Exact next executable sequence

1. Use the promoted live `feature/v3-same-room-play-together` tip as the bookkeeping candidate.
2. Run isolated exact-SHA complete bookkeeping gate; do not transfer PASS from functional SHA `22d0547...`.
3. On green, freeze `release/v3.66-same-room-play-together` at that exact successful bookkeeping SHA.
4. Verify release/product refs equal it.
5. Branch #43 from frozen v3.66; recover retained Live Rooms contract/owners/tests, then implement and verify.

## Non-negotiable safety

Rebuild-and-verify; one owner per responsibility; no PASS transfer across changed SHAs; no production or `main` mutation without explicit authorization.
''')

Path('TIMELINE_V3.md').write_text('''# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- 100 total; **92 Regression-tested / 1 Verified / 0 Implemented / 7 Not started**
- Strict parity **93/100**; regression stability **92/100**
- Frozen v3.65 Reset/recovery: `ab3584906b3d017ea555416910f23e9414ed2ef8`, exact bookkeeping run `34535332838` green
- #42 functional: `22d054725ba983c4fe81fbd220688a3c12ee211c`, complete run `34539110697` green
- Lifecycle audit `34539369826` found only the #42 validator's pre-promotion `Not started` pin; corrected in the bookkeeping candidate.
- #43 Live Rooms follows v3.66 freeze.
- #15 and Kids #38–40 remain deferred.

## Recent frozen release line

- v3.62 Content Review — `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`
- v3.63 Admin Console — `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`
- v3.64 Admin Operations — `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`
- v3.65 Reset/recovery — `ab3584906b3d017ea555416910f23e9414ed2ef8`
- v3.66 Same-room Play Together — pending bookkeeping gate

## Recent milestone sequence

| Capability | State | Evidence |
|---:|---|---|
| #94 Reset/recovery | Regression-tested | survived #42 complete functional run `34539110697` |
| #42 Same-room Play Together | Verified | `22d054725ba983c4fe81fbd220688a3c12ee211c`, run `34539110697`; bookkeeping gate pending |
| #43 Live Rooms | Not started | next after v3.66 freeze |

## #42 chronology

Recovered the retained same-room contract from the old group-play path and kept #43 networking separate. The first partial feature SHA exposed service methods without a reachable clean Play UI, so it was rejected. The repaired writer generated the service/UI/tests/docs from frozen v3.65, and focused architecture/edge checks passed. GitHub App workflow-write restrictions required permanent regression wiring to be committed separately through the connected GitHub writer.

Exact candidate `22d054725ba983c4fe81fbd220688a3c12ee211c` then passed complete accumulated architecture, edge, and browser/mobile run `34539110697`. Promotion-safety audit `34539369826` found only the new validator's literal `Not started` pin. The bookkeeping candidate corrects that lifecycle assertion and promotes #94→Regression-tested and #42→Verified; because the SHA changes, it requires a fresh complete gate.

## #43 read-only boundary reminder

Acceptance is create/join/leave, reconnect, and no stale room state. Recover retained source/history and ownership before coding; do not extend #42 local pass-and-play into realtime networking.

## Next sequence

Verify #42 bookkeeping SHA → freeze v3.66 → verify refs → branch/recover #43 → implement/targeted/full verification.

## Release discipline

Production and `main` stay untouched; normal CI stays manual-only and temporary push triggers remain isolated.
''')
