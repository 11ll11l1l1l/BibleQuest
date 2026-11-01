# Source-backed Psalm 127:1 repair

Baseline: `1885266fc43563f7219ebd3b4be85adae975123e` (all eleven PR workflow groups PASS before this change). Production and frozen release/rollback refs are unchanged.

## Cause and source

The pinned BSB source commit `1f6fe37c8997a173182c78205695790d8b440b74` omits verse 1 in `base/display/PSA/PSA127.json`, but includes it in `base/text-only/PSA_127_BSB.txt`. The latter's five source lines are retained verbatim with SHA-256 and upstream CC0 license under `data/source-repairs/bsb-psalm-127/`. Lines 2–5 exactly match the existing chapter. The delivery repair adds only PSA 127:1; no verse is inferred or borrowed from another translation. The raw display index is retained as its original source snapshot, not silently rewritten to imply upstream included the verse.

`scripts/bsb_source_repairs.py` verifies source/license hashes, pinned identity, exact five-line coverage and existing text before applying the one-address repair. Conflicts fail closed. The existing browser-pack build calls this helper, preventing regeneration from dropping the repair. Psalms delivery count and package-derived content version change accordingly. Couples c29/c49 now have bundled text for their entire cited range; all 80 card references pass coverage checks.

## Audio evidence

Upstream word timings at existing `bsb-align` revision `bdb859afc427b215b78e12ee4a7798c32b7b91e0` fail strict text compatibility; they were not reused. The existing shard runner regenerated only PSA 127 against the exact certified Hays MP3: 668,426 bytes, SHA-256 `247f3659eb2ac645909a916eaf1c56488001229a92a7a93888bb3075086dac38`, ffprobe duration 52.140408 seconds. CPU MMS_FA used torch/torchaudio 2.8.0+cpu and uroman 1.3.1.1. Five verses / 102 words; mean word score 0.9712156863, zero low-confidence or unscored words. This is machine timing evidence, not physical listening acceptance.

Retained word output and hashes are recorded alongside the source. `scripts/v8-repair-bsb-psalm-alignment.mjs` uses the existing converter and complete-manifest builder. It verifies the original complete alignment identity against the original Psalms bytes and unchanged 65 other books before reusing 1,188 unchanged chapter timings. Only PSA 127 timing ranges change; audio hashes/bytes and all other ranges remain identical. The rebuilt complete manifest covers 1,189 chapters / 30,970 present delivery verses and binds Scripture version `sha256-dadec90dc4d4540bfb69`. Historical certificates are preserved and are not rewritten into certification of this candidate.

Reproduction: export previous Psalms and alignment bytes using `git show 1885266fc43563f7219ebd3b4be85adae975123e:<path>`, then run `node scripts/v8-repair-bsb-psalm-alignment.mjs <old-PSA.json> <old-alignment.json> data/source-repairs/bsb-psalm-127/PSA_127_words.json <output.json>`. The regression reconstructs the previous inventory digest, reproduces the new manifest and rejects altered previous text identity.

## Validation / remaining release work

All 882 V6 tests and all 58 V8 tests PASS locally, including source/Reader/search/offline/canonical coverage and timing/replay regressions. Existing audio acceptance/runtime catalog checks pass with the new exact content version; typecheck and production build pass. Three inherited source assertions in the full V6 suite still expected pre-Ilocano peek/search/close copy; they now assert the real escaped display-reference seam, English fallback, localized close label and unchanged generation guards. No runtime/privacy denial or validation gate is removed.

New exact-head CI/deployment verification and physical phone audio/offline acceptance remain required. Full Ilocano UI, closed-app practice delivery, central-media provider setup, wider reviewed content/ALAM and independent review remain open. No production promotion is performed.
