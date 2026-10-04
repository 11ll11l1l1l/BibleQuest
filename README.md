# BibleQuest

BibleQuest V6 is live at https://mybiblequest.pages.dev. Production `main` is pinned to certified SHA `7997d60e6069aa406ec005c32e33e46fee39bc12`.

V7 preparation starts on `v7/development`. Read [V7 starting point](docs/V7_STARTING_POINT.md) and [documentation index](DOCUMENTATION_INDEX.md) before changing code.

## Development

Use Node.js 22.23.2 (`.nvmrc`) and the committed lockfile.

```sh
npm ci
npm run dev
npm run typecheck
npm run unit
npm run build:v6
```

The existing Cloudflare production build command is `npm run build:v6`, with output `dist-v6`. Keep this deployment contract until an intentional, tested V7 release change.

## Release records

- [V6 production status](V6_ACTIVE_STATUS.md)
- [V6 acceptance checklist](V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md)
- [Release backups](BACKUP_MANIFEST.md)
- [Historical documentation](docs/archive/README.md)

Versioned runtime, migrations, regression tests and workflows remain active where inherited by V6. A historical name alone does not make code disposable.
