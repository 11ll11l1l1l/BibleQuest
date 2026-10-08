# V7 image-generation scene briefs — independent Lane A handoff

Date: 2026-10-08 JST. Status: CREATIVE BRIEFS ONLY, **zero image assets delivered by this document**. These are concepts for actual image production; never count a brief, contact sheet, extracted low-resolution sample, or pending PR as a generated/approved production image.

Read alongside `docs/v7/V7_VISUAL_ASSET_PRODUCTION_20261008.md`, `docs/v7/V7_NEEDS_VISUAL_PIPELINE.md`, the exact taxonomy at `src/features/library/emotion-taxonomy.js`, and the current `data/v7/visual-assets/records/**` before choosing work. The inventory changes frequently. Skip any scene whose asset is already complete or actively being produced in a newer agent branch; use the next unfilled owned concept instead. Never overwrite other agent's output.

## Non-negotiable generation recipe

1. Generate **ONE standalone composition** per image job, not a grid, marketing mockup, asset sheet, screenshot, collage, or multi-card UI board. Source file must contain **only the scene**: no headline, verse, icon, watermark, logo, type, card border or interface.
2. Art direction: cinematic editorial realism, believable people/materials, compassionate nuanced expressions, contemporary global/Asian-inclusive everyday life, luminous but natural lighting. Avoid repetitive mountain sunsets, hand-heart silhouettes, glowing crosses, illustrated clip-art, pseudo-Scripture and exact imitation of other Bible apps. No invented copyrighted books, covers, or people.
3. Generate distinct real binary variants of the **same** approved composition: **CLEAN** text-free source; **TYPE** same scene with typographically composed, exact canonically audited language-specific short label and optional approved *reference only*; **THUMB** genuinely focused crop text-free. Never place TYPE overlay text on CLEAN or THUMB. A TYPE generated without font rights or exact source wording is a candidate, not approved. Default to CLEAN plus live localized labels outside EN.
4. Emotion tile target 1:1 (usable in 4:5 card when cropped deliberately); Need cards target 4:5. Record focal point and visually quiet title-safe region. WebP preferred with actual dimensions/size/hash. All statuses start candidate; only existing audit and built-browser QA can promote.
5. Perform actual per-file rights, anatomical, visual, focal, label/source-blob, alt text, SHA-256/byte/dimension, 320px render and duplicate checks. CI is evidence only for what it ran. Register unique `bqv7-emotion-...` or `bqv7-need-...` sidecar under the existing schema, not a second mutable asset registry.
6. The following scenes are **alternatives to explore**, not enforced canonical representations. Where scene collides with existing art, choose a genuinely different everyday moment and retain emotional meaning. Do not regenerate an existing CLEAN just to fill a derivative gap.

## Still-missing or candidate-only Feeling concepts

These were identified against the development inventory at time of writing, not an assertion they remain missing. Two concepts, excitement and love_connection, have draft PRs #1379/#1385; certify their existing candidates before commissioning duplicates.

| Queue concept | Owner | Distinct scene brief | Camera / crop / light |
|---|---|---|---|
| `sadness` | Visual Agent 1 | A woman on an ordinary city bus quietly watching rain trail down the window while commuters pass outside; melancholy without theatrical tears | profile through glass; cool muted blues; subject upper third; quiet lower third |
| `grief_loss` | Visual Agent 1 | An older adult gently folding a loved one's patterned scarf beside an empty coat hook in an intimate apartment; tenderness and memory | close detail of hands and textile; amber side light; no funeral symbols |
| `loneliness` | Visual Agent 1 | One young adult at an evening café table, an unoccupied chair across from them, a warm welcoming room visible beyond | medium environmental portrait, blue-hour street outside; leave one side uncluttered |
| `anger` | Visual Agent 1 | Person standing in a home kitchen after an argument, fists slowly unclenching over a countertop, the unfinished conversation implied by a second mug | observational side view; energetic diagonal light; avoid fighting or aggression |
| `shame` | Visual Agent 2 | A person hesitates at the doorway of a casual reunion, holding a coat, uncertain whether to step in; human vulnerability without humiliation | three-quarter silhouette; gentle backlight; face readable at tile crop |
| `insecurity_unworthiness` | Visual Agent 2 | Young professional before a mirror, gathering courage before entering a work presentation, reflected posture modest rather than triumphant | mirror and lived-in desk detail; soft diffuse daylight; no readable text |
| `doubt` | Visual Agent 2 | A student sits before two diverging paths under dense city overpass, holding a closed notebook and considering where to go | subject foreground; contrasting paths; cloudy naturalistic light; avoid road signs with text |
| `hopelessness` | Visual Agent 3 | A tired night-shift worker sits in a silent early-morning laundromat as the first daylight softly reaches the floor | still wide interior; deep navy to muted amber; hold face visible at small crop |
| `overwhelm` | Visual Agent 3 | Parent seated on floor amid neatly bounded everyday tasks, laundry basket and lunchboxes, shoulders burdened but dignified | medium overhead angle; visual weight around edges; central subject clear |
| `stress` | Visual Agent 3 | Worker in a busy station watches fast-moving silhouettes blur past while they remain still and focused on one difficult decision | slow shutter effect; intimate focal plane; contemporary neutral clothes |
| `tiredness_weariness` | Visual Agent 3 | Nurse or caregiver resting for a moment on a stair landing after a long shift, hands loosely folded, not sleeping or collapsing | quiet indoor dawn light; washed charcoal and warm beige; avoid medical logos |
| `frustration` | Visual Agent 4 | A craftsperson at a bench studies a repeatedly failed mechanical assembly, puts down a tool and chooses to start again | close workbench narrative; controlled gestures; bronze and slate |
| `numbness_emptiness` | Visual Agent 4 | A person alone on a commuter train in bright midday, expression distant as repeating empty seats recede behind them | symmetrical deep perspective; subdued color; avoid melodramatic darkness |
| `excitement` | Visual Agent 5 | A person gets joyful news during a casual kitchen breakfast, leaning toward a loved one with a spontaneous delighted expression | close candid gesture; morning sunlight; distinct from jumping mountain sunrise |
| `love_connection` | Visual Agent 5 | Two friends meeting after a long time at the entrance of a neighborhood bookstore, sharing an unforced relieved smile and hand on shoulder | human closeness; warm shop reflections; different from an abstract glowing-hand heart |

## Nineteen Need concepts

No Need artwork was found registered in the checked development tree at inventory time. Each agent follows existing modulo-five assignment, not this table as source of truth for canonical label/Scripture.

| Canonical Need ID | Owner | Distinct scene brief | Camera / crop / light |
|---|---|---|---|
| `peace` | Visual Agent 1 | Person opens a curtain in a quiet sunlit room and settles with a cup of tea; settled presence rather than inactivity | soft interior greens and cream; calm geometry |
| `wisdom` | Visual Agent 1 | Multigenerational conversation at a kitchen table, older listener paying full attention while a younger adult considers advice | natural skin and gestures; simple editorial frame |
| `rest` | Visual Agent 1 | Folded blanket and a person at ease in a shaded garden hammock after finishing work, authentic restorative pause | leaf-filtered daylight; no prayer cliché |
| `self_control` | Visual Agent 1 | Young person places a distracting phone face-down and turns toward an unfinished creative project by a window | tactile tabletop focus; phone screen blank |
| `hope` | Visual Agent 2 | Rain gradually clearing above an urban rooftop garden where a gardener finds a thriving new shoot | daylight transition; no sunrise mountain clichés |
| `guidance` | Visual Agent 2 | A hiker studies a trail fork with a trusted companion pointing out the next safe step, realistic modest woodland | human interaction center; no branded signs |
| `renewal` | Visual Agent 2 | Person repaints a weathered windowsill and opens a window to fresh spring air | renewal through small tangible action; pastel green and daylight |
| `encouragement` | Visual Agent 2 | Friend quietly helps another stand back up after a community 5K finish line, companionship not heroic rescue | low camera candid; avoid brand marks and flags |
| `comfort` | Visual Agent 3 | A parent wraps a blanket around an adult child on the sofa during a difficult conversation | tender non-romantic contact; muted warm room |
| `forgiveness` | Visual Agent 3 | Two siblings cautiously reconnect over a shared family photograph at a kitchen table, tentative smiles | subtle gesture; no chains/crosses as shorthand |
| `patience` | Visual Agent 3 | A gardener patiently waters a small greenhouse seedling while surrounding pots remain bare | detail scene; weathered gloves; believable season |
| `trust` | Visual Agent 3 | Young child crosses a small stream stepping stone with a parent's outstretched hand nearby, safe shallow water | natural outdoor quiet confidence; avoid peril |
| `courage` | Visual Agent 4 | New employee steps through the entrance to a community volunteer activity, shoulders steady despite apprehension | eye-level documentary frame; warm inviting doorway |
| `grace_identity` | Visual Agent 4 | Person pins an encouraging handmade artwork on a wall of personal memories, affirming belonging without written affirmations | observational intimate interior; no readable notes |
| `perseverance` | Visual Agent 4 | An amateur runner continues a slow steady training lap along an empty neighborhood path in light drizzle | restrained movement and determination; realistic effort |
| `celebration` | Visual Agent 4 | Small diverse family and friends sharing a modest homemade meal with genuine laughter at a kitchen table | candid mid-shot; no holiday or branded decorations |
| `strength` | Visual Agent 5 | Community volunteers carefully lift a heavy garden planter together, coordinated teamwork instead of extreme sport heroism | warm afternoon; physical agency; plausible hands |
| `healing` | Visual Agent 5 | Adult learns to walk comfortably again on an accessible garden path, supportive friend walking alongside | dignified recovery; no medical claims or visible injury |
| `connection` | Visual Agent 5 | People of different ages work together planting a small urban community garden, shared work and conversation | people visibly interacting; natural greens and warm daylight |

## Devotional-cover production sequence

After priority emotion/Need coverage, consume the repository's deterministic five-agent devotional queue added by PR #1378. Produce a **unique 4:5 scene for each selected first-party devotional ID**, keyed to the actual English title and body at its exact revision. Do not fabricate IDs, titles, emotions or verses from a theme guess. For each ID: extract a single grounded object, human action or lived moment from source prose; check corpus-wide scene diversity; vary interior/exterior, season, casting, color, camera and story beat; reserve lower 30–35% for live text or an independently reviewed TYPE treatment. Generate one standalone CLEAN, exact-English TYPE and focal-safe THUMB; record attribution, status, all three real file measurements, alt text, locale proof, source revision and verified byContent lookup.

Devotional emotion-master reuse is permissible as a temporary approved thematic fallback, but **does not count** toward the separately requested 300 individual covers. Never use unreviewed concept-sheet tiles as cover originals. All missing assets continue to use readable live localized text cards until independently approved. The old print-preview sheets with claims that hundreds of images were complete are visual mockups, **not evidence of completed image generation**.
