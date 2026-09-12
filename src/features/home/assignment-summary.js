const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const MINISTRY_ROLES = new Set(['facilitator','leader','pastor','admin']);
const DUE_SOON_MS = 48 * 60 * 60 * 1000;
const ASSIGNMENT_TYPE_LABELS = Object.freeze({
  reading:'Reading','guided-study':'Guided Study',mission:'Mission',quiz:'Quiz',reflection:'Reflection',couples:'Couples',group:'Group activity',custom:'Custom'
});

const formatAssignmentDue = value => {
  if (!value) return 'No deadline';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No deadline';
  try { return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(date); }
  catch { return String(value); }
};

export function homeAssignmentItems(state,{now=Date.now(),limit=3}={}) {
  if (state?.status !== 'ready' || !Array.isArray(state.assignments)) return [];
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  return state.assignments
    .filter(row => row?.progress?.status !== 'completed' && row?.dueState !== 'completed' && row?.dueState !== 'scheduled')
    .map(row => {
      const dueMs = row?.dueAt ? Date.parse(row.dueAt) : Number.NaN;
      const dueSoon = row?.dueState === 'open' && Number.isFinite(dueMs) && dueMs >= safeNow && dueMs - safeNow <= DUE_SOON_MS;
      const started = row?.progress?.status === 'started';
      const status = row?.dueState === 'overdue'
        ? Object.freeze({key:'overdue',label:'Overdue',priority:0})
        : dueSoon
          ? Object.freeze({key:'due-soon',label:'Due soon',priority:1})
          : started
            ? Object.freeze({key:'in-progress',label:'In progress',priority:2})
            : Object.freeze({key:'pending',label:'Pending',priority:3});
      return Object.freeze({
        id:String(row?.id||''),
        title:String(row?.title||'Assignment'),
        typeLabel:ASSIGNMENT_TYPE_LABELS[row?.type]||String(row?.type||'Assignment'),
        dueAt:row?.dueAt||null,
        dueText:formatAssignmentDue(row?.dueAt),
        status,
        progressLabel:started?'Started':'Assigned'
      });
    })
    .filter(row => row.id)
    .sort((a,b) => a.status.priority-b.status.priority || (Date.parse(a.dueAt)||Number.MAX_SAFE_INTEGER)-(Date.parse(b.dueAt)||Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title))
    .slice(0,Math.max(1,Number(limit)||3));
}

function statePanel({key,title,copy,action='Open Assignments',retry=false}) {
  return `<div class="bq-home-assignment-state" data-home-assignment-state="${escapeHtml(key)}"><div><p class="bq-eyebrow">ASSIGNMENTS</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></div><div class="bq-home-assignment-state-actions">${retry?'<button type="button" class="bq-secondary-button" data-home-assignments-retry>Try again</button>':''}<button type="button" class="bq-secondary-button" data-home-assignments-all>${escapeHtml(action)}</button></div></div>`;
}

export function homeAssignmentPanelHtml(state) {
  const status=String(state?.status||'loading');
  if(status==='loading'||status==='idle')return statePanel({key:'loading',title:'Checking your assignments…',copy:'Looking for current congregation tasks from the existing Assignments service.'});
  if(status==='signed-out')return statePanel({key:'signed-out',title:'Sign in to see assignments',copy:'Assignment status is account-backed. Home does not expose cloud task metadata while signed out.'});
  if(status==='local-preview')return statePanel({key:'offline',title:'Assignments need a cloud connection',copy:'Local preview and offline mode do not invent congregation assignments. Your saved local BibleQuest tools remain available.'});
  if(status==='no-congregation')return statePanel({key:'no-congregation',title:'Join a congregation to receive assignments',copy:'No active congregation membership is linked to this account yet.'});
  if(status==='error')return statePanel({key:'error',title:'Assignments could not load',copy:'Your Home page is still usable. Retry the same Assignments owner or open the full Assignments page.',retry:true});
  if(status!=='ready')return statePanel({key:'unavailable',title:'Assignments are unavailable right now',copy:'Open Assignments for the latest account and congregation status.'});

  const rows=Array.isArray(state.assignments)?state.assignments:[];
  const items=homeAssignmentItems(state);
  if(!items.length){
    const completed=rows.some(row=>row?.progress?.status==='completed'||row?.dueState==='completed');
    return completed
      ? statePanel({key:'completed',title:'You’re caught up',copy:'Your current open assignments are complete. New congregation tasks will appear here when available.'})
      : statePanel({key:'empty',title:'No open assignments',copy:'There are no active congregation tasks for you right now.'});
  }

  const ministry=MINISTRY_ROLES.has(state.role);
  const totalActive=rows.filter(row=>row?.progress?.status!=='completed'&&row?.dueState!=='completed'&&row?.dueState!=='scheduled').length;
  return `<div data-home-assignment-state="active"><div class="bq-home-assignment-head"><div><p class="bq-eyebrow">ASSIGNMENTS${totalActive?` · ${totalActive}`:''}</p><h2>${ministry?'Congregation assignments':'Your assignments'}</h2><p>${ministry?'Review current congregation tasks from the existing ministry workflow.':'Keep current congregation tasks visible without leaving Home.'}</p></div><button type="button" class="bq-secondary-button" data-home-assignments-all>See all</button></div><div class="bq-home-assignment-list">${items.map(item=>`<button type="button" class="bq-home-assignment-row" data-home-assignment-open="${escapeHtml(item.id)}" aria-label="Open assignment ${escapeHtml(item.title)}"><span class="bq-home-assignment-status is-${escapeHtml(item.status.key)}" data-home-assignment-status="${escapeHtml(item.status.key)}">${escapeHtml(item.status.label)}</span><span class="bq-home-assignment-copy"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.typeLabel)} · ${escapeHtml(item.progressLabel)}${item.dueAt?` · Due ${escapeHtml(item.dueText)}`:''}</small></span><span class="bq-home-assignment-open" aria-hidden="true">Open</span></button>`).join('')}</div></div>`;
}
