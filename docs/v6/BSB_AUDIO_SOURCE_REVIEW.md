# V6 BSB Audio Bible source review

Review date: 2026-09-28

## Selected source

The source mapping is complete: use the **Barry Hays narration** as the default V6 English BSB Audio Bible, with **Bob Souer** available as an explicit user-selectable alternative. The [OpenBible Hays directory](https://openbible.com/audio/hays/) and [Souer directory](https://openbible.com/audio/souer/) expose per-chapter BSB MP3 files. Hays filenames append `_H`; Souer filenames do not. The Hays combined archive is listed as 3.7 GB. These directories are streamed on demand; BibleQuest does not bundle their audio or enable local copies.

Delivery plan: stream the source chapter URL on demand, with no BibleQuest server-side audio copy required. Offer chapter/book downloads only after the user requests them; successful downloads go to that user's local PWA storage and are verified by exact bytes/checksum. If browser CORS prevents JavaScript-managed downloads, keep direct `<audio>` streaming and report offline download as unavailable. Do not proxy/mirror as the default. A future mirror is a contingency that requires explicit product approval and its own exact package validation.

The V6 policy models streaming and offline-copy permissions independently. The lazy Reader fetches the build-generated current BSB content version and builds direct OpenBible Hays and Souer URL catalogs for all 1,189 chapters; no audio bytes, fabricated sizes, or checksums are bundled. Hays is the default. A narrator control switches sources and persists the user's choice; the newly selected chapter source is loaded before the old source is paused so Media Session state follows the selection. Chapter playback can stream without timing, while verse seeking/highlighting stays hidden until timing rows match the current BSB version and source files. Exact source-file identity, OpenBible response/range behavior, real-device playback, and alignment identity remain open. Offline-copy permission stays review-required, so local caching remains blocked.

The [BSB Audio Bible project](https://audiobible.org/) states that the Bob Souer, Barry Hays, and Jordan Gilbert narrations are dedicated to the public domain under CC0 1.0. The [Berean Bible project About page](https://biblicalalignment.org/about) independently credits those narrations as CC0 and says they were produced in cooperation with the Berean Bible Translation Committee. OpenBible's [audio download page](https://openbible.com/audio.htm) identifies a BSB Barry Hays chapter set, and OpenBible's [terms](https://openbible.com/terms.htm) say most site content is CC0, with exceptions. Together these provide explicit project/publisher licensing evidence for the named BSB narration; retain the exact declarations in the release manifest and do not rely on a generic directory listing alone.

Barry Hays is the selected first narrator because the [BSB-publishing/bsb-align repository](https://github.com/BSB-publishing/bsb-align) ships word timings across its output for the BSB and points to the OpenBible `/audio/hays` recording set. The README calls the recording "Bob Hays," while OpenBible and the BSB Audio Bible project call this set "Barry Hays." Treat this as a provenance-label discrepancy to close against the exact staged files and timing corpus, not as evidence that the source itself is unidentified. The timing corpus is a starting point; its per-word content must still pass the current checkout's BSB text/revision importer and be reviewed against the selected files.

## Evidence boundary

The CC0 statement is made by the BSB Audio Bible project and is repeated on the Berean Bible site. Creative Commons describes CC0 as a public-domain dedication tool and states that it does not verify the copyright status of works to which CC0 is applied. The alignment repository licenses its code under MIT, which does not license audio. Therefore:

- Record the selected source as **Barry Hays / BSB Audio Bible / OpenBible chapter MP3s**. Keep the CC0 1.0 declaration and the Berean Bible corroboration URL in the generated release manifest.
- Do not infer permission from the MIT license on the alignment code repository.
- The source-selection decision and narrator-specific CC0 declaration are documented. Direct chapter streaming is enabled as the selected delivery plan, while metadata remains `rights: review-required`; this does not authorize making or retaining local copies. Keep `offlineCopy` fail-closed until exact-file provenance, copy permission, sizes, and checksums have been reviewed.
- Keep verse synchronization disabled until timing is imported and checked against the exact current BSB content revision and selected chapter recordings. R2 inventory review applies only if a future decision explicitly chooses a BibleQuest mirror.

## Integration contract

1. For the default direct-stream design, do not download or stage the complete library. Validate chapter URLs and browser playback against the live source. If a future approved mirror is chosen, stage MP3s temporarily (never commit binaries); the ingest/preflight tool recognizes names such as `BSB_01_Gen_001_H.mp3` directly and maps them to canonical BibleQuest book/chapter IDs without renaming.
2. Use the Hays word-timing outputs in `bsb-align/output/` as candidate timing input. Reconcile the upstream "Bob Hays"/"Barry Hays" label discrepancy and inspect timing provenance. Convert words to the V6 verse timing schema only after validating every chapter and its source revision.
3. Review attribution, the exact source URLs, rights evidence, reviewer identity/date, chapter coverage, duration bounds, and total bytes.
4. Convert the published `output/{BOOK}/{BOOK}_{NNN}_words.json` files with `scripts/v6-import-bsb-word-alignments.mjs`. It checks every timing word against this checkout's current BSB chapter text, derives the BSB Scripture content version from the package generator, checks every verse/duration, and records low-confidence timing counts. Pilot imports require the explicit `--allow-partial` flag; the publication ingest still refuses partial coverage.
5. Inspect the converted rows and score report, then copy the generated `scriptureContentVersion` into `source.json`. The audio provider requires the live Reader Scripture content version, audio-source version, and every timing row to agree before playback can be enabled.
6. For local downloads, verify whether OpenBible permits browser fetch in the actual target PWA origins. Generate per-chapter size/hash metadata from the exact current files and alignments; enable `offlineCopy: allowed` only after the source copy terms and files are reviewed. Run `scripts/v6-audio-ingest-manifest.mjs` only if the product later chooses an approved mirror; this is no longer the default delivery plan.
7. Upload the approved payloads to BibleQuest-controlled R2 Standard storage and prove the final hosted inventory remains below 10 GB.

The alignment converter expects a JSON array of measured chapter durations, for example `{ "book": "GEN", "chapter": 1, "durationSeconds": 157.4 }`. Keep the duration data outside Git alongside the temporary audio staging set. The converter does not approve rights or make a partial timing set publishable.

## Current staging preflight

`node scripts/v6-audio-ingest-manifest.mjs --inspect <staging-dir> [report.json]` produces a machine-readable preflight report and exits with status 2 while anything is incomplete. A clean empty-directory probe reports 1,189 expected chapter files and 1,189 matching timing records, with zero staged in this checkout. The OpenBible directory listing shows the source layout and a 3.7 GB combined archive; run preflight against the downloaded/extracted corpus to report exact file count, missing chapters and measured bytes. This is diagnostic only: preflight does not fetch public assets, approve rights, bless timing, produce a serving manifest, or upload to R2. The production manifest builder still requires complete files and all reviewed source/alignment evidence, including an exact `scriptureContentVersion` match.

No audio files have been downloaded, transformed, uploaded, or enabled by this review.
