import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SCRIPTURE_PACKAGE_SOURCES = Object.freeze([
  Object.freeze({
    translationId: 'bsb',
    label: 'English · BSB',
    folder: 'bible',
    license: Object.freeze({
      source: 'Berean Standard Bible',
      license: 'Public-domain / CC0 browser source',
      attribution: 'See data/packs/ATTRIBUTION.md',
      redistribution: 'allowed',
    }),
  }),
  Object.freeze({
    translationId: 'tl',
    label: 'Tagalog · ULB',
    folder: 'tagalog',
    license: Object.freeze({
      source: 'Tagalog Unlocked Literal Bible',
      license: 'CC BY-SA 4.0',
      attribution: '© 2018 Door43 World Missions Community',
      redistribution: 'allowed',
    }),
  }),
  Object.freeze({
    translationId: 'cebocb',
    label: 'Cebuano/Bisaya · OCCB',
    folder: 'cebuano',
    license: Object.freeze({
      source: 'Biblica Open Cebuano Contemporary Bible 2024',
      license: 'CC BY-SA 4.0',
      attribution: '© 2009, 2010, 2014, 2024 Biblica, Inc. · See data/packs/ATTRIBUTION.md',
      redistribution: 'allowed',
    }),
  }),
]);

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function buildScripturePackageManifest(root, source) {
  const directory = resolve(root, 'data', 'packs', source.folder);
  if (!existsSync(directory)) throw new Error(`Missing Scripture package directory: ${directory}`);

  const books = readdirSync(directory)
    .filter(name => /^[1-3]?[A-Z]{2,3}\.json$/.test(name))
    .sort()
    .map(name => {
      const bytes = readFileSync(join(directory, name));
      const bookCode = basename(name, '.json').toUpperCase();
      return Object.freeze({
        bookCode,
        url: `data/packs/${source.folder}/${bookCode}.json`,
        sha256: sha256(bytes),
        bytes: bytes.byteLength,
      });
    });

  if (!books.length) throw new Error(`No Scripture packages found for ${source.translationId}`);

  const versionSeed = books.map(book => `${book.bookCode}:${book.sha256}:${book.bytes}`).join('\n');
  return Object.freeze({
    schemaVersion: 1,
    translationId: source.translationId,
    label: source.label,
    contentVersion: `sha256-${sha256(versionSeed).slice(0, 20)}`,
    delivery: 'downloadable',
    license: source.license,
    books: Object.freeze(books),
  });
}

export function generateScripturePackageManifests({
  root = process.cwd(),
  outputDirectory = resolve(root, 'dist-v6', 'data', 'v6-scripture-manifests'),
} = {}) {
  mkdirSync(outputDirectory, { recursive: true });
  const manifests = SCRIPTURE_PACKAGE_SOURCES.map(source => buildScripturePackageManifest(root, source));
  for (const manifest of manifests) {
    writeFileSync(
      join(outputDirectory, `${manifest.translationId}.json`),
      JSON.stringify(manifest, null, 2) + '\n',
      'utf8',
    );
  }
  return Object.freeze(manifests);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifests = generateScripturePackageManifests();
  console.log(
    `Generated ${manifests.length} V6 Scripture package manifests (${manifests.reduce((sum, item) => sum + item.books.length, 0)} book packages).`,
  );
}
