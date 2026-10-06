# V7 A2 BSB emotion reference seed — 2026-10-07

Scope: issue #1282 Scripture-context research for the 30 canonical launch emotions.

Status: **candidate reference seed prepared; contextual/editorial validation remains open**.

## Rights evidence

The official Berean Bible terms state that the Berean Bible and Majority Bible texts were dedicated to the public domain on April 30, 2023, that all uses are freely permitted, and that public-domain derivatives/adaptations are permitted.

- Terms: https://berean.bible/terms.htm
- Free licensing: https://berean.bible/licensing.htm
- Downloads: https://berean.bible/downloads.htm

This tranche stores **references only**. It does not copy BSB verse text into the A2 curation manifest.

## Seed coverage

`data/v7/curation/devotional-emotion-bsb-reference-seed.json` contains:

- 30 canonical emotions;
- exactly 5 candidate BSB references per emotion;
- 150 emotion/reference links total;
- no verse text;
- 0 emotions marked reviewed;
- 0 emotions counted as satisfying the reviewed BSB-reference release target.

The five-reference numeric seed therefore does not close the issue #1282 requirement by itself. Each mapping still needs contextual and editorial validation for direct relevance to the emotion, including review of passages that can be misused when detached from their literary or historical context.

## Fail-closed boundary

Until the reference mappings are reviewed:

- keep the source coverage summary at `emotionsMeetingBsbReferenceTarget = 0`;
- do not call the references editorially approved or directly relevant by default;
- do not infer devotional publication approval from BSB public-domain status;
- do not copy verse text merely to make the curation artifact look complete;
- preserve rights, editorial review, translation review and publication state as independent gates.

This seed exists to make the remaining review finite and machine-checkable, not to replace that review.
