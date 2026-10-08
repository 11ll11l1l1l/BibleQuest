import './visual-decks.css';
import { assertV7PublishedVisualCardItem, normalizeV7DeckLocale, resolveV7LibraryVisual } from './visual-registry.js';
import { cardReveal, pressFeedback } from '../../ui/motion.js';

const typeNames = Object.freeze({
  en: { book: 'Book', devotional: 'Devotional', past_teaching: 'Teaching', action: 'Open' },
  tl: { book: 'Aklat', devotional: 'Debosyonal', past_teaching: 'Pagtuturo', action: 'Buksan' },
  ceb: { book: 'Basahon', devotional: 'Debosyonal', past_teaching: 'Pagtulun-an', action: 'Ablihi' },
  ilo: { book: 'Libro', devotional: 'Debosional', past_teaching: 'Pannursuro', action: 'Lukatan' },
});

export function createV7LibraryVisualContentCard({ document, item, registry, locale = 'en', onOpen } = {}) {
  if (!document?.createElement || typeof onOpen !== 'function')
    throw new TypeError('visual card requires a document, titled item and onOpen callback');
  assertV7PublishedVisualCardItem(item);
  const lang = normalizeV7DeckLocale(locale);
  const labels = typeNames[lang] || typeNames.en;
  const visual = resolveV7LibraryVisual(registry, item.contentType, item.id);
  const root = document.createElement('article');
  root.className = 'bq-v7-content-card';
  root.dataset.v7ContentId = String(item.id);
  const cover = document.createElement('div');
  cover.className = 'bq-v7-content-card__cover';
  if (visual.src) {
    const image = document.createElement('img');
    image.src = visual.src;
    image.alt = visual.alt;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => { image.hidden = true; });
    cover.append(image);
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
  const duration = Number.isFinite(item.readingMinutes) && item.readingMinutes > 0
    ? String(item.readingMinutes) + ' min' : '';
  info.textContent = [author, duration].filter(Boolean).join(' · ');
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'bq-v7-content-card__action';
  open.textContent = labels.action + ': ' + item.title;
  open.dataset.libraryItem = String(item.id);
  // The Library page also delegates [data-library-item] events for legacy
  // cards; stop bubbling so a visual-card click navigates exactly once.
  open.addEventListener('click', event => {
    event.stopPropagation();
    pressFeedback(open, { environment: { document } });
    onOpen(Object.freeze({ id: item.id, contentType: item.contentType }));
  });
  details.append(eyebrow, title, description, info, open);
  root.append(cover, details);
  cardReveal(root, { environment: { document } });
  return root;
}
