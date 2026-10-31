# V8 bulk Library text intake

Use this offline preparation command for **new** devotional or Past Teaching source text. It creates review drafts through the existing V7 content-bundle contract. It does not publish, import into a database, generate a sermon article, paraphrase Scripture or grant source permission. An editor must adapt/review the draft before the existing publication process.

## Prepare inputs

Place UTF-8 `.txt` or `.md` sources and a manifest in a private folder such as `work/intake/source/`. That directory is ignored by Git and excluded from the deployed app. Do not place unreviewed source text in `data`, `assets`, `kids-games`, `public` or build output.

The following is a manifest **shape example**, not approved content. Replace the identities/title/locale/rights with actual source records. Unknown rights stay unknown; recording a claim does not verify it.

```json
{
  "schemaVersion": 1,
  "taxonomy": [],
  "items": [
    {
      "id": "teaching.sunday-message",
      "type": "past_teaching",
      "title": "Sunday message",
      "sourceLocale": "en",
      "source": {
        "kind": "first_party",
        "title": "Original Sunday message",
        "catalogId": "church.original.sunday-message",
        "creator": "Recorded author"
      },
      "rights": { "status": "unknown", "allowedUses": [] },
      "taxonomyLinks": [],
      "textPath": "teaching.txt"
    }
  ]
}
```

Use `type: "devotional"` for a devotional source. Books are excluded from this text tool; the existing external-link Books catalog remains separate. Optional `sourceSha256` pins the exact source-file bytes. A supplied `source.checksum` must match those same bytes. Existing source fields (HTTPS URI/catalog identity, author, date, revision, rights/attribution) are preserved by the shared contract. Verified rights need a canonical text use such as `display`, `host`, `hosted_reading`, `modify`, `adapt` or `distribute`; link-only rights do not permit a text draft.

## Run

```sh
npm run intake:v8 -- work/intake/source/manifest.json work/intake/source work/intake/prepared-01
```

The output directory must be new and outside served trees, including symlink-resolved parents. The whole batch is validated before output creation. An existing output directory is never overwritten.

Limits: 1–100 items; manifest up to 1 MiB; each source up to 100,000 bytes; total source text up to 5 MiB. Empty, invalid UTF-8, binary/unsupported files, outside-root paths/symlinks, unknown manifest fields, approval/publication injection, stale hashes, invalid controlled taxonomy and duplicate IDs/prose are rejected. CLI duplicate checks use the current repository-generated published catalog, including the existing devotional corpus; they are not a live database audit.

## Outputs and review

- `draft-bundle.json`: schema version 1, `publicationState: draft`, `review.status: draft`, no translations or publication approval. Mechanical preprocessing only: UTF-8 decode, leading BOM removal, LF line endings, outer-whitespace trim. Source wording, timestamps, speaker labels and embedded markup remain literal text for editorial review; no inference, summary or transcription is performed.
- `intake-report.json`: exact source/normalized-body/packet hashes, deterministic revision digest, manifest hash, relative source names, counts and review requirements. Metadata/source changes create a new revision digest. CLI logs counts/output identity, not transcript prose.

Review source permission, article adaptation/context, Scripture references and language before using the existing import/review/publication owners. Do not flip a draft to published or add it to the runtime catalog as a shortcut. The command retains supplied rights records without promoting unknown rights or assigning a reviewer. It deliberately does not create a new approval system or automatically send content to anyone.
