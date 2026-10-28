# BibleQuest

BibleQuest V7.1 is released at https://mybiblequest.pages.dev. [Current status](V7_ACTIVE_STATUS.md) links the sealed release evidence and next work.

Start repository work at [work/README.md](work/README.md). [AGENTS.md](AGENTS.md) provides agent entry instructions; [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) maps maintained contracts and historical records. [V8 scope](DEVELOPMENT_PLAN_V8.md) is the starting point for the next release's contract refresh.

## Development

Use Node.js 22.23.2 (`.nvmrc`) and the committed lockfile.

```sh
npm ci
npm run dev
npm run typecheck
npm run unit
npm run build:v6
```

The Cloudflare production build command remains `npm run build:v6`, with output `dist-v6`. Historical V6 naming is part of the inherited build contract.

## Release and history

- [Release procedure](work/RELEASE.md)
- [Release backups](BACKUP_MANIFEST.md)
- [Documentation archive](docs/archive/README.md)

Preserve inherited runtime, source/rights metadata, migrations, tests and release evidence. New work uses isolated branches from the current released baseline.
