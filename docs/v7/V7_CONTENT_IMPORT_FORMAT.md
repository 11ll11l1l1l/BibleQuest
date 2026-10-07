# V7 Library content import format

Version 1 of the import contract is implemented by `src/v7/content/contract.js`. The parser validates a bundle before any future importer writes it. It does not write to the database, publish content, authorize a user, or establish rights by itself.

Version 1 rejects unsupported fields at the bundle, taxonomy, item, source, source-content, review, taxonomy-link, translation, and translated-content boundaries. An `unknown_field` error identifies the exact path; the parser leaves the input untouched. Extend the versioned format explicitly before importing new fields rather than silently dropping them. Rights and withdrawal records retain their additional evidence fields.

## Bundle shape

A bundle has `schemaVersion: 1`, a controlled `taxonomy` array, and an `items` array. Item types are `book`, `devotional`, and `past_teaching`. Each item has a stable ID, immutable content revision ID, source locale, publication state, source reference, source-language content, rights metadata, ordered taxonomy links, and translations.

Locale label keys are canonicalized; aliases that resolve to the same locale (such as `en-US` and `EN-us`) fail validation rather than overwrite a label.

Taxonomy entries have stable lowercase IDs, one kind (`category`, `topic`, or `tag`), and one or more localized labels. Item links refer to those IDs and carry an explicit non-negative order. Unknown IDs, duplicate links, duplicate per-kind order, or a link whose kind disagrees with its taxonomy entry fail validation. The import file declares terms; it does not silently invent or infer them from free-form tag strings.

Source metadata is separate from content text. Record a source title and an HTTPS URI or canonical catalog ID for non-fixture material. Creator/author, originating organization, source revision/date, and checksum are represented when known or applicable. Rights are explicit: `verified` requires a rights holder, documented license/permission basis, an attribution field, and allowed-use descriptions; `unknown` content cannot be published. A fixture source can never be published. For `verified` rights, `allowedUses` must contain at least one permitted use; an empty list is valid only while rights are `unknown` and the item remains unpublished. The importer enforces this at the import boundary. Database publication checks and Library read normalization must enforce the same predicate; importer validation alone does not establish persisted-data or runtime enforcement.

Publication review records carry a review state and, after approval, reviewer and decision time. Published content requires both approved review and verified rights. Revisions are immutable: `revisionHistory` points to earlier revision IDs, while the current revision remains separate. Withdrawn items carry a reason and decision time; `derivatives` identifies related content that may need review after withdrawal.

Translations record their locale, translated-from content revision, translator/editor, and review state. Translation revisions must target either the current revision or an ID declared in `revisionHistory`. Historical translations remain retained records, including earlier drafts; they are never selected as the current language content. One translation per canonical locale and source revision is permitted, so the current and historical translations can share a locale without overwriting one another. Published items still require any current-revision translation to be reviewed. Revision history IDs are trimmed and reject duplicate IDs or references to the current revision. A reviewed translation also identifies the reviewer and review time. A translation is selectable only after review and while it targets the item's current revision. When one is unavailable, the resolver returns source-language content and its locale; it does not machine-translate or silently label source text as the requested language.

V7 UI strings live in the `v7.content.*` namespace in `src/content/locales/v7-content.js` and are merged into the existing English localization dictionary. Other locales may fall back to English until a reviewed translation is supplied. `V7_CONTENT_KEY_INVENTORY` participates in missing-key checks so localization readiness stays visible without claiming a full Ilocano rollout.

`data/v7/content-fixtures/representative-library.json` contains one synthetic item for each Library type. Its unknown rights and draft state are intentional. It is a parser fixture, not approved or source-valid publication content and not evidence that product content acceptance has passed.

The format describes import data only. P1-A owns schema/RLS and database writes; P1-B owns Library integration and UI; P1-D owns taxonomy, provenance, locale readiness, and fixture format.
