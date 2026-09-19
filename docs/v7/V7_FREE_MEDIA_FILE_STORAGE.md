# BibleQuest V7 Free Media and File Storage

Status: planned V7 contract
Policy: strict zero-cost default
Scope: congregation/member photos, galleries, shared attachments and safe downloadable files

## Decision

BibleQuest V7 must not use Supabase Storage as the primary blob store for user/congregation photos and shared files.

Supabase remains authoritative for:
- asset metadata;
- owner user ID;
- congregation / Journey Group / Team / Couple / Family scope;
- visibility and authorization;
- captions, tags and relationships to events/posts/assignments;
- moderation/deletion state;
- provider-neutral object identifier;
- content hash, MIME type, byte size and image dimensions;
- audit timestamps.

The actual binary bytes are stored with a provider adapter.

## Strict zero-cost rule

The default provider must be usable indefinitely on a $0 plan and must not require BibleQuest to accept automatic paid overages for normal operation.

If the free quota is exhausted:
1. BibleQuest disables new uploads for the affected provider/scope.
2. Existing content is handled according to the provider's free-plan behavior.
3. Admin receives a clear quota state and remediation guidance.
4. BibleQuest never silently upgrades, attaches a paid tier or shifts to a billable provider.
5. No feature may assume unlimited media capacity.

Provider pricing/limits are external contracts and must be reverified before V7 activation and release certification.

## Provider order

### 1. ImageKit Free — preferred default

Current planning assumptions, to be reverified at V7 activation:
- $0 forever-free tier;
- 3 GB integrated DAM storage;
- 20 GB monthly delivery bandwidth;
- free-plan delivery stops when bandwidth is exhausted;
- new uploads stop when storage is exhausted;
- up to 25 MB for image/audio/raw uploads and 100 MB for video uploads;
- private files;
- signed URLs with optional expiry;
- direct browser upload is supported through short-lived server-generated authentication.

Why preferred:
- predictable hard free limits instead of automatic paid overage;
- supports both photos and general raw files;
- private-file delivery can be mapped to BibleQuest authorization;
- image transformation/CDN features reduce app-side image work.

### 2. Cloudinary Free — supported secondary adapter

Current planning assumptions, to be reverified:
- free plan without requiring a credit card;
- 25 monthly credits shared among storage, transformations and bandwidth;
- image/video/raw-file support;
- signed/private/authenticated delivery capabilities;
- smaller free raw-file limits than ImageKit.

Use as a portability/fallback adapter, not an automatic live overflow target.

### Explicitly not default under strict-zero-cost policy

Cloudflare R2 and Backblaze B2 have useful free allowances but become pay-as-you-go beyond included limits. They must not be required by V7 while the project policy remains "free only." They may be added later only through an explicit product-owner decision changing that policy.

## Provider abstraction

Feature code must depend on a BibleQuest interface, never directly on ImageKit/Cloudinary SDK types.

Conceptual contract:

- createUploadAuthorization(user, scope, fileMetadata)
- finalizeUpload(providerObject, checksum, metadata)
- getAuthorizedDelivery(assetId, viewer)
- getPublicDelivery(assetId)
- deleteAsset(assetId, actor)
- getProviderQuotaState()
- verifyProviderObject(assetId)
- reconcileOrphanedObjects()

All provider secrets and signing keys remain server-side.

## Security and privacy

### Private by default for community uploads

Congregation, group/team, couple/family and personal uploads are private provider objects by default.

Access flow:
1. User asks BibleQuest for an asset.
2. BibleQuest authorizes access using current session, tenant and asset metadata.
3. Server generates a short-lived provider-signed URL.
4. Browser loads/downloads the asset directly from the media provider.

A guessed provider path must not bypass BibleQuest authorization.

Explicitly public assets may use public delivery URLs only when the owner/role is permitted to publish them.

### Upload authorization

- Client never receives provider private/API-secret credentials.
- Client requests a short-lived upload signature/token from a BibleQuest server owner.
- Server verifies user, active congregation, allowed scope and quota before authorizing upload.
- Finalization verifies the returned provider identity and file metadata before creating the authoritative BibleQuest asset row.

### File safety

V7 initial allowlist:
- JPEG/JPG
- PNG
- WebP
- HEIC/HEIF only when the chosen provider/client conversion path is proven
- PDF
- plain text
- selected Office document formats only after download behavior is verified

Default reject:
- HTML
- JavaScript
- executable/binary application installers
- archives unless a later explicit use case is approved
- SVG from ordinary users unless a sanitizer is proven and enforced

Generic files should download with safe attachment semantics rather than execute inline.

File extension, reported MIME and detected file signature must agree where practical.

## Photo handling

To preserve the free quota:
- client-side downscale ordinary photo uploads before transfer;
- strip location-bearing EXIF metadata by default;
- target a practical display master rather than retaining full phone-camera originals;
- use provider transformations for thumbnails/responsive display instead of uploading multiple separate copies;
- lazy-load gallery media;
- use responsive sizes and modern formats where supported;
- do not cache private signed URLs beyond their security lifetime.

Recommended starting photo policy:
- longest edge around 2048–2560 px for normal community photos;
- bounded upload byte size after compression;
- preserve orientation;
- remove GPS/EXIF privacy data;
- retain an original only for an explicitly approved use case.

## Data model

Provider-neutral asset metadata should include at minimum:

- id
- owner_user_id
- congregation_id nullable only for legitimate global/public assets
- scope_type
- scope_id
- visibility
- provider
- provider_asset_id
- provider_path
- resource_type
- original_filename
- safe_display_name
- mime_type
- byte_size
- checksum
- width / height when applicable
- caption
- moderation_state
- created_at
- deleted_at
- provider_deleted_at
- version/revision metadata when supported

Do not store permanent signed delivery URLs in the database.

## Supported V7 product uses

### Community / Congregation
- event photo albums;
- congregation galleries;
- Journey Group/Team shared photos;
- Couple/Family attachments;
- optional captions;
- safe share links/deep links;
- upload progress and retry states.

### Ministry / Leader
- event/ministry photos;
- assignment reference attachments where appropriate;
- leader-uploaded handouts/PDFs;
- controlled congregation resources.

### Media
- unified authorized Photos/Files library;
- filters by event/scope/date;
- responsive gallery;
- file cards with type/size/uploader/scope;
- download and share actions.

### Admin
- quota state;
- stored-byte estimate;
- upload disable/enable control;
- orphan reconciliation;
- moderation/deletion;
- provider-health state;
- provider configuration without exposing secrets to normal users.

## Quota behavior

BibleQuest must implement a local soft cap lower than the provider hard cap.

Initial policy:
- warn Admin at 70%;
- warn prominently at 85%;
- stop ordinary uploads around 90–95% of known storage capacity;
- keep a small safety margin for reconciliation/administrative operations;
- never delete user content automatically merely to recover quota.

Bandwidth exhaustion is treated as a recoverable provider state, not as an excuse to switch automatically to billing.

## Failure behavior

The app must distinguish:
- upload rejected by BibleQuest authorization;
- file too large/type rejected;
- quota nearly full;
- quota exhausted;
- provider unavailable;
- upload interrupted;
- finalization failed;
- metadata exists but provider object is missing;
- provider object exists but metadata finalization failed;
- signed URL expired;
- viewer unauthorized;
- asset deleted/moderated.

Retry must be idempotent.

A reconciliation job/tool may identify and safely remove confirmed orphaned provider objects after a bounded grace period.

## V7 rollout order

1. Provider-neutral model and server signing boundary.
2. ImageKit adapter and strict quota gate.
3. Single-photo upload/display/delete.
4. Private congregation gallery.
5. Group/team/couple/family scope.
6. General safe file attachments/downloads.
7. Leader/admin resources.
8. Photos/Files hub and deep-link sharing.
9. Cloudinary adapter portability test.
10. Whole-app privacy/quota/provider-failure certification.

## Required acceptance evidence

V7 is not complete until tests prove:
- member can upload an allowed photo;
- image is displayed responsively;
- private congregation asset cannot be fetched by an unrelated account;
- group/team/couple scoped access is enforced;
- signed URLs expire;
- client contains no provider secret;
- metadata/blob deletion remains consistent;
- quota exhaustion fails closed with no paid upgrade;
- provider outage leaves the rest of BibleQuest usable;
- orphan reconciliation is safe;
- unauthorized asset IDs/path guessing do not grant access;
- photo EXIF/GPS stripping works where claimed;
- accepted files download safely;
- mobile upload/gallery flows work at representative widths;
- provider can be replaced through the adapter without rewriting consuming features.
