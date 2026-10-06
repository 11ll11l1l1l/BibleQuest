import { normalizeLibraryItem } from './contracts.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export const devotionalMessages = Object.freeze({
  en: Object.freeze({
    'v7.devotional.reading': 'Devotional reading',
    'v7.devotional.unavailable': 'This devotional reading is unavailable.',
    'v7.devotional.sourceFallback': 'Showing the source language: {language}. A reviewed translation is not available.',
    'v7.devotional.source': 'Read the original source',
    'v7.devotional.topics': 'Topics',
  }),
  tl: Object.freeze({
    'v7.devotional.reading': 'Debosyonal',
    'v7.devotional.unavailable': 'Hindi available ang debosyonal na ito.',
    'v7.devotional.sourceFallback': 'Ipinapakita ang orihinal na wika: {language}. Walang available na nasuring salin.',
    'v7.devotional.source': 'Basahin ang orihinal na pinagmulan',
    'v7.devotional.topics': 'Mga paksa',
  }),
  ceb: Object.freeze({
    'v7.devotional.reading': 'Debosyonal',
    'v7.devotional.unavailable': 'Dili magamit kini nga debosyonal.',
    'v7.devotional.sourceFallback': 'Gipakita ang orihinal nga pinulongan: {language}. Walay magamit nga gisusi nga hubad.',
    'v7.devotional.source': 'Basaha ang orihinal nga tinubdan',
    'v7.devotional.topics': 'Mga hilisgutan',
  }),
  ilo: Object.freeze({
    'v7.devotional.reading': 'Debosional a basa',
    'v7.devotional.unavailable': 'Saan a magun-od daytoy a debosional a basa.',
    'v7.devotional.sourceFallback': 'Maipakita ti nagtaudan a pagsasao: {language}. Awan ti nasukimat a patarus.',
    'v7.devotional.source': 'Basaen ti orihinal a pagtaudan',
    'v7.devotional.topics': 'Dagiti topiko',
  }),
});

function canonicalLocale(value) {
  try { return Intl.getCanonicalLocales(String(value ?? '').replace(/_/g, '-'))[0] || 'en'; }
  catch { return 'en'; }
}

function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function readingHtml(body) {
  if (typeof body === 'string' && body.trim()) {
    return body.trim().split(/\n\s*\n/).map(text => '<p>' + escapeHtml(text).replace(/\n/g, '<br>') + '</p>').join('');
  }
  if (!Array.isArray(body?.blocks) || !body.blocks.length || body.blocks.length > 200) return null;
  if (body.blocks.some(block => !['paragraph', 'heading'].includes(block?.type)
      || typeof block.text !== 'string' || !block.text.trim())) return null;
  return body.blocks.map(block => {
    const tag = block.type === 'heading' ? 'h3' : 'p';
    return '<' + tag + '>' + escapeHtml(block.text) + '</' + tag + '>';
  }).join('');
}

// Consumes published Library detail records. This does not publish/import content.
export function renderDevotional(item, { locale = 'en', translate } = {}) {
  if (typeof translate !== 'function') throw new TypeError('Devotional requires the existing localization translator.');
  const requestedLocale = canonicalLocale(locale);
  const t = (key, values = {}) => escapeHtml(translate(key, {
    locale, dictionaries: devotionalMessages, values,
  }));
  let record;
  try { record = normalizeLibraryItem(item); } catch { return '<p role="status">' + t('v7.devotional.unavailable') + '</p>'; }
  if (record.contentType !== 'devotional' || !record.rights.allowedUses.includes('display')) {
    return '<p role="status">' + t('v7.devotional.unavailable') + '</p>';
  }
  const sourceLocale = canonicalLocale(record.sourceLocale);
  const translation = record.translations.find(row => canonicalLocale(row.locale) === requestedLocale);
  // A title-only translation must not relabel source-language body as translated.
  const translatedHtml = translation ? readingHtml(translation.content.body) : null;
  const content = translatedHtml ? translation.content : record.sourceContent;
  const language = translatedHtml ? requestedLocale : sourceLocale;
  const bodyHtml = translatedHtml || readingHtml(content.body);
  if (!bodyHtml) return '<p role="status">' + t('v7.devotional.unavailable') + '</p>';
  const fallback = language !== requestedLocale
    ? '<p role="status">' + t('v7.devotional.sourceFallback', { language }) + '</p>' : '';
  const topics = record.taxonomyLinks.filter(row => row.kind === 'topic').map(row =>
    row.labels?.[language] || (translatedHtml ? row.labels?.[locale] : null) || row.labels?.[language.split('-')[0]] || row.labels?.[sourceLocale] || row.labels?.en || row.id);
  const sourceUrl = safeSourceUrl(record.source.uri);
  return '<article data-devotional-reading lang="' + escapeHtml(language) + '" aria-label="' + t('v7.devotional.reading') + '">'
    + fallback + '<h2>' + escapeHtml(content.title) + '</h2>'
    + (topics.length ? '<p>' + t('v7.devotional.topics') + ': ' + topics.map(escapeHtml).join(' · ') + '</p>' : '')
    + bodyHtml
    + (sourceUrl ? '<p><a href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + t('v7.devotional.source') + '</a></p>' : '')
    + '</article>';
}
