# V8 Ilocano Bible corpus/provider — 2026-11-01 JST

Continuation on integration PR #1558 after practices localization. Implements the Bible-text/provider priority of P3; full Ilocano app UI remains open.

## Source and rights

Edition: Ti Biblia / Ilocano Unlocked Literal Bible, eBible ID `iloulb`, copyright © 2019 Door43 World Missions Community. Primary source: https://ebible.org/bible/details.php?id=iloulb ; source copyright/license: https://ebible.org/iloulb/copyright.htm . Both the live source page and the downloaded archive's own `iloulb_about.htm` grant CC BY-SA 4.0 redistribution/adaptation with attribution, change indication and share-alike. Rights are tied to this exact source, not inferred from a different Ilocano edition/app listing.

Download: https://ebible.org/Scriptures/iloulb_vpl.zip . Archive SHA-256 `83f76c15b46cb7a20a664ac31aff41d4d0143c43f50ea0658387c2707b1db124`; extracted VPL SHA-256 `f8d3659dad50ae2a24b5b453da1aa2fc8ea1657bc354e456cb1c74512ae45d54`. The archive's complete copyright/contributor/license HTML is retained as `data/packs/ilocano/LICENSE.html`; machine-readable source/pack hashes and changes are in `SOURCE.json`. No source signature-verification claim is made. No images or alternate publisher text were imported.

The importer pins the VPL checksum, checks the archive license, maps publisher book codes to existing canonical codes, rejects malformed/duplicate/out-of-range references and validates every book/chapter before writing. It changes delivery/reference structure only; source words and punctuation stay unchanged. Generated Scripture packs remain CC BY-SA 4.0; original authors do not endorse BibleQuest's packaging. To reproduce, obtain the pinned archive, extract its VPL/license and run `node --experimental-strip-types scripts/import-ilocano-vpl.mjs <iloulb_vpl.txt> <iloulb_about.htm>`. A changed source checksum stops import pending source review.

## Coverage and implementation

66 canonical books, all 1,189 chapters, 31,090 nonempty text records. Twelve explicitly blank source addresses are recorded in provenance and remain unavailable rather than filled from another translation: Matthew 17:21/18:11/23:14; Mark 9:44/9:46/11:26/15:28; John 5:4; Acts 8:37/15:34/24:7/28:29. This is the verified source's coverage; no invented verse text, backfilled quotation or translation substitution is used.

Adds `ilo` to the existing Reader translation metadata, typed contracts, license policy, managed package folder/identity and deterministic source manifest generator. Existing per-book on-demand loading, text/reference search, selection persistence, verse peek and stored-pack fallback apply unchanged. Full-translation offline inventory/checksum eligibility is enabled through the existing manager; the build evidence gate now validates all four downloadable manifests. Existing NLT external-only and Japanese live/review-required boundaries are retained. No separate provider, cache or audio corpus is created.

## Verification

Local aggregate units 1,674/1,674 PASS: V6 880, V7 785, V8 media 9; plus existing 31-attempt ledger audit. New tests verify every pack hash/chapter/count, license hash, parser denials/code aliases, actual Reader select/load/search/restore, every source-empty address, network-failed opened-pack recovery and complete managed-offline inventory eligibility. Typecheck, production build, existing lint/format and whitespace PASS on Node 24.22.1. These are development checks, not pinned release or physical airplane-mode acceptance.

## Remaining

Full Ilocano UI/localized book-name rollout, new exact-head integrated/backend/browser/device/offline/reference validation and the broader V8 media/content/Couples/discovery scope remain open. No production deployment, DB migration/provider mutation, paid source, new dependency, source speech/audio generation or real-user notification was performed.
