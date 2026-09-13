const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// BibleQuest V5 Phase 1: Leader Center. Presentation/navigation only - every
// figure shown here is read directly from leader-center.js's composition of
// already-authorized owners. This page never queries Supabase itself.
export function leaderCenterPage({ leaderCenter, onBack, onAccount, onAssignments, onJourneyGroups, onTeamCenter, onCongregation } = {}) {
  return {
    title: 'Leader Center',
    html: '<section data-leader-center-view></section>',
    mount(root) {
      const view = root.querySelector('[data-leader-center-view]');
      let disposed = false;

      const intro = '<div class="bq-team-center-head"><div><p class="bq-eyebrow">MINISTRY</p><h1>Leader Center</h1><p>A composed view over your congregation\u2019s existing assignments, activity, and groups. Every action here is authorized again on the server - this page invents no new access.</p></div><button type="button" class="bq-secondary-button" data-leader-back>Back</button></div>';

      const bind = () => {
        view.querySelector('[data-leader-back]')?.addEventListener('click', () => onBack?.(), { once: true });
        view.querySelector('[data-leader-account]')?.addEventListener('click', () => onAccount?.(), { once: true });
        view.querySelector('[data-leader-congregation]')?.addEventListener('click', () => onCongregation?.(), { once: true });
        view.querySelector('[data-leader-retry]')?.addEventListener('click', load, { once: true });
        view.querySelector('[data-leader-open-assignments]')?.addEventListener('click', () => onAssignments?.(), { once: true });
        view.querySelector('[data-leader-open-groups]')?.addEventListener('click', () => onJourneyGroups?.(), { once: true });
        view.querySelector('[data-leader-open-teams]')?.addEventListener('click', () => onTeamCenter?.(), { once: true });
      };

      const render = state => {
        if (disposed) return;
        if (state.status === 'signed-out') {
          view.innerHTML = `${intro}<section class="bq-panel"><h2>Sign in to open the Leader Center</h2><button type="button" class="bq-primary-button" data-leader-account>Open account</button></section>`;
        } else if (state.status === 'unauthorized' || !state.authorized) {
          view.innerHTML = `${intro}<section class="bq-panel" data-leader-center-denied><h2>Ministry role required</h2><p>The Leader Center is available only to congregation leaders, pastors, facilitators, and admins. This is enforced by the same server-side role check the rest of BibleQuest already uses - being on this screen briefly does not grant any access.</p><button type="button" class="bq-secondary-button" data-leader-congregation>Open congregation access</button></section>`;
        } else if (state.status === 'error') {
          view.innerHTML = `${intro}<section class="bq-panel" role="alert"><h2>Leader Center could not load</h2><button type="button" class="bq-secondary-button" data-leader-retry>Try again</button></section>`;
        } else {
          const activeCopy = state.activeInLast30Min === null ? 'Activity unavailable right now.' : state.activeInLast30Min === 0 ? 'No recent activity.' : state.activeInLast30Min === 1 ? '1 active in the last 30 min' : `${state.activeInLast30Min} active in the last 30 min`;
          view.innerHTML = `${intro}
            <section class="bq-panel" data-leader-overview>
              <p class="bq-eyebrow">${esc(state.congregationName)}</p>
              <h2>Your role: ${esc(state.role)}</h2>
              <div class="bq-progress-stats">
                <div><b data-leader-active-count>${state.activeInLast30Min ?? '\u2014'}</b><span>${esc(activeCopy)}</span></div>
                <div><b data-leader-open-count>${state.assignments.open.length}</b><span>Open assignments</span></div>
                <div><b data-leader-scheduled-count>${state.assignments.scheduled.length}</b><span>Scheduled</span></div>
              </div>
            </section>
            <section class="bq-panel" data-leader-quick-actions>
              <p class="bq-eyebrow">QUICK ACTIONS</p>
              <button type="button" class="bq-primary-button" data-leader-open-assignments>Open Assignments &amp; Review</button>
              <button type="button" class="bq-secondary-button" data-leader-open-groups>Open Journey Groups</button>
              <button type="button" class="bq-secondary-button" data-leader-open-teams>Open Team Center</button>
            </section>`;
        }
        bind();
      };

      let busy = false;
      async function load() {
        if (busy || disposed) return;
        busy = true;
        view.innerHTML = '<p class="bq-eyebrow">MINISTRY</p><h1>Opening Leader Center\u2026</h1>';
        try { render(await leaderCenter.load()); }
        catch { if (!disposed) render({ status: 'error' }); }
        finally { busy = false; }
      }
      void load();
      return () => { disposed = true; };
    }
  };
}
