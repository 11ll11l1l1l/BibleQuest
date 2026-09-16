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

      const intro = '<div class="bq-team-center-head"><div><p class="bq-eyebrow">MINISTRY</p><h1>Leader Center</h1><p>A composed view over your congregation\u2019s existing assignments, activity, people, groups, and teams. Every action here is authorized again by its existing owner.</p></div><button type="button" class="bq-secondary-button" data-leader-back>Back</button></div>';
      const assignmentRows = state => [...(state.assignments?.open || []), ...(state.assignments?.scheduled || [])];
      const listHtml = (rows, emptyCopy, mapper) => rows.length ? `<div class="bq-stack">${rows.map(mapper).join('')}</div>` : `<p>${esc(emptyCopy)}</p>`;

      const bind = () => {
        view.querySelector('[data-leader-back]')?.addEventListener('click', () => onBack?.(), { once: true });
        view.querySelector('[data-leader-account]')?.addEventListener('click', () => onAccount?.(), { once: true });
        view.querySelector('[data-leader-congregation]')?.addEventListener('click', () => onCongregation?.(), { once: true });
        view.querySelector('[data-leader-retry]')?.addEventListener('click', load, { once: true });
        view.querySelector('[data-leader-open-assignments]')?.addEventListener('click', () => onAssignments?.(), { once: true });
        view.querySelector('[data-leader-open-groups]')?.addEventListener('click', () => onJourneyGroups?.(), { once: true });
        view.querySelector('[data-leader-open-teams]')?.addEventListener('click', () => onTeamCenter?.(), { once: true });
        for (const button of view.querySelectorAll('[data-leader-review-assignment]')) {
          button.addEventListener('click', async () => {
            const message = view.querySelector('[data-leader-review-message]');
            button.disabled = true;
            if (message) message.textContent = 'Opening response review\u2026';
            try {
              await leaderCenter.openReview(button.dataset.leaderReviewAssignment);
              if (!disposed) onAssignments?.();
            } catch {
              if (message) message.textContent = 'Response review could not open. Try again from Assignments.';
              button.disabled = false;
            }
          }, { once: true });
        }
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
          const memberCopy = state.memberCount === null ? 'Directory unavailable' : state.memberCount === 1 ? '1 congregation member' : `${state.memberCount} congregation members`;
          const directoryReady = state.directoryStatus === 'ready';
          const rows = assignmentRows(state);
          view.innerHTML = `${intro}
            <section class="bq-panel" data-leader-overview>
              <p class="bq-eyebrow">${esc(state.congregationName)}</p>
              <h2>Your role: ${esc(state.role)}</h2>
              <div class="bq-progress-stats">
                <div><b data-leader-member-count>${state.memberCount ?? '\u2014'}</b><span>${esc(memberCopy)}</span></div>
                <div><b data-leader-active-count>${state.activeInLast30Min ?? '\u2014'}</b><span>${esc(activeCopy)}</span></div>
                <div><b data-leader-open-count>${state.assignments.open.length}</b><span>Open assignments</span></div>
                <div><b data-leader-scheduled-count>${state.assignments.scheduled.length}</b><span>Scheduled</span></div>
              </div>
            </section>
            <section class="bq-panel" data-leader-review>
              <p class="bq-eyebrow">ASSIGNMENTS &amp; RESPONSE REVIEW</p>
              <h2>Review member responses</h2>
              ${listHtml(rows, 'No assignments are available to review.', row => `<div class="bq-list-row"><div><b>${esc(row.title || 'Assignment')}</b><small>${row.scheduleAt && new Date(row.scheduleAt).getTime() > Date.now() ? 'Scheduled' : 'Open'}</small></div><button type="button" class="bq-secondary-button" data-leader-review-assignment="${esc(row.id)}">Review responses</button></div>`)}
              <p class="bq-form-message" data-leader-review-message role="status"></p>
              <button type="button" class="bq-secondary-button" data-leader-open-assignments>Open all Assignments</button>
            </section>
            <section class="bq-panel" data-leader-people>
              <p class="bq-eyebrow">PEOPLE</p><h2>Ministry directory</h2>
              <p><small>Only the existing ministry-safe member directory is shown here. Private reflections, notes, Couples content, and personality answers are not part of this view.</small></p>
              ${directoryReady ? listHtml(state.people || [], 'No members are currently listed.', person => `<div class="bq-list-row" data-leader-person-row><div><b>${esc(person.label)}</b><small>${esc(person.role || 'member')}</small></div></div>`) : '<p>Member directory is unavailable right now.</p>'}
            </section>
            <section class="bq-panel" data-leader-groups-teams>
              <p class="bq-eyebrow">GROUPS &amp; TEAMS</p><h2>Existing ministry spaces</h2>
              ${directoryReady ? `<div class="bq-two-column"><div><h3>Journey Groups</h3>${listHtml(state.groups || [], 'No Journey Groups are currently listed.', group => `<div class="bq-list-row"><b>${esc(group.label)}</b></div>`)}</div><div><h3>Teams</h3>${listHtml(state.teams || [], 'No teams are currently listed.', team => `<div class="bq-list-row"><div><b>${esc(team.label)}</b>${team.type ? `<small>${esc(team.type)}</small>` : ''}</div></div>`)}</div></div>` : '<p>Groups and teams are unavailable right now.</p>'}
              <div class="bq-recording-actions"><button type="button" class="bq-secondary-button" data-leader-open-groups>Open Journey Groups</button><button type="button" class="bq-secondary-button" data-leader-open-teams>Open Team Center</button></div>
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
