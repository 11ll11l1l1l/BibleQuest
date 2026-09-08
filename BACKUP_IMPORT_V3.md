# BibleQuest v3 Backup / Export / Import / Reset Contract

## Scope

#100 restores the old device-local reset behavior and adds the inventory-required export → import → state-restored workflow for BibleQuest v3 portable local state.

## Ownership

1. `src/core/storage.js` remains the only direct browser `localStorage` owner. It enumerates, validates, transactionally replaces, and resets portable BibleQuest v3 entries.
2. `src/app/backup.js` is the single backup workflow owner. It defines the backup file format/version and coordinates export/import/reset through `src/core/storage.js`.
3. `src/features/backup/index.js` owns only the file/download/confirmation UI. It never reads or writes browser storage directly.
4. Router/bootstrap owns navigation and the post-import/post-reset reload needed to rehydrate all existing state owners from the newly persisted snapshot.

## Portable boundary

- Only entries under the current `biblequest.v3.` local-state namespace are eligible.
- `biblequest.v3.auth.*` is excluded from export/import/reset. Account/session credentials are not backup data.
- `biblequest.v3.device-id` is excluded and preserved. Restoring a backup must not clone another device identity.
- Supabase/cloud state, congregation server data, Cloud Notes, media, Cache Storage, service-worker caches, opened Bible packs and unrelated browser/site storage are outside #100.

## Backup format

- JSON format identifier: `biblequest-v3-local-backup`.
- Format version: `1`.
- Payload contains `exportedAt` and an array of `{name,value}` portable entries.
- Import rejects malformed JSON, wrong format, unsupported version, duplicate names, auth/device keys, invalid names, or non-JSON values before replacing state.

## Transaction behavior

- Import validates the complete incoming entry set before destructive writes.
- Replacement snapshots the current portable state first.
- If a storage write fails, BibleQuest attempts to restore the previous portable snapshot and reports a controlled error.
- Reset is the same transactional replacement with an empty portable snapshot, preserving auth/device identity.
- A successful import/reset reloads BibleQuest so Progress, Reader, Lesson, Games, Notes and other existing owners rehydrate normally rather than receiving direct backup-specific mutations.

## Acceptance

- Edge regression proves export excludes auth/device identity while preserving portable values.
- Edge regression proves reset removes portable state but preserves auth/device/unrelated storage.
- Edge regression proves export → reset → import restores the exact portable state.
- Edge regression proves malformed/wrong-version/forbidden/duplicate backups fail before mutation.
- Edge regression proves a failed replacement rolls back the previous portable snapshot.
- Real 390px Chromium regression creates Reader/Progress state through the normal UI, downloads the backup JSON, resets through the Backup page, verifies state is reset after reload, imports the downloaded backup, and verifies the original Reader/Progress state returns after reload.
- The complete accumulated v3 regression suite must pass before #100 can be promoted.
