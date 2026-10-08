# V7 Scripture asset inventory — initial live-branch metadata pass

Source: `v7/development`, inspected 2026-10-09. This is a metadata-only pass, **not** image-pixel inspection, verse text validation, or theological approval.

- Master image records: **19**
- Schema v2 records: **11**
- Schema v1 records: **8**
- TYPE variants with declared reference-only wording: **11**
- TYPE variant with missing `scriptureTextIncluded` marker: **1** (Temptation, schema v1)
- Metadata title discrepancy: **1** (Temptation TYPE label vs canonical taxonomy)
- Independently reviewed actual image pixels in this pass: **0**
- Approved exact Scripture quotations in this pass: **0**

| Asset concept | Schema | TYPE title | Reference | Metadata concern |
|---|---:|---|---|---|
| anxiety_worry | 1 | — | — | no inline TYPE variant |
| confusion_uncertainty | 2 | Confused / uncertain | James 1:5 | image/context review pending |
| discouragement | 2 | Discouraged | Galatians 6:9 | image/context review pending |
| excitement | 2 | Excited | Psalm 126:3 | image/context review pending |
| fear | 1 | — | — | no inline TYPE variant |
| gratitude | 1 | — | — | no inline TYPE variant |
| grief_loss | 2 | Grieving / loss | Psalm 147:3 | image/context review pending |
| guilt | 2 | Guilty | 1 John 1:9 | image/context review pending |
| hope | 2 | Hopeful | Romans 15:13 | image/context review pending |
| hopelessness | 2 | Hopeless | Romans 15:13 | image/context review pending |
| hurt_betrayal | 1 | — | — | no inline TYPE variant |
| impatience_waiting | 2 | Impatient / waiting | Psalm 27:14 | image/context review pending |
| jealousy_envy | 2 | Jealous / envious | Proverbs 14:30 | image/context review pending |
| joy | 1 | — | — | no inline TYPE variant |
| peace_contentment | 2 | Peaceful / content | John 14:27 | image/context review pending |
| rejection | 1 | — | — | no inline TYPE variant |
| sadness | 2 | Sad | Psalm 34:18 | image/context review pending |
| spiritual_dryness_distance | 1 | — | — | no inline TYPE variant |
| temptation | 1 | **Temptation** | 1 Corinthians 10:13 | **taxonomy label is Tempted**; text inclusion flag absent |

Important: Some schema v1 derivative files may exist as separate `-derivatives.json` sidecars. They require a separate inventory and cannot be assumed to be text-free merely because the master has no inline variants.

## Remediation order

1. Quarantine or correct the temptation TYPE title after inspecting actual binary.
2. Enumerate all derivative sidecars and their referenced binary files.
3. Independently inspect every TYPE image at 320px; transcribe actual letters and reference.
4. Verify each quoted passage against the specified edition, translation, license and context.
5. Add individual review evidence and wire full inventory into release gate.
6. Audit devotional and teaching content separately; this visual record inventory is not a complete BibleQuest content inventory.
