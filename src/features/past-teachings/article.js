import { resolveV7Content } from '../../v7/content/contract.js';
import { localization } from '../../app/localization.js';

export const pastTeachingEn = Object.freeze({
  original: 'Original teaching', adapted: 'Adapted article — consult the original teaching for its full context.',
  unavailable: 'The teaching article is unavailable.', restricted: 'Article display is not permitted by the recorded usage rights.',
});
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
function safeSourceUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
function blocks(body) {
  if (typeof body === 'string') {
    if (body.length > 100_000) return null;
    return body.trim().split(/\n\s*\n/).filter(Boolean).map(text => {
      const heading = /^#{1,3}\s+([^\n]+)$/.exec(text);
      return { type: heading ? 'heading' : 'paragraph', text: heading ? heading[1] : text };
    });
  }
  if (!body || !Array.isArray(body.blocks) || body.blocks.length > 200) return null;
  if (body.blocks.some(block => !['heading', 'paragraph'].includes(block?.type) || typeof block.text !== 'string'
      || block.text.length > 10_000)) return null;
  return body.blocks;
}

// This renderer never accepts HTML, scripts, embeds or source URLs as article markup.
export function renderPastTeachingArticle(item, { locale = localization.getLocale(), labels = pastTeachingEn } = {}) {
  if (item?.contentType !== 'past_teaching') return '';
  const text = key => escape(labels[key] ?? pastTeachingEn[key]);
  const permitted = item.publicationState === 'published' && item.review?.status === 'approved'
    && item.rights?.status === 'verified'
    && item.rights.allowedUses?.some(use => ['display', 'host', 'hosted_reading'].includes(use));
  if (!permitted) return `<p role="status">${text('restricted')}</p>`;
  const resolved = resolveV7Content({ sourceLocale: item.sourceLocale, sourceContent: item.sourceContent,
    revision: item.publishedRevisionId, translations: item.translations ?? [] }, locale);
  const articleBlocks = blocks(resolved.content.body);
  if (!articleBlocks?.length) return `<p role="status">${text('unavailable')}</p>`;
  const fallback = resolved.state === 'source_fallback'
    ? `<p role="status">${escape(localization.t('v7.content.translation.sourceFallback', { values: { language: resolved.locale } }))}</p>` : '';
  const uri = safeSourceUrl(item.source?.uri);
  const source = uri ? `<a href="${escape(uri)}" target="_blank" rel="noopener noreferrer">${text('original')}</a>` : '';
  return `${fallback}<article lang="${escape(resolved.locale)}" aria-label="${escape(resolved.content.title)}">
    <p>${text('adapted')}</p>${resolved.state === 'translated' ? `<h2>${escape(resolved.content.title)}</h2>` : ''}${articleBlocks.map(block => block.type === 'heading'
      ? `<h2>${escape(block.text)}</h2>` : `<p>${escape(block.text).replace(/\n/g, '<br>')}</p>`).join('')}
    <footer>${source}${item.source?.creator ? `<p>${escape(item.source.creator)}</p>` : ''}${item.source?.date ? `<time datetime="${escape(item.source.date)}">${escape(item.source.date.slice(0, 10))}</time>` : ''}</footer>
  </article>`;
}
