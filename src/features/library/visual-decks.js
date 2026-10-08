import './visual-decks.css';
import { buildV7LibraryDeckModel } from './visual-registry.js';
import { cleanupMotion, deckSpring, motionEnabled, pressFeedback } from '../../ui/motion.js';

const copy = Object.freeze({
  en: ['Previous card', 'Next card', 'Card', 'of', 'Select'],
  tl: ['Nakaraang card', 'Susunod na card', 'Card', 'sa', 'Piliin'],
  ceb: ['Miaging kard', 'Sunod nga kard', 'Kard', 'sa', 'Pilia'],
  ilo: ['Napalabas a kard', 'Sumaruno a kard', 'Kard', 'iti', 'Pilien'],
});

let nextDeckId = 0;

function button(doc, text, className) {
  const node = doc.createElement('button');
  node.type = 'button';
  node.className = className;
  node.textContent = text;
  return node;
}

export function createV7LibraryDiscoveryDeck({
  root, kind, locale = 'en', registry, selectedIds = [], onSelect = () => {},
} = {}) {
  if (!root?.ownerDocument || typeof root.replaceChildren !== 'function')
    throw new TypeError('deck requires a mounted DOM host');
  if (typeof onSelect !== 'function') throw new TypeError('onSelect must be a callback');
  const doc = root.ownerDocument;
  const model = buildV7LibraryDeckModel({ kind, locale, registry, selectedIds });
  const words = copy[model.locale] || copy.en;
  const selected = new Set(model.entries.filter(row => row.selected).map(row => row.id));
  let active = Math.max(0, model.entries.findIndex(row => row.selected));
  let destroyed = false;

  const region = doc.createElement('section');
  region.className = 'bq-v7-visual-deck';
  region.dataset.v7Deck = kind;
  const title = doc.createElement('h2');
  title.className = 'bq-v7-visual-deck__title';
  title.textContent = model.question;
  title.id = 'bq-v7-deck-title-' + kind + '-' + (++nextDeckId);
  region.setAttribute('aria-labelledby', title.id);
  const viewport = doc.createElement('div');
  viewport.className = 'bq-v7-visual-deck__track';
  viewport.setAttribute('role', 'group');
  viewport.setAttribute('aria-roledescription', 'carousel');
  viewport.setAttribute('aria-label', model.question);
  viewport.tabIndex = 0;
  const cards = model.entries.map((entry, index) => {
    const card = button(doc, entry.label, 'bq-v7-visual-deck__card');
    card.dataset.v7DeckId = entry.id;
    card.setAttribute('lang', entry.labelLocale);
    card.setAttribute('aria-label', `${words[4]} ${entry.label}. ${words[2]} ${index+1} ${words[3]} ${model.entries.length}`);
    card.setAttribute('aria-pressed', String(selected.has(entry.id)));
    card.textContent = ''; // replaced by semantic child elements
    const visual = doc.createElement('span');
    visual.className = 'bq-v7-visual-deck__image';
    visual.dataset.fallback = entry.visual.fallback;
    if (entry.visual.src) {
      const image = doc.createElement('img');
      image.src = entry.visual.src;
      image.alt = entry.visual.alt; // a decorative image uses alt="", with a live card label
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => { image.hidden = true; });
      visual.append(image);
    }
    const label = doc.createElement('span');
    label.className = 'bq-v7-visual-deck__label';
    label.textContent = entry.label;
    const chosen = doc.createElement('span');
    chosen.className = 'bq-v7-visual-deck__selected';
    chosen.textContent = model.selectedLabel;
    chosen.hidden = !selected.has(entry.id);
    card.append(visual, label, chosen);
    card.addEventListener('click', () => {
      if (destroyed) return;
      active = index;
      pressFeedback(card, { environment: { document: doc } });
      if (selected.has(entry.id)) selected.delete(entry.id);
      else selected.add(entry.id);
      update();
      align(index, false);
      onSelect(Object.freeze({
        kind, id: entry.id, selected: selected.has(entry.id),
        selectedIds: Object.freeze([...selected]),
      }));
    });
    viewport.append(card);
    return card;
  });
  const controls = doc.createElement('div');
  controls.className = 'bq-v7-visual-deck__controls';
  const previous = button(doc, '‹', 'bq-v7-visual-deck__arrow');
  previous.setAttribute('aria-label', words[0]);
  const current = doc.createElement('output');
  current.className = 'bq-v7-visual-deck__counter';
  current.setAttribute('aria-live', 'polite');
  const next = button(doc, '›', 'bq-v7-visual-deck__arrow');
  next.setAttribute('aria-label', words[1]);
  controls.append(previous, current, next);
  region.append(title, viewport, controls);
  root.replaceChildren(region);

  function update() {
    cards.forEach((card, index) => {
      card.setAttribute('aria-current', String(active === index));
      card.setAttribute('aria-pressed', String(selected.has(model.entries[index].id)));
      card.querySelector('.bq-v7-visual-deck__selected').hidden = !selected.has(model.entries[index].id);
    });
    current.textContent = `${words[2]} ${active+1} ${words[3]} ${cards.length}`;
    previous.disabled = active <= 0;
    next.disabled = active >= cards.length-1;
  }

  function align(index, focus) {
    if (destroyed || !cards[index]) return;
    active = Math.max(0, Math.min(index, cards.length-1));
    const left = cards[active].offsetLeft - viewport.offsetLeft
      - (viewport.clientWidth - cards[active].clientWidth)/2;
    const reduced = !motionEnabled({ document: doc });
    viewport.scrollTo?.({ left: Math.max(0,left), behavior: reduced ? 'instant' : 'smooth' });
    update();
    if (focus) deckSpring(cards[active], { delta: index > 0 ? 14 : -14, environment: { document: doc } });
    if (focus) cards[active].focus({ preventScroll: true });
  }

  const onScroll = () => {
    if (destroyed || !viewport.clientWidth) return;
    const center = viewport.scrollLeft + viewport.clientWidth / 2 + viewport.offsetLeft;
    let nearest = 0, distance = Infinity;
    cards.forEach((card, index) => {
      const currentDistance = Math.abs(card.offsetLeft + card.clientWidth/2 - center);
      if (currentDistance < distance) { distance = currentDistance; nearest = index; }
    });
    if (nearest !== active) { active = nearest; update(); }
  };
  const onKeys = event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' ||
      event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      align(event.key === 'Home' ? 0 : event.key === 'End' ? cards.length-1
        : active + (event.key === 'ArrowRight' ? 1 : -1), true);
    }
  };
  const goPrev = () => align(active-1, true);
  const goNext = () => align(active+1, true);
  viewport.addEventListener('scroll', onScroll, { passive: true });
  viewport.addEventListener('keydown', onKeys);
  previous.addEventListener('click', goPrev);
  next.addEventListener('click', goNext);
  update();
  const frame = globalThis.requestAnimationFrame?.(() => align(active, false));

  return Object.freeze({
    element: region,
    getState: () => Object.freeze({ kind, activeId: model.entries[active]?.id || '', selectedIds: Object.freeze([...selected]) }),
    destroy() {
      destroyed = true;
      cards.forEach(cleanupMotion);
      if (frame != null) globalThis.cancelAnimationFrame?.(frame);
      viewport.removeEventListener('scroll', onScroll);
      viewport.removeEventListener('keydown', onKeys);
      previous.removeEventListener('click', goPrev);
      next.removeEventListener('click', goNext);
      if (region.parentElement === root) root.replaceChildren();
    },
  });
}
