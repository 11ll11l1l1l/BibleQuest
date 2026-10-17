import { v7VisualObjectPosition } from '../../ui/visual-assets.js';
import { assertV7PublishedVisualCardItem, normalizeV7DeckLocale, resolveV7LibraryVisual } from './visual-registry.js';
import { cardReveal, pressFeedback } from '../../ui/motion.js';

const typeNames = Object.freeze({
  en: { book: 'Book', devotional: 'Devotional', past_teaching: 'Teaching', action: 'Open', minute: 'min' },
  tl: { book: 'Aklat', devotional: 'Debosyonal', past_teaching: 'Pagtuturo', action: 'Buksan', minute: 'min' },
  ceb: { book: 'Basahon', devotional: 'Debosyonal', past_teaching: 'Pagtulun-an', action: 'Ablihi', minute: 'min' },
  ilo: { book: 'Libro', devotional: 'Debosional', past_teaching: 'Pannursuro', action: 'Lukatan', minute: 'min' },
});

export function createV7LibraryVisualContentCard({ document, item, registry, locale = 'en', compact = false, onOpen } = {}) {
  if (!document?.createElement || typeof onOpen !== 'function')
    throw new TypeError('visual card requires a document, titled item and onOpen callback');
  assertV7PublishedVisualCardItem(item);
  const lang = normalizeV7DeckLocale(locale);
  const labels = typeNames[lang] || typeNames.en;
  if (compact) {
    const row = document.createElement('article');
    row.className = 'bq-v7-content-card bq-v7-content-card--text-only bq-v7-content-card--compact';
    row.dataset.v7ContentId = String(item.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bq-v7-content-card__action';
    button.setAttribute('aria-label', labels.action + ': ' + item.title);
    const title = document.createElement('h3');
    title.className = 'bq-library-title-row';
    title.textContent = String(item.title);
    button.dataset.libraryItem = String(item.id);
    button.textContent = String(item.title);
    button.addEventListener('click', event => {
      event.stopPropagation();
      onOpen(Object.freeze({ id: item.id, contentType: item.contentType }));
    });
    row.append(title, button);
    return row;
  }
  const visual = resolveV7LibraryVisual(registry, item.contentType, item.id, {
    locale: lang, title: String(item.title),
  });
  const root = document.createElement('article');
  const hasApprovedArt = Boolean(visual.src);
  root.className = 'bq-v7-content-card' +
    (hasApprovedArt ? '' : ' bq-v7-content-card--text-only');
  // Stable IDs create repeatable, subdued color families without an image dependency.
  root.dataset.v7Tone = String([...String(item.id)].reduce((n, c) => n + c.charCodeAt(0), 0) % 4);
  root.dataset.v7ContentId = String(item.id);
  const cover = document.createElement('div');
  cover.className = 'bq-v7-content-card__cover';
  if (visual.src) {
    const image = document.createElement('img');
    image.src = visual.src;
    image.style.objectPosition = v7VisualObjectPosition(visual.focalPoint);
    image.alt = visual.alt;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      image.hidden = true;
      root.className += ' bq-v7-content-card--text-only';
      cover.remove?.();
    });
    cover.append(image);
  } else {
    cover.remove?.();
  }
  const details = document.createElement('div');
  details.className = 'bq-v7-content-card__details';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'bq-v7-content-card__eyebrow';
  eyebrow.textContent = labels[item.contentType];
  const title = document.createElement('h3');
  title.textContent = String(item.title);
  const description = document.createElement('p');
  description.textContent = String(item.summary || item.description || '');
  const info = document.createElement('p');
  info.className = 'bq-v7-content-card__meta';
  const author = item.source?.creator || item.author || '';
  const topic = (item.taxonomyLinks || []).find(row => row?.kind === 'topic');
  const topicLabel = topic
    ? (topic.labels?.[lang] || topic.labels?.[lang.split('-')[0]] || topic.labels?.en || topic.id || '') : '';
  const duration = Number.isFinite(item.readingMinutes) && item.readingMinutes > 0
    ? String(item.readingMinutes) + ' ' + labels.minute : '';
  const progress = typeof item.progressLabel === 'string' ? item.progressLabel.trim() : '';
  info.textContent = [topicLabel, author, duration, progress].filter(Boolean).join(' · ');
  const hint = document.createElement('span');
  hint.className = 'bq-v7-content-card__cta';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = labels.action + ' →';
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'bq-v7-content-card__action';
  open.setAttribute('aria-label', labels.action + ': ' + item.title);
  // Keep the reviewed, localized title in the action's DOM text for browser
  // audits and non-visual consumers; CSS hides duplicate visible lettering.
  open.textContent = labels.action + ': ' + item.title;
  open.dataset.libraryItem = String(item.id);
  // The Library page also delegates [data-library-item] events for legacy
  // cards; stop bubbling so a visual-card click navigates exactly once.
  open.addEventListener('click', event => {
    event.stopPropagation();
    pressFeedback(open, { environment: { document } });
    onOpen(Object.freeze({ id: item.id, contentType: item.contentType }));
  });
  details.append(eyebrow, title, description, info, hint, open);
  root.append(...(hasApprovedArt ? [cover, details] : [details]));
  cardReveal(root, { environment: { document } });
  return root;
}
