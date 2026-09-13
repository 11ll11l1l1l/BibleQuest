import assert from 'node:assert/strict';
import fs from 'node:fs';

const { en, LOCALE_KEY_INVENTORY } = await import('../src/content/locales/en.js');
const { tl } = await import('../src/content/locales/tl.js');
const { t, getMissingLocaleKeys } = await import('../src/app/localization.js');

const migratedPrefixes = ['nav.', 'shell.', 'transform.'];
const migratedKeys = LOCALE_KEY_INVENTORY.filter(key => migratedPrefixes.some(prefix => key.startsWith(prefix)));
const sharedUntranslatedTerms = new Set([
  'nav.home',
  'nav.media',
  'nav.transformation',
  'transform.mode.basic',
  'transform.mode.full',
  'transform.basic.eyebrow'
]);

const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(match => match[1]).sort();

assert.deepEqual(Object.keys(tl).sort(), LOCALE_KEY_INVENTORY, 'Tagalog dictionary must retain exact canonical key coverage.');
assert.deepEqual(getMissingLocaleKeys('tl'), [], 'Tagalog dictionary must not have empty/missing canonical values.');

for (const key of migratedKeys) {
  assert.equal(typeof tl[key], 'string', `Missing Tagalog string for migrated key ${key}`);
  assert.ok(tl[key].trim().length > 0, `Empty Tagalog string for migrated key ${key}`);
  assert.deepEqual(placeholders(tl[key]), placeholders(en[key]), `Placeholder mismatch for ${key}`);
  if (!sharedUntranslatedTerms.has(key)) {
    assert.notEqual(tl[key], en[key], `Migrated Tagalog key unexpectedly equals English: ${key}`);
  }
}

const fallbackDictionaries = { en, tl: { ...tl, 'nav.calendar': '' } };
assert.equal(t('nav.calendar', { locale: 'tl', dictionaries: fallbackDictionaries }), en['nav.calendar'], 'Empty Tagalog values must deterministically fall back to English.');

const sourceContracts = [
  {
    path: 'src/ui/shell.js',
    keys: migratedKeys.filter(key => key.startsWith('nav.') || key.startsWith('shell.'))
  },
  {
    path: 'src/features/transform/index.js',
    keys: migratedKeys.filter(key => key.startsWith('transform.'))
  }
];

for (const contract of sourceContracts) {
  const source = fs.readFileSync(new URL(`../${contract.path}`, import.meta.url), 'utf8');
  assert.match(source, /localization\.(?:t|getLocale)|localization\.getLocale/, `${contract.path} must continue using the integrated localization owner.`);

  for (const key of contract.keys) {
    assert.match(source, new RegExp(`['\"]${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['\"]`), `${contract.path} no longer references migrated key ${key}`);

    if (sharedUntranslatedTerms.has(key)) continue;
    const english = en[key];
    if (english.length < 4) continue;
    const quotedEnglish = [`'${english}'`, `"${english}"`, `\`${english}\``];
    assert.ok(!quotedEnglish.some(literal => source.includes(literal)), `${contract.path} hard-codes migrated English UI instead of using ${key}: ${english}`);
  }
}

const shellSource = fs.readFileSync(new URL('../src/ui/shell.js', import.meta.url), 'utf8');
const knownNotYetMigratedRecoveryStrings = [
  'RECOVERY',
  'Feature could not open',
  'The BibleQuest shell is still available.',
  'Checking whether this is an app or connection problem…',
  'Try again',
  'Go Home',
  'Recovery · BibleQuest',
  'BibleQuest host check passed.',
  'BibleQuest host check failed.',
  'Connection was not tested.'
];
for (const text of knownNotYetMigratedRecoveryStrings) {
  assert.ok(shellSource.includes(text), `Known not-yet-migrated recovery string changed; update localization QA classification deliberately: ${text}`);
}

console.log(`PASS V5 localization QA: ${migratedKeys.length} migrated Tagalog keys complete, placeholders stable, fallback deterministic, and no canonical English UI literals leaked into migrated shell/Transformation contracts.`);
console.log(`INFO V5 localization QA: ${knownNotYetMigratedRecoveryStrings.length} shell recovery strings remain explicitly classified as not-yet-migrated debt; this gate does not claim full Tagalog coverage.`);
