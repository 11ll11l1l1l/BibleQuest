# V7 manual modern random-three — producer preflight failures (2026-10-11 JST)

**Batch:** `18nihi` · source `v7/development` HEAD `c4d723273da503b052652e8403dde4bc3a4e8c01` · 3 selected / 3 rendered / **0 accepted** / **0 uploaded**.

Each source r1 content body and matching image guide chapter were inspected before claiming. Three canonical slots were reserved in this PR before generation, avoiding existing active PR candidates (#1521, #1522). Each attempted render was a single tool invocation, yet returned three-panel collages unrelated to the exact required contemporary scene. None was cropped to fake compliance. Each local image byte file was SHA-256 hashed, measured, and deleted; tombstones remain in `production-ledger.json`. All three slots are now released. No five-agent QA took place because none was a valid candidate.

| Exact ID | Intended guide scene | Measured source | Actual SHA-256 | Failure |
|---|---|---|---|---|
| `devotional.biblequest.confusion_uncertainty.06` | Modern station traveler receives available volunteer help for a lit platform | PNG 1536×1024, 2193849 bytes | `e84f56bdd526d15b62f7df0e7344faa5f37688c0375886bfdac17e260fc6465c` | Source mismatch: unrelated three-panel collage of home prayer, street food aid and Bible group. No station traveler or station volunteer; wrong 1536×1024 landscape. |
| `devotional.biblequest.excitement.08` | Modern theater apprentice pauses by unlit work lamp after good news | PNG 1536×1024, 2323688 bytes | `b14850051866fbd72ea46f013be0b8c77f0e099fcae94927293d43d9ab4a1e0d` | Source mismatch: unrelated three-panel collage (home prayer, labeled training workshop, water outreach). No theater apprentice backstage or unlit work lamp; contains signage; 1536×1024 landscape. |
| `devotional.biblequest.gratitude.10` | Traveler places a handmade bead beside plain ticket holder as a remembrance cue | PNG 1536×1024, 2215058 bytes | `4aa454fa8b34333d159549c96683f3f26bc836674be79004c6dbb81214d852c8` | Source mismatch: unrelated three-panel collage (home prayer, outdoor outreach, student at desk). No wooden bead, ticket holder or traveler remembrance cue; 1536×1024 landscape. |

**Safe outcome:** none of the three outputs satisfies the scene or 4:5 ratio. All pixels deleted locally. No binary pushed to GitHub, no automatic QA queued, no approval inferred. The three content IDs are eligible for distinct future attempts with **new** scene revisions after rechecking claims. Do not repeat these exact compositions or hashes.
