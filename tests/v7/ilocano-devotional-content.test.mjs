import assert from 'node:assert/strict';
import test from 'node:test';
import { devotionalMessages, renderDevotional } from '../../src/features/library/devotional.js';

const translate = (key, { locale, dictionaries, values = {} }) => {
  const dictionary = dictionaries[locale] || dictionaries.en;
  return String(dictionary[key] || dictionaries.en[key]).replace(/\{(\w+)\}/g, (_, name) => values[name]);
};

test('Ilocano devotional presentation is available without declaring whole-app Ilocano localization complete', () => {
  const item = {
    id: 'reading-ilo',
    contentType: 'devotional',
    publishedRevisionId: 'r1',
    publicationState: 'published',
    title: 'Hope',
    locale: 'ilo',
    sourceLocale: 'en',
    source: { kind: 'external', title: 'Source', uri: 'https://example.org/reading' },
    sourceContent: { title: 'Hope', body: 'Source body.' },
    rights: { status: 'verified', holder: 'Author', basis: 'Permission', attribution: 'Author', allowedUses: ['display'] },
    review: { status: 'approved', reviewer: 'editor', decidedAt: '2026-10-06T10:19:00Z' },
    taxonomyLinks: [{ id: 'topic.hope', kind: 'topic', labels: { en: 'Hope', ilo: 'Namnama' }, order: 0 }],
    translations: [{
      locale: 'ilo',
      reviewStatus: 'reviewed',
      translatedFromRevision: 'r1',
      translatedBy: 'OpenAI GPT-5.6 Sol — BibleQuest V7',
      reviewedBy: 'BibleQuest AI translation QA — Rulebook v1.0',
      reviewedAt: '2026-10-06T10:19:00Z',
      content: { title: 'Namnama', body: 'Daytoy ti debosional a basa.' }
    }]
  };

  const html = renderDevotional(item, { locale: 'ilo', translate });
  assert.ok(html.includes('lang="ilo"'));
  assert.ok(html.includes('Namnama'));
  assert.ok(html.includes('Daytoy ti debosional a basa.'));
  assert.ok(html.includes('Dagiti topiko'));
  assert.ok(html.includes('Basaen ti orihinal a pagtaudan'));
  assert.ok(!html.includes('Source body.'));
  assert.deepEqual(Object.keys(devotionalMessages.ilo), Object.keys(devotionalMessages.en));
});
