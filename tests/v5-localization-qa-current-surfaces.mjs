import assert from 'node:assert/strict';
import fs from 'node:fs';

const { en, LOCALE_KEY_INVENTORY } = await import('../src/content/locales/en.js');
const { tl } = await import('../src/content/locales/tl.js');
const { t, getMissingLocaleKeys } = await import('../src/app/localization.js');

const shellKeys = [
  'app.name',
  'locale.label',
  'locale.english',
  'locale.tagalog',
  'nav.home',
  'nav.learn',
  'nav.play',
  'nav.grow',
  'nav.more',
  ...LOCALE_KEY_INVENTORY.filter(key => key.startsWith('shell.'))
];
const transformKeys = [
  'nav.transformation',
  ...LOCALE_KEY_INVENTORY.filter(key => key.startsWith('transform.'))
];
const homeKeys = LOCALE_KEY_INVENTORY.filter(key => key.startsWith('home.'));
const migratedKeys = [...new Set([...shellKeys, ...transformKeys, ...homeKeys])].sort();
const reviewedSharedTerms = new Set([
  'app.name',
  'locale.tagalog',
  'nav.home',
  'nav.transformation',
  'shell.account',
  'transform.mode.basic',
  'transform.mode.full',
  'transform.basic.eyebrow',
  'home.progress.xp'
]);
const intentionalSourceCompatibilityLiterals = new Set([
  'home.shortcut.daily',
  'home.shortcut.reader',
  'home.shortcut.assignments',
  'home.shortcut.calendar',
  'home.shortcut.progress'
]);

const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(match => match[1]).sort();
const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

assert.deepEqual(Object.keys(tl).sort(), LOCALE_KEY_INVENTORY, 'Tagalog dictionary must retain exact canonical key coverage.');
assert.deepEqual(getMissingLocaleKeys('tl'), [], 'Tagalog dictionary must not have empty/missing canonical values.');

for (const key of migratedKeys) {
  assert.equal(typeof tl[key], 'string', `Missing Tagalog string for migrated key ${key}`);
  assert.ok(tl[key].trim().length > 0, `Empty Tagalog string for migrated key ${key}`);
  assert.deepEqual(placeholders(tl[key]), placeholders(en[key]), `Placeholder mismatch for ${key}`);
  if (!reviewedSharedTerms.has(key)) {
    assert.notEqual(tl[key], en[key], `Migrated Tagalog key unexpectedly equals English: ${key}`);
  }
}

const fallbackDictionaries = { en, tl: { ...tl, 'home.today.open': '' } };
assert.equal(t('home.today.open', { locale: 'tl', dictionaries: fallbackDictionaries }), en['home.today.open'], 'Empty Tagalog Home values must deterministically fall back to English.');

const sourceContracts = [
  { path: 'src/ui/shell.js', keys: shellKeys },
  { path: 'src/features/transform/index.js', keys: transformKeys },
  { path: 'src/features/home/index.js', keys: homeKeys }
];

for (const contract of sourceContracts) {
  const source = fs.readFileSync(new URL(`../${contract.path}`, import.meta.url), 'utf8');
  assert.match(source, /localization\.(?:t|getLocale)/, `${contract.path} must continue using the integrated localization owner.`);

  for (const key of contract.keys) {
    assert.match(source, new RegExp(`['\"]${escapeRegExp(key)}['\"]`), `${contract.path} no longer references migrated key ${key}`);

    if (reviewedSharedTerms.has(key) || intentionalSourceCompatibilityLiterals.has(key)) continue;
    const english = en[key];
    if (english.length < 4) continue;
    const quotedEnglish = [`'${english}'`, `"${english}"`, `\`${english}\``];
    assert.ok(!quotedEnglish.some(literal => source.includes(literal)), `${contract.path} hard-codes migrated English UI instead of using ${key}: ${english}`);
  }
}

const homeSource = fs.readFileSync(new URL('../src/features/home/index.js', import.meta.url), 'utf8');
for (const key of intentionalSourceCompatibilityLiterals) {
  assert.match(homeSource, new RegExp(`label:\\s*['\"]${escapeRegExp(en[key])}['\"]\\s*,\\s*labelKey:\\s*['\"]${escapeRegExp(key)}['\"]`), `Home compatibility label for ${key} must remain paired with its localized labelKey and must not become the rendered source of truth.`);
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

console.log(`PASS V5 localization QA: ${migratedKeys.length} currently migrated Tagalog keys across shell, Transformation, and Home/Today are complete, placeholders are stable, fallback is deterministic, and canonical English UI literals do not leak through their rendered owners.`);
console.log(`INFO V5 localization QA: ${intentionalSourceCompatibilityLiterals.size} Home shortcut English literals remain explicitly classified as non-rendered compatibility metadata paired with localized labelKey owners.`);
console.log(`INFO V5 localization QA: ${knownNotYetMigratedRecoveryStrings.length} shell recovery strings remain explicitly classified as not-yet-migrated debt; this gate does not claim full Tagalog coverage.`);
