import { localization } from '../../app/localization.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// BibleQuest V5 Phase 1: Leader Center. Presentation/navigation only - every
// figure shown here is read directly from leader-center.js's composition of
// already-authorized owners. This page never queries Supabase itself.
export function leaderCenterPage({ leaderCenter, onBack, onAccount, onAssignments, onCalendar, onContentReview, onJourneyGroups, onTeamCenter, onCongregation } = {}) {
  const locale = localization.getLocale();
  const tr = (key, values) => localization.t(key, { locale, values });
  return {
    title: tr('leaderCenter.title'),
    html: '<section data-leader-center-view></section>',
    mount(root) {
      const view = root.querySelector('[data-leader-center-view]');
      let disposed = false;

      const intro = `<div class="bq-team-center-head"><div><p class="bq-eyebrow">${esc(tr('leaderCenter.eyebrow'))}</p><h1>${esc(tr('leaderCenter.title'))}</h1><p>${esc(tr('leaderCenter.description'))}</p></div><button type="button" class="bq-secondary-button" data-leader-back>${esc(tr('common.back'))}</button></div>`;
      const assignmentRows = state => [...(state.assignments?.published || []), ...(state.assignments?.scheduled || []), ...(state.assignments?.completed || []), ...(state.assignments?.unclassified || [])];
      const listHtml = (rows, emptyCopy, mapper) => rows.length ? `<div class="bq-stack">${rows.map(mapper).join('')}</div>` : `<p>${esc(emptyCopy)}</p>`;

      const bind = () => {
        view.querySelector('[data-leader-back]')?.addEventListener('click', () => onBack?.(), { once: true });
        view.querySelector('[data-leader-account]')?.addEventListener('click', () => onAccount?.(), { once: true });
        view.querySelector('[data-leader-congregation]')?.addEventListener('click', () => onCongregation?.(), { once: true });
        view.querySelector('[data-leader-retry]')?.addEventListener('click', load, { once: true });
        view.querySelector('[data-leader-open-assignments]')?.addEventListener('click', () => onAssignments?.(), { once: true });
        view.querySelector('[data-leader-open-calendar]')?.addEventListener('click', () => onCalendar?.(), { once: true });
        view.querySelector('[data-leader-open-content-review]')?.addEventListener('click', () => onContentReview?.(), { once: true });
        view.querySelector('[data-leader-open-groups]')?.addEventListener('click', () => onJourneyGroups?.(), { once: true });
        view.querySelector('[data-leader-open-teams]')?.addEventListener('click', () => onTeamCenter?.(), { once: true });
        for (const button of view.querySelectorAll('[data-leader-review-assignment]')) {
          button.addEventListener('click', async () => {
            const message = view.querySelector('[data-leader-review-message]');
            button.disabled = true;
            if (message) message.textContent = tr('leaderCenter.review.opening');
            try {
              await leaderCenter.openReview(button.dataset.leaderReviewAssignment);
              if (!disposed) onAssignments?.();
            } catch {
              if (message) message.textContent = tr('leaderCenter.review.openError');
              button.disabled = false;
            }
          }, { once: true });
        }
      };

      const render = state => {
        if (disposed) return;
        if (state.status === 'signed-out') {
          view.innerHTML = `${intro}<section class="bq-panel"><h2>${esc(tr('leaderCenter.signedOut'))}</h2><button type="button" class="bq-primary-button" data-leader-account>${esc(tr('community.openAccount'))}</button></section>`;
        } else if (state.status === 'unauthorized' || !state.authorized) {
          view.innerHTML = `${intro}<section class="bq-panel" data-leader-center-denied><h2>${esc(tr('leaderCenter.denied.heading'))}</h2><p>${esc(tr('leaderCenter.denied.description'))}</p><button type="button" class="bq-secondary-button" data-leader-congregation>${esc(tr('leaderCenter.openCongregation'))}</button></section>`;
        } else if (state.status === 'error') {
          view.innerHTML = `${intro}<section class="bq-panel" role="alert"><h2>${esc(tr('leaderCenter.loadError'))}</h2><button type="button" class="bq-secondary-button" data-leader-retry>${esc(tr('common.retry'))}</button></section>`;
        } else {
          const activeCopy = state.activeInLast30Min === null ? tr('leaderCenter.activity.unavailable') : state.activeInLast30Min === 0 ? tr('leaderCenter.activity.none') : tr(state.activeInLast30Min === 1 ? 'leaderCenter.activity.one' : 'leaderCenter.activity.many', { count: state.activeInLast30Min });
          const memberCopy = state.memberCount === null ? tr('leaderCenter.directory.unavailable') : tr(state.memberCount === 1 ? 'leaderCenter.members.one' : 'leaderCenter.members.many', { count: state.memberCount });
          const directoryReady = state.directoryStatus === 'ready';
          const rows = assignmentRows(state);
          const upcoming = Array.isArray(state.upcoming?.items) ? state.upcoming.items : [];
          const upcomingHtml = state.upcoming?.status !== 'ready'
            ? `<p>${esc(tr('leaderCenter.upcoming.unavailable'))}</p>`
            : listHtml(upcoming, tr('leaderCenter.upcoming.empty'), item => {const source=tr(item.source==='assignment'?'leaderCenter.upcoming.assignment':'leaderCenter.upcoming.congregation');return `<div class="bq-list-row" data-leader-upcoming-row data-leader-upcoming-source="${esc(item.source)}"><div><b>${esc(item.title)}</b><small>${esc(item.date)} · ${esc(source)}</small></div></div>`});
          const moderationHtml = state.contentReviewEntryVisible
            ? `<section class="bq-panel" data-leader-content-review><p class="bq-eyebrow">${esc(tr('leaderCenter.moderation.eyebrow'))}</p><h2>${esc(tr('leaderCenter.moderation.heading'))}</h2><p>${esc(tr('leaderCenter.moderation.description'))}</p><button type="button" class="bq-secondary-button" data-leader-open-content-review>${esc(tr('leaderCenter.moderation.open'))}</button></section>`
            : '';
          view.innerHTML = `${intro}
            <section class="bq-panel" data-leader-overview>
              <p class="bq-eyebrow">${esc(state.congregationName)}</p>
              <h2>${esc(tr('leaderCenter.yourRole', { role: state.role }))}</h2>
              <div class="bq-progress-stats">
                <div><b data-leader-member-count>${state.memberCount ?? '\u2014'}</b><span>${esc(memberCopy)}</span></div>
                <div><b data-leader-active-count>${state.activeInLast30Min ?? '\u2014'}</b><span>${esc(activeCopy)}</span></div>
                <div><b data-leader-published-count>${state.assignments.published.length}</b><span>${esc(tr('leaderCenter.status.published'))}</span></div>
                <div><b data-leader-scheduled-count>${state.assignments.scheduled.length}</b><span>${esc(tr('leaderCenter.status.scheduled'))}</span></div>
                <div><b data-leader-completed-count>${state.assignments.completed.length}</b><span>${esc(tr('leaderCenter.status.completed'))}</span></div>
              </div>
            </section>
            <section class="bq-panel" data-leader-upcoming>
              <p class="bq-eyebrow">${esc(tr('leaderCenter.upcoming.eyebrow'))}</p>
              <h2>${esc(tr('leaderCenter.upcoming.heading'))}</h2>
              <p><small>${esc(tr('leaderCenter.upcoming.privacy'))}</small></p>
              ${upcomingHtml}
              <button type="button" class="bq-secondary-button" data-leader-open-calendar>${esc(tr('leaderCenter.upcoming.openCalendar'))}</button>
            </section>
            ${moderationHtml}
            <section class="bq-panel" data-leader-review>
              <p class="bq-eyebrow">${esc(tr('leaderCenter.review.eyebrow'))}</p>
              <h2>${esc(tr('leaderCenter.review.heading'))}</h2>
              ${state.assignments.lifecycleStatus!=='ready'?`<p class="bq-form-message" role="status">${esc(tr('leaderCenter.lifecycleUnavailable'))}</p>`:''}
              ${listHtml(rows, tr('leaderCenter.review.empty'), row => {const life=row.lifecycle;const label=tr(life?.status==='completed'?'leaderCenter.status.completed':life?.status==='scheduled'?'leaderCenter.status.scheduled':life?.status==='published'?'leaderCenter.status.published':'leaderCenter.status.unavailable');const totals=life?` · ${tr('leaderCenter.status.total',{completed:life.completedCount,total:life.recipientCount})}`:'';return `<div class="bq-list-row"><div><b>${esc(row.title || tr('leaderCenter.assignmentFallback'))}</b><small>${esc(label+totals)}</small></div><button type="button" class="bq-secondary-button" data-leader-review-assignment="${esc(row.id)}">${esc(tr('leaderCenter.review.action'))}</button></div>`})}
              <p class="bq-form-message" data-leader-review-message role="status"></p>
              <button type="button" class="bq-secondary-button" data-leader-open-assignments>${esc(tr('leaderCenter.openAssignments'))}</button>
            </section>
            <section class="bq-panel" data-leader-people>
              <p class="bq-eyebrow">${esc(tr('leaderCenter.people.eyebrow'))}</p><h2>${esc(tr('leaderCenter.people.heading'))}</h2>
              <p><small>${esc(tr('leaderCenter.people.privacy'))}</small></p>
              ${directoryReady ? listHtml(state.people || [], tr('leaderCenter.people.empty'), person => `<div class="bq-list-row" data-leader-person-row><div><b>${esc(person.label)}</b><small>${esc(person.role || tr('leaderCenter.memberFallback'))}</small></div></div>`) : `<p>${esc(tr('leaderCenter.directory.unavailableNow'))}</p>`}
            </section>
            <section class="bq-panel" data-leader-groups-teams>
              <p class="bq-eyebrow">${esc(tr('leaderCenter.spaces.eyebrow'))}</p><h2>${esc(tr('leaderCenter.spaces.heading'))}</h2>
              ${directoryReady ? `<div class="bq-two-column"><div><h3>${esc(tr('leaderCenter.groups.heading'))}</h3>${listHtml(state.groups || [], tr('leaderCenter.groups.empty'), group => `<div class="bq-list-row"><b>${esc(group.label)}</b></div>`)}</div><div><h3>${esc(tr('leaderCenter.teams.heading'))}</h3>${listHtml(state.teams || [], tr('leaderCenter.teams.empty'), team => `<div class="bq-list-row"><div><b>${esc(team.label)}</b>${team.type ? `<small>${esc(team.type)}</small>` : ''}</div></div>`)}</div></div>` : `<p>${esc(tr('leaderCenter.spaces.unavailable'))}</p>`}
              <div class="bq-recording-actions"><button type="button" class="bq-secondary-button" data-leader-open-groups>${esc(tr('leaderCenter.groups.open'))}</button><button type="button" class="bq-secondary-button" data-leader-open-teams>${esc(tr('leaderCenter.teams.open'))}</button></div>
            </section>`;
        }
        bind();
      };

      let busy = false;
      async function load() {
        if (busy || disposed) return;
        busy = true;
        view.innerHTML = `<p class="bq-eyebrow">${esc(tr('leaderCenter.eyebrow'))}</p><h1>${esc(tr('leaderCenter.opening'))}</h1>`;
        try { render(await leaderCenter.load()); }
        catch { if (!disposed) render({ status: 'error' }); }
        finally { busy = false; }
      }
      void load();
      return () => { disposed = true; };
    }
  };
}
