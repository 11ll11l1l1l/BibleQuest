# V5 localization closeout evidence — 2026-09-18

Runtime/source candidate: `04034d8749695d272f532ecc3e848b7ebf600a46`.

CI verification head: `ad692e585c28f56384d731b907570d33a6ab7bda`. That temporary verification branch differed from the source candidate only by a CI comment marker during the run. PR #445 was closed without merge, and its branch was force-reset back to the exact source candidate after verification.

## Scope closed

This tranche closes the remaining agreed V5 Tagalog and Cebuano/Bisaya localization work without changing localization architecture.

### Tagalog

- canonical Tagalog dictionary remains explicit for the full 444-key inventory;
- remaining accidental English-equivalent assignment/account/calendar strings were localized;
- Community and Videos/Recordings browser proofs were added to the accumulated localization closeout gate;
- the final completeness test allows only reviewed product names, proper terms, and common technical loanwords to remain byte-equal to English.

### Cebuano/Bisaya

- all previously inherited canonical UI fallbacks were authored in Cebuano except the intentional `BibleQuest` product name;
- 72 former canonical English fallbacks were closed, covering Community boundary/local-preview copy, Notification Center, Account status/error states, and Calendar month/category/detail states;
- remaining Videos/Recordings English fallback copy was authored in Cebuano;
- remaining assignment terms that were not reviewed product/technical terms were localized;
- BibleQuest-authored weekly journey / Ask at Dinner content remains explicitly authored in Cebuano;
- Scripture remains CEBOCB/approved-source content and is outside app-generated localization.

## Hard completeness gate

`tests/v5-localization-final-completeness.mjs` now verifies:

- exact EN/TL/CEB canonical key parity;
- stable placeholders;
- explicit Tagalog ownership for all canonical keys;
- explicit Cebuano ownership for every canonical key except the intentional `app.name = BibleQuest` product-name inheritance;
- no unexplained English equality outside reviewed shared-term allowlists;
- complete Tagalog/Cebuano Videos dictionaries with no inherited copy;
- Tagalog/Cebuano shell recovery copy;
- explicit Cebuano connected-weekly-journey authored content with canonical-English leak rejection.

The static closeout stage passed on verification run `35281386346`.

## Representative 390px browser evidence

`tests/v5-cebuano-member-browser.mjs` proves Cebuano on a 390 × 844 mobile viewport across:

- shared shell/navigation;
- Community ready-member state;
- Account/settings;
- Calendar;
- Videos/Recordings;
- connected weekly journey and Ask at Dinner authored content.

The browser matrix checks representative translated copy, runtime-data preservation, no canonical-English UI leak on the exercised surfaces, horizontal overflow, page errors, and touch-target dimensions.

The same closeout workflow also reruns the accumulated Tagalog browser surfaces:

- shared shell;
- Transformation;
- Calendar;
- Assignments;
- Notification Center;
- Account/settings;
- Community;
- Videos/Recordings;
- connected weekly journey;
- Home/Today representative browser proof;
- final mobile-width smoke.

All passed on run `35281386346`.

## Companion gates

The same verification head passed:

- collision guard: `35281386338`;
- Section G state/browser sweep: `35281386331`;
- Cloudflare preview smoke: `35281386515`;
- accumulated release-candidate regression, including browser/mobile regressions: `35281386502`.

## Acceptance result

The six previously open localization items are now supported:

1. Tagalog Community/Media and remaining agreed member-facing surfaces fully localized.
2. Tagalog completeness scan has no unexplained English leaks.
3. Cebuano/Bisaya member-facing UI fully localized for agreed V5 surfaces.
4. BibleQuest-authored member content localized in Cebuano/Bisaya for the agreed V5 localization scope.
5. Representative Cebuano mobile/browser checks have no clipping/overflow or inaccessible controls.
6. Cebuano completeness scan has no unexplained English/Tagalog fallback on agreed surfaces.

This raises formal acceptance coverage from **111/122 (91.0%)** to **117/122 (95.9%)**.

Remaining open gates are infrastructure/device/final-candidate gates only; localization is no longer a V5 release blocker.
