import { localization } from '../../app/localization.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// BibleQuest V5: My Journey. A private, encouraging personal history - never
// a leaderboard, never a comparison between members. Every figure here comes
// directly from the existing shared progress log and Assignments owner; this
// page reads, it never writes. Fully localized (en/tl) via the existing
// localization owner, matching the pattern already used by Transform,
// Account, and Recordings.
function fmtDay(iso, locale) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale === 'tl' ? 'fil-PH' : undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function myJourneyPage({ myJourney, onBack } = {}) {
  return {
    title: localization.t('myjourney.title', { locale: localization.getLocale() }),
    html: '<section data-my-journey-view></section>',
    mount(root) {
      const view = root.querySelector('[data-my-journey-view]');
      let disposed = false;
      const locale = localization.getLocale();
      const text = (key, values) => localization.t(key, { locale, values });

      const intro = `<div class="bq-team-center-head"><div><p class="bq-eyebrow">${esc(text('myjourney.eyebrow'))}</p><h1>${esc(text('myjourney.title'))}</h1><p>${esc(text('myjourney.intro'))}</p></div><button type="button" class="bq-secondary-button" data-my-journey-back>${esc(text('common.back'))}</button></div>`;

      const bind = () => { view.querySelector('[data-my-journey-back]')?.addEventListener('click', () => onBack?.(), { once: true }); };

      const render = state => {
        if (disposed) return;
        if (!state.days.length) {
          view.innerHTML = `${intro}<section class="bq-panel" data-my-journey-empty><h2>${esc(text('myjourney.empty.title'))}</h2><p>${esc(text('myjourney.empty.body'))}</p></section>`;
        } else {
          const summary = `<section class="bq-panel" data-my-journey-summary><div class="bq-progress-stats"><div><b>${state.totalMoments}</b><span>${esc(text('myjourney.stat.moments'))}</span></div><div><b>${state.streakCurrent}</b><span>${esc(text('myjourney.stat.streak'))}</span></div><div><b>${state.badgeCount}</b><span>${esc(text('myjourney.stat.badges'))}</span></div></div></section>`;
          const days = state.days.map(day => `<section class="bq-panel bq-my-journey-day" data-my-journey-day="${esc(day.date)}"><p class="bq-eyebrow">${esc(fmtDay(day.date, locale))}</p><ul class="bq-my-journey-moments">${day.items.map(item => `<li data-my-journey-moment="${esc(item.id)}" data-my-journey-kind="${esc(item.kind)}">${esc(text(item.labelKey, item.labelValues))}${item.xp ? `<small> +${esc(item.xp)} ${esc(text('myjourney.xp.suffix'))}</small>` : ''}</li>`).join('')}</ul></section>`).join('');
          view.innerHTML = `${intro}${summary}<div data-my-journey-days>${days}</div>`;
        }
        bind();
      };

      let busy = false;
      async function load() {
        if (busy || disposed) return;
        busy = true;
        view.innerHTML = `${intro}<p role="status">${esc(text('myjourney.loading'))}</p>`;
        try { render(await myJourney.load()); }
        catch { if (!disposed) view.innerHTML = `${intro}<section class="bq-panel" role="alert"><h2>${esc(text('myjourney.error'))}</h2></section>`; }
        finally { busy = false; }
      }
      void load();
      return () => { disposed = true; };
    }
  };
}
