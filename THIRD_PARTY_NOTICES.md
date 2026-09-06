# BibleQuest third-party notices

The MIT license in `LICENSE` covers original BibleQuest application code only. It does not relicense third-party Scripture text, datasets, libraries, or services.

Key resources currently used by BibleQuest include:

- Berean Standard Bible (BSB): used according to the publisher's published permissions. See `DATA_SOURCES.md` for the exact source and handling rules.
- Tagalog Unlocked Literal Bible / banal na Bibliya: CC BY-SA 4.0; attribution remains with the Door43 / unfoldingWord source community.
- STEPBible TBESH / TBESG lexical datasets: CC BY 4.0.
- unfoldingWord resources and Open Bible Stories: individual open licenses apply as documented in `DATA_SOURCES.md`.
- OpenBible.info cross-reference data: source terms apply to the imported dataset.
- Japanese 口語訳 text: BibleQuest requests the 1954 New Testament / 1955 Old Testament Kougo-yaku edition from GetBible. The Japan Bible Society states that copyright protection for the 1955 edition has expired, while authors' moral rights remain and later corrected wording can still be protected. BibleQuest therefore keeps the fetched Scripture wording intact and renders furigana, vocabulary notes, and other learning aids as separate annotations rather than rewriting the verse text.
- NLT, ESV, NIV, and AMP: copyrighted translations. BibleQuest does not grant redistribution rights to them and does not bundle their full text. The current production reader routes these choices to licensed/official external readers; any future direct API integration must keep credentials private and follow the publisher's current terms.
- Supabase JavaScript client, Kuromoji, and other third-party software libraries: their upstream software licenses apply.

Do not assume that because the BibleQuest repository is public, every file or text resource inside or referenced by it is MIT-licensed. Before redistributing a dataset or translation independently, check its source-specific terms in `DATA_SOURCES.md`.
