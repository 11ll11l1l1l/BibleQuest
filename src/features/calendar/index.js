const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const fmt=iso=>{const d=new Date(`${iso}T00:00:00`);return Number.isNaN(d.getTime())?iso:d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})};
const ICON={assignment:'assignment',congregation:'congregation',personal:'personal'};
const SOURCE_LABEL={assignment:'Assignment',congregation:'Congregation',personal:'Personal'};
const WEEKDAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const calendarIcon=(id,variant='event')=>`<span class="bq-calendar-icon-wrap bq-calendar-icon-wrap--${variant}" aria-hidden="true"><svg class="bq-calendar-icon bq-calendar-icon--${variant}" viewBox="0 0 24 24" focusable="false"><use href="assets/calendar-feature-icons.svg#${id}"></use></svg></span>`;
const isOccurrence=id=>/:occurrence-\d+$/.test(String(id||''));
const isoDate=date=>date.toISOString().slice(0,10);
const monthStart=date=>new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1));
const addUtcDays=(date,days)=>{const next=new Date(date);next.setUTCDate(next.getUTCDate()+days);return next};
const addUtcMonths=(date,months)=>new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+months,1));
const gridStartFor=date=>addUtcDays(monthStart(date),-monthStart(date).getUTCDay());
const monthLabel=date=>date.toLocaleDateString(undefined,{month:'long',year:'numeric',timeZone:'UTC'});
const dayNumber=iso=>Number(iso.slice(8,10));

export function calendarPage({calendar,onBack,onAccount}={}){
  return{title:'Calendar',html:'<section class="bq-panel" data-calendar-page></section>',mount(root){
    const host=root.querySelector('[data-calendar-page]');let message='',editing=null,currentState=calendar.getState(),disposed=false;
    const now=new Date();
    let viewedMonth=monthStart(new Date(Date.UTC(now.getFullYear(),now.getMonth(),1)));
    let selectedDate=isoDate(new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())));
    const monthAgenda=()=>{
      const start=gridStartFor(viewedMonth);
      return calendar.getAgenda?.({startDate:start,days:42})||currentState.agenda||[];
    };
    const monthAgendaMap=()=>new Map(monthAgenda().map(day=>[day.date,day.events]));
    const renderMonth=()=>{
      const start=gridStartFor(viewedMonth),byDate=monthAgendaMap(),activeMonth=viewedMonth.getUTCMonth();
      const cells=Array.from({length:42},(_,index)=>{
        const date=addUtcDays(start,index),key=isoDate(date),events=byDate.get(key)||[],outside=date.getUTCMonth()!==activeMonth,isSelected=key===selectedDate;
        const summaries=events.slice(0,3).map(event=>`<span class="bq-calendar-grid-event" data-source="${esc(event.source)}">${calendarIcon(ICON[event.source]||'personal','grid')}<span><strong>${esc(SOURCE_LABEL[event.source]||'Personal')}:</strong> ${esc(event.title)}</span></span>`).join('');
        const more=events.length>3?`<span class="bq-calendar-grid-more">+${events.length-3} more</span>`:'';
        const eventSummary=events.length?`${events.length} event${events.length===1?'':'s'}: ${events.map(event=>`${SOURCE_LABEL[event.source]||'Personal'} ${event.title}`).join('; ')}`:'No events';
        return`<button type="button" class="bq-calendar-grid-day${outside?' is-outside':''}${isSelected?' is-selected':''}" data-calendar-day="${key}" aria-pressed="${isSelected?'true':'false'}" aria-label="${esc(`${fmt(key)}. ${eventSummary}`)}"><span class="bq-calendar-grid-number">${dayNumber(key)}</span><span class="bq-calendar-grid-events">${summaries}${more}</span></button>`;
      }).join('');
      return`<section class="bq-calendar-month" aria-label="Month calendar"><div class="bq-calendar-month-toolbar"><button type="button" class="bq-secondary-button" data-calendar-month-prev aria-label="Previous month">‹</button><h2 aria-live="polite">${esc(monthLabel(viewedMonth))}</h2><button type="button" class="bq-secondary-button" data-calendar-today>Today</button><button type="button" class="bq-secondary-button" data-calendar-month-next aria-label="Next month">›</button></div><div class="bq-calendar-legend" aria-label="Calendar categories"><span>${calendarIcon('assignment','grid')} Assignment</span><span>${calendarIcon('congregation','grid')} Congregation</span><span>${calendarIcon('personal','grid')} Personal</span></div><div class="bq-calendar-weekdays" aria-hidden="true">${WEEKDAYS.map(day=>`<span>${day}</span>`).join('')}</div><div class="bq-calendar-grid" role="grid" aria-label="${esc(monthLabel(viewedMonth))}">${cells}</div></section>`;
    };
    const selectedDay=()=>monthAgendaMap().get(selectedDate)||[];
    const renderSelectedDay=()=>{
      const events=selectedDay();
      return`<section class="bq-panel bq-calendar-selected" aria-label="Selected day"><p class="bq-eyebrow">SELECTED DAY</p><h2>${esc(fmt(selectedDate))}</h2>${events.length?events.map(event=>`<div class="bq-calendar-selected-event" data-source="${esc(event.source)}">${calendarIcon(ICON[event.source]||'personal')}<span><strong>${esc(SOURCE_LABEL[event.source]||'Personal')}</strong> · ${esc(event.title)}</span></div>`).join(''):'<p>No events on this day. Choose Add event below to plan something.</p>'}</section>`;
    };
    const render=state=>{
      if(disposed)return;currentState=state;
      const agenda=state.agenda;
      const form=editing?`<form data-calendar-add><p class="bq-eyebrow">EDIT SHARED EVENT</p><input type="text" name="title" aria-label="Event title" placeholder="Event title" maxlength="120" value="${esc(editing.title)}" required><input type="date" name="eventDate" aria-label="Event date" value="${esc(editing.date)}" required><label>Repeat weekly for extra weeks <input type="number" name="recurrenceWeeks" min="0" max="52" value="${Number(editing.recurrenceWeeks)||0}" data-calendar-recurrence></label><button type="submit" class="bq-secondary-button">Save changes</button><button type="button" class="bq-secondary-button" data-calendar-cancel-edit>Cancel</button></form>`:`<form data-calendar-add><input type="text" name="title" aria-label="Event title" placeholder="Event title" maxlength="120" required><input type="date" name="eventDate" aria-label="Event date" value="${esc(selectedDate)}" required>${state.canShareWithCongregation?`<label><input type="checkbox" name="shareWithCongregation" data-calendar-share> Share with ${esc(state.congregationName||'congregation')} (leaders only)</label><input type="number" name="recurrenceWeeks" min="0" max="52" value="0" title="Repeat weekly for this many extra weeks" data-calendar-recurrence disabled>`:''}<button type="submit" class="bq-secondary-button">Add event</button></form>`;
      host.innerHTML=`<div class="bq-calendar-intro"><div><p class="bq-eyebrow">CALENDAR</p><h1>Month planner</h1><p>Personal reminders, assignment due dates${state.congregationName?` and ${esc(state.congregationName)} events`:''} in one calendar. ${state.scope==='account-cloud'?'Signed-in: your personal events sync across devices.':'Guest: personal events stay on this device only.'}</p></div>${calendarIcon('planner','hero')}</div>${message?`<p class="bq-form-message" role="status">${esc(message)}</p>`:''}${renderMonth()}${renderSelectedDay()}${form}<section class="bq-calendar-agenda" aria-label="Next 30 days"><h2>Next 30 days</h2>${agenda.length?agenda.map(day=>`<section class="bq-panel bq-calendar-day"><p class="bq-eyebrow">${esc(fmt(day.date))}</p>${day.events.map(event=>{const ownsShared=event.source==='congregation'&&state.accountUserId&&event.ownerId===state.accountUserId&&!isOccurrence(event.id);const actions=`${event.source==='personal'?`<button type="button" class="bq-secondary-button" data-calendar-remove="${esc(event.id)}">Remove</button>`:''}${ownsShared?`<button type="button" class="bq-secondary-button" data-calendar-edit="${esc(event.id)}">Edit</button><button type="button" class="bq-secondary-button" data-calendar-remove-congregation="${esc(event.id)}">Delete</button>`:''}`;return`<article class="bq-calendar-event" data-calendar-event-source="${esc(event.source)}">${calendarIcon(ICON[event.source]||'personal')}<div class="bq-calendar-event-content"><p class="bq-calendar-event-title"><span class="bq-calendar-source-label">${esc(SOURCE_LABEL[event.source]||'Personal')}</span>${esc(event.title)}</p>${actions?`<div class="bq-calendar-event-actions">${actions}</div>`:''}</div></article>`}).join('')}</section>`).join(''):`<div class="bq-calendar-empty">${calendarIcon('empty','empty')}<p>Nothing in the next 30 days.</p></div>`}</section><button type="button" class="bq-secondary-button" data-calendar-back>Back</button>`;
      bind();
    };
    const findVisibleEvent=id=>[...monthAgenda(),...(currentState.agenda||[])].flatMap(day=>day.events).find(event=>event.id===id);
    const bind=()=>{
      host.querySelector('[data-calendar-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
      host.querySelector('[data-calendar-month-prev]')?.addEventListener('click',()=>{viewedMonth=addUtcMonths(viewedMonth,-1);selectedDate=isoDate(viewedMonth);render(currentState)},{once:true});
      host.querySelector('[data-calendar-month-next]')?.addEventListener('click',()=>{viewedMonth=addUtcMonths(viewedMonth,1);selectedDate=isoDate(viewedMonth);render(currentState)},{once:true});
      host.querySelector('[data-calendar-today]')?.addEventListener('click',()=>{const today=new Date();viewedMonth=monthStart(new Date(Date.UTC(today.getFullYear(),today.getMonth(),1)));selectedDate=isoDate(new Date(Date.UTC(today.getFullYear(),today.getMonth(),today.getDate())));render(currentState)},{once:true});
      host.querySelectorAll('[data-calendar-day]').forEach(button=>button.addEventListener('click',()=>{selectedDate=button.dataset.calendarDay;render(currentState);host.querySelector('[name="eventDate"]')?.focus()},{once:true}));
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
            editing=null;message='Shared event updated.';selectedDate=eventDate;viewedMonth=monthStart(new Date(`${eventDate}T00:00:00Z`));render(next);return;
          }
          const shareWithCongregation=Boolean(form.shareWithCongregation?.checked);
          const recurrenceWeeks=shareWithCongregation?Number(form.recurrenceWeeks?.value||0):0;
          const next=await calendar.addEvent({title,eventDate,shareWithCongregation,recurrenceWeeks});
          message=shareWithCongregation?'Event shared with your congregation.':(next.synced?'Event added.':'Added on this device. Cloud sync will retry next time you open Calendar.');
          selectedDate=eventDate;viewedMonth=monthStart(new Date(`${eventDate}T00:00:00Z`));render(next);
        }
        catch(error){message=error?.message||(editing?'Could not update that event.':'Could not add that event.');render(calendar.getState())}
      });
      host.querySelectorAll('[data-calendar-edit]').forEach(button=>button.addEventListener('click',()=>{
        const next=findVisibleEvent(button.dataset.calendarEdit);if(!next)return;editing=next;selectedDate=next.date;viewedMonth=monthStart(new Date(`${next.date}T00:00:00Z`));message='';render(currentState);
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
    calendar.load().then(render).catch(()=>render(calendar.getState()));
    return()=>{disposed=true};
  }};
}