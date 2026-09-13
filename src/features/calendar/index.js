const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt=iso=>{const d=new Date(`${iso}T00:00:00`);return Number.isNaN(d.getTime())?iso:d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})};
const ICON={assignment:'assignment',congregation:'congregation',personal:'personal'};
const calendarIcon=(id,variant='event')=>`<span class="bq-calendar-icon-wrap bq-calendar-icon-wrap--${variant}" aria-hidden="true"><svg class="bq-calendar-icon bq-calendar-icon--${variant}" viewBox="0 0 24 24" focusable="false"><use href="assets/calendar-feature-icons.svg#${id}"></use></svg></span>`;
const isOccurrence=id=>/:occurrence-\d+$/.test(String(id||''));
const isoDate=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const monthLabel=date=>date.toLocaleDateString(undefined,{month:'long',year:'numeric'});
const monthCells=(cursor,eventsByDate)=>{
  const first=new Date(cursor.getFullYear(),cursor.getMonth(),1);
  const start=new Date(cursor.getFullYear(),cursor.getMonth(),1-first.getDay());
  return Array.from({length:42},(_,index)=>{
    const date=new Date(start.getFullYear(),start.getMonth(),start.getDate()+index);
    const iso=isoDate(date),events=eventsByDate.get(iso)||[],inMonth=date.getMonth()===cursor.getMonth();
    return `<div class="bq-calendar-month-cell${inMonth?'':' is-outside-month'}" role="gridcell" data-calendar-date="${iso}" aria-label="${esc(fmt(iso))}${events.length?`, ${events.length} event${events.length===1?'':'s'}`:''}"><span class="bq-calendar-month-day">${date.getDate()}</span>${events.length?`<div class="bq-calendar-month-events">${events.slice(0,3).map(event=>`<span class="bq-calendar-month-dot bq-calendar-month-dot--${esc(event.source)}" title="${esc(event.title)}"><span class="bq-sr-only">${esc(event.title)}</span></span>`).join('')}${events.length>3?`<span class="bq-calendar-month-more" aria-label="${events.length-3} more events">+${events.length-3}</span>`:''}</div>`:''}</div>`;
  }).join('');
};

export function calendarPage({calendar,onBack,onAccount}={}){
  return{title:'Calendar',html:'<section class="bq-panel" data-calendar-page></section>',mount(root){
    const host=root.querySelector('[data-calendar-page]');let message='',editing=null,currentState=calendar.getState(),disposed=false,monthCursor=new Date();
    const render=state=>{
      if(disposed)return;currentState=state;
      const agenda=state.agenda;
      const eventsByDate=new Map(agenda.map(day=>[day.date,day.events]));
      const form=editing?`<form data-calendar-add><p class="bq-eyebrow">EDIT SHARED EVENT</p><input type="text" name="title" aria-label="Event title" placeholder="Event title" maxlength="120" value="${esc(editing.title)}" required><input type="date" name="eventDate" aria-label="Event date" value="${esc(editing.date)}" required><label>Repeat weekly for extra weeks <input type="number" name="recurrenceWeeks" min="0" max="52" value="${Number(editing.recurrenceWeeks)||0}" data-calendar-recurrence></label><button type="submit" class="bq-secondary-button">Save changes</button><button type="button" class="bq-secondary-button" data-calendar-cancel-edit>Cancel</button></form>`:`<form data-calendar-add><input type="text" name="title" aria-label="Event title" placeholder="Event title" maxlength="120" required><input type="date" name="eventDate" aria-label="Event date" required>${state.canShareWithCongregation?`<label><input type="checkbox" name="shareWithCongregation" data-calendar-share> Share with ${esc(state.congregationName||'congregation')} (leaders only)</label><input type="number" name="recurrenceWeeks" min="0" max="52" value="0" title="Repeat weekly for this many extra weeks" data-calendar-recurrence disabled>`:''}<button type="submit" class="bq-secondary-button">Add event</button></form>`;
      const monthGrid=`<section class="bq-calendar-month" aria-labelledby="calendar-month-title"><div class="bq-calendar-month-header"><button type="button" class="bq-secondary-button bq-calendar-month-nav" data-calendar-month-prev aria-label="Previous month">‹</button><h2 id="calendar-month-title">${esc(monthLabel(monthCursor))}</h2><button type="button" class="bq-secondary-button bq-calendar-month-nav" data-calendar-month-next aria-label="Next month">›</button></div><div class="bq-calendar-weekdays" aria-hidden="true">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=>`<span>${day}</span>`).join('')}</div><div class="bq-calendar-month-grid" role="grid" aria-labelledby="calendar-month-title">${monthCells(monthCursor,eventsByDate)}</div><div class="bq-calendar-month-legend" aria-label="Event color legend"><span><i class="bq-calendar-month-dot bq-calendar-month-dot--personal" aria-hidden="true"></i>Personal</span><span><i class="bq-calendar-month-dot bq-calendar-month-dot--assignment" aria-hidden="true"></i>Assignment</span><span><i class="bq-calendar-month-dot bq-calendar-month-dot--congregation" aria-hidden="true"></i>Congregation</span></div></section>`;
      host.innerHTML=`<div class="bq-calendar-intro"><div><p class="bq-eyebrow">CALENDAR</p><h1>Calendar</h1><p>Personal reminders, assignment due dates${state.congregationName?` and ${esc(state.congregationName)} events`:''} in one place. ${state.scope==='account-cloud'?'Signed-in: your personal events sync across devices.':'Guest: personal events stay on this device only.'}</p></div>${calendarIcon('planner','hero')}</div>${message?`<p class="bq-form-message" role="status">${esc(message)}</p>`:''}${form}${monthGrid}<h2 class="bq-calendar-agenda-title">Next 30 days</h2>${agenda.length?agenda.map(day=>`<section class="bq-panel bq-calendar-day"><p class="bq-eyebrow">${esc(fmt(day.date))}</p>${day.events.map(event=>{const ownsShared=event.source==='congregation'&&state.accountUserId&&event.ownerId===state.accountUserId&&!isOccurrence(event.id);const actions=`${event.source==='personal'?`<button type="button" class="bq-secondary-button" data-calendar-remove="${esc(event.id)}">Remove</button>`:''}${ownsShared?`<button type="button" class="bq-secondary-button" data-calendar-edit="${esc(event.id)}">Edit</button><button type="button" class="bq-secondary-button" data-calendar-remove-congregation="${esc(event.id)}">Delete</button>`:''}`;return`<article class="bq-calendar-event" data-calendar-event-source="${esc(event.source)}">${calendarIcon(ICON[event.source]||'personal')}<div class="bq-calendar-event-content"><p class="bq-calendar-event-title">${esc(event.title)}</p>${actions?`<div class="bq-calendar-event-actions">${actions}</div>`:''}</div></article>`}).join('')}</section>`).join(''):`<div class="bq-calendar-empty">${calendarIcon('empty','empty')}<p>Nothing in the next 30 days.</p></div>`}<button type="button" class="bq-secondary-button" data-calendar-back>Back</button>`;
      bind();
    };
    const findVisibleEvent=id=>currentState.agenda.flatMap(day=>day.events).find(event=>event.id===id);
    const shiftMonth=delta=>{monthCursor=new Date(monthCursor.getFullYear(),monthCursor.getMonth()+delta,1);render(currentState)};
    const bind=()=>{
      host.querySelector('[data-calendar-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
      host.querySelector('[data-calendar-month-prev]')?.addEventListener('click',()=>shiftMonth(-1),{once:true});
      host.querySelector('[data-calendar-month-next]')?.addEventListener('click',()=>shiftMonth(1),{once:true});
      host.querySelector('[data-calendar-cancel-edit]')?.addEventListener('click',()=>{editing=null;message='';render(currentState)},{once:true});
      host.querySelector('[data-calendar-share]')?.addEventListener('change',event=>{
        const recurrence=host.querySelector('[data-calendar-recurrence]');
        if(recurrence)recurrence.disabled=!event.currentTarget.checked;
      });
      host.querySelector('[data-calendar-add]')?.addEventListener('submit',async event=>{
        event.preventDefault();
        const form=event.currentTarget,title=form.title.value,eventDate=form.eventDate.value;
        try{
          if(editing){
            const next=await calendar.updateCongregationEvent(editing.id,{title,eventDate,recurrenceWeeks:Number(form.recurrenceWeeks?.value||0)});
            editing=null;message='Shared event updated.';render(next);return;
          }
          const shareWithCongregation=Boolean(form.shareWithCongregation?.checked);
          const recurrenceWeeks=shareWithCongregation?Number(form.recurrenceWeeks?.value||0):0;
          const next=await calendar.addEvent({title,eventDate,shareWithCongregation,recurrenceWeeks});
          message=shareWithCongregation?'Event shared with your congregation.':(next.synced?'Event added.':'Added on this device. Cloud sync will retry next time you open Calendar.');
          render(next);
        }
        catch(error){message=error?.message||(editing?'Could not update that event.':'Could not add that event.');render(calendar.getState())}
      });
      host.querySelectorAll('[data-calendar-edit]').forEach(button=>button.addEventListener('click',()=>{
        const next=findVisibleEvent(button.dataset.calendarEdit);if(!next)return;editing=next;message='';render(currentState);
      },{once:true}));
      host.querySelectorAll('[data-calendar-remove-congregation]').forEach(button=>button.addEventListener('click',async()=>{
        try{const id=button.dataset.calendarRemoveCongregation,next=await calendar.removeCongregationEvent(id);if(editing?.id===id)editing=null;message='Shared event deleted.';render(next)}
        catch(error){message=error?.message||'Could not delete that shared event.';render(calendar.getState())}
      },{once:true}));
      host.querySelectorAll('[data-calendar-remove]').forEach(button=>button.addEventListener('click',async()=>{
        const id=button.dataset.calendarRemove;
        const next=await calendar.removeEvent(id);
        message=next.synced?'Event removed.':'Removed on this device. Cloud sync will retry next time you open Calendar.';
        render(next);
      },{once:true}));
    };
    calendar.load().then(state=>{
      const firstDate=state.agenda?.[0]?.date;
      if(firstDate){const parsed=new Date(`${firstDate}T00:00:00`);if(!Number.isNaN(parsed.getTime()))monthCursor=new Date(parsed.getFullYear(),parsed.getMonth(),1)}
      render(state);
    }).catch(()=>render(calendar.getState()));
    return()=>{disposed=true};
  }};
}
