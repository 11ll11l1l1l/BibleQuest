# BibleQuest browser pack attribution

## English Bible packs

BibleQuest English verse packs are generated from the Berean Standard Bible (BSB) public-domain / CC0 source data already retained by this project. The browser files under `data/packs/bible/` are reduced delivery packs and are not a new translation.

## Tagalog Bible packs

The files under `data/packs/tagalog/` reproduce the **Tagalog Unlocked Literal Bible (TGLULB)**, copyright © 2018 Door43 World Missions Community. TGLULB is distributed under the Creative Commons Attribution-ShareAlike 4.0 International license (CC BY-SA 4.0). BibleQuest retains that attribution and ShareAlike notice for these reduced browser delivery packs.

Source reference: https://ebible.org/find/details.php?id=tglulb
License: https://creativecommons.org/licenses/by-sa/4.0/

## Cebuano / Bisaya Bible packs

The files under `data/packs/cebuano/` reproduce **Biblica® Open Ang Pulong sa Dios™ / Biblica® Open Cebuano Contemporary Bible™ 2024 (OCCB / CEBOCB)**.

Katungod sa pagmantala © 2009, 2010, 2014, 2024 Biblica, Inc.
Copyright © 2009, 2010, 2014, 2024 by Biblica, Inc.

This work is made available under the Creative Commons Attribution-ShareAlike 4.0 International license (CC BY-SA 4.0): https://creativecommons.org/licenses/by-sa/4.0/

“Biblica” is a trademark registered in the United States Patent and Trademark Office by Biblica, Inc. Used with permission.

Source package used by BibleQuest: `https://ebible.org/Scriptures/cebocb_usfm.zip`. The exact downloaded package SHA-256 and source-file inventory are retained in `data/packs/cebuano/SOURCE.json`.

BibleQuest converts the published USFM into reduced local browser delivery packs so the translation can work through the existing offline Bible Reader. The conversion omits non-verse USFM layout and publication material such as section headings, footnotes, cross-references, figures, and related formatting metadata. Scripture verse wording is not translated, paraphrased, or doctrinally rewritten by BibleQuest. When the source contains a numeric verse bridge (for example, verses 17–18 as one source text unit), BibleQuest stores that bridge text once with a numeric start/end range and renders the range as one verse unit; it does not duplicate or split the source wording. These packaging changes are disclosed here as modifications to the source format.

Redistributions of these CEBOCB-derived packs must preserve the required attribution and ShareAlike obligations of CC BY-SA 4.0.

## Question packs

Question/answer recall decks are generated from unfoldingWord Translation Questions v90 and retain the CC BY-SA 4.0 license. These browser packs are reduced delivery formats of the source datasets; they are not independent theological authorities.


## Ilocano Bible packs

`data/packs/ilocano/` reproduces **Ti Biblia / Ilocano Unlocked Literal Bible (iloulb)**, copyright © 2019 Door43 World Missions Community, from eBible.org's VPL export. These derived per-book delivery packs are distributed under **CC BY-SA 4.0**: https://creativecommons.org/licenses/by-sa/4.0/ . Source: https://ebible.org/iloulb/ ; download: https://ebible.org/Scriptures/iloulb_vpl.zip . The archive's complete attribution, contributors and license are retained in `ilocano/LICENSE.html`; hashes, packaging changes and coverage are in `ilocano/SOURCE.json`.

Changes: source reference codes are mapped to BibleQuest canonical book codes and records are packaged as JSON. Source words and punctuation are unchanged; no endorsement by the original authors is implied. Contributions to this Scripture delivery text remain under the same CC BY-SA 4.0 license. Twelve source-empty verse addresses are recorded explicitly; BibleQuest does not invent text for them or borrow from another translation. No source images are included.

BSB delivery repair: Psalm 127:1 is restored verbatim from `base/text-only/PSA_127_BSB.txt` at the same pinned BSB Publishing commit as the original display data. The source bytes, CC0 license and checksums are retained in `data/source-repairs/bsb-psalm-127/`; the raw display export omits this verse. No translation wording is changed.
