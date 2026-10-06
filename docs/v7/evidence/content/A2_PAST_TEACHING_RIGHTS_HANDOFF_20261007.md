# A2 Past Teaching rights handoff — 2026-10-07

Scope: V7 A2 Curation & Enrichment evidence for `teaching.prayer-abiding`.

Status: **historical work identity and first-edition bibliography corroborated; exact reusable source artifact and authorized rights/editorial clearance remain unresolved**.

This handoff is evidence for an authorized reviewer. It does not approve content, change publication state, grant a license, make a jurisdiction-specific public-domain determination, or replace rights/editorial review.

## Canonical item

- Item ID: `teaching.prayer-abiding`
- Type: `past_teaching`
- Source title: *The Secret of Power in Prayer*
- Creator: Charles H. Spurgeon
- Sermon number: 2002
- Delivered: 1888-01-08
- Scripture: John 15:7
- Series: *The Metropolitan Tabernacle Pulpit*, Volume 34
- Current canonical rights status: `unknown`
- Current review status: `pending_review`
- Current publication state: `pending_review`

Canonical record: `data/v7/past-teachings/prayer-source-example.json`.

## What A2 can now distinguish

A2 has enough corroboration to separate two questions that must not be collapsed:

1. **Historical-work identity.** The underlying sermon is consistently identified as sermon No. 2002, delivered January 8, 1888, on John 15:7, in *The Metropolitan Tabernacle Pulpit*, Volume 34.
2. **Reusable source artifact.** BibleQuest still needs to record the exact edition, scan, transcription, or other source artifact relied on for the adaptation and the rights basis that permits the intended use of that artifact.

The first question is now strongly corroborated. The second remains open.

## Bibliographic corroboration added on 2026-10-07

### Published-volume bibliography

An academic article discussing Spurgeon's prayer ministry cites the sermon as:

> C. H. Spurgeon, “The Secret of Power in Prayer,” *Metropolitan Tabernacle Pulpit*, sermon no. 2002, vol. 34, John 15:7, delivered 8 January 1888.

Research URL:

- https://biblicalstudies.org.uk/pdf/eq/2012-4_323.pdf

A separate bibliography lists *The Metropolitan Tabernacle Pulpit Sermons*, Volume 34, as London: Passmore & Alabaster, 1888.

Research URL:

- https://theologic.us/pastorals/bibliography

The Online Books Page at the University of Pennsylvania also catalogs Spurgeon's nineteenth-century *Metropolitan Tabernacle Pulpit* and points to page-image holdings, providing an independent library-oriented route for locating historical copies.

Research URL:

- https://onlinebooks.library.upenn.edu/webbin/who/Spurgeon%2C%20C.%20H.%20%28Charles%20Haddon%29%2C%201834-1892

### Modern-hosted corroboration

Spurgeon Gems exposes a Volume 34 PDF and individual sermon material that corroborate the volume and sermon sequence, but its stated reuse policy must not be treated as adaptation permission because the researched policy limits the ordinary permission route to unchanged material.

Research URLs:

- https://www.spurgeongems.org/chsbm34.pdf
- https://www.spurgeongems.org/about-us/

This evidence is suitable for identity/bibliographic corroboration. It does not convert the current modern-hosted transcription into an adaptation-cleared source.

## Required acquisition rule for this item

Before `rights.status` can be upgraded, the authorized reviewer should record an exact source artifact and basis. The preferred evidence route is:

1. locate a stable scan or facsimile of the 1888 Passmore & Alabaster Volume 34, or another source whose reuse basis for the intended adaptation is explicit and acceptable;
2. record the exact source URL/catalog identity, edition, and relevant pages/sermon location;
3. record the rights basis relied on for BibleQuest's intended adaptation rather than inferring it from the age of the underlying work or from a different modern transcription;
4. verify the BibleQuest adaptation against that recorded source artifact;
5. complete the authorized editorial checks and decision ledger entry.

If the reviewer instead relies on a modern transcription, the terms applying to that transcription must explicitly cover the intended use or separate permission must be documented.

## Fail-closed state

Until the exact reusable source artifact and authorized decision are recorded:

- keep `rights.status = unknown`;
- keep `review.status = pending_review`;
- keep `publicationState = pending_review`;
- keep `rights_clearance_pending` and `editorial_review_pending` as open blockers;
- do not create a reviewer identity, timestamp, approval, or rights upgrade on behalf of the reviewer.

## A2 engineering conclusion

No additional code-side relaxation is required or appropriate. The existing A2 release-evidence contract already fails closed when representative rights/review evidence is incomplete. This handoff narrows the remaining human decision to an exact-source-artifact rights check plus editorial review, while preserving the existing publication block.
