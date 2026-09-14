import { localization } from '../../app/localization.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const localeTag=locale=>locale==='tl'?'fil-PH':'en-US';
const fmt=(iso,locale)=>{const d=new Date(`${iso}T00:00:00`);return Number.isNaN(d.getTime())?iso:d.toLocaleDateString(localeTag(locale),{weekday:'short',month:'short',day:'numeric'})};
const ICON={assignment:'assignment',congregation:'congregation',personal:'personal'};
const SOURCE_KEY={assignment:'calendar.source.assignment',congregation:'calendar.source.congregation',personal:'calendar.source.personal'};
const WEEKDAY_KEYS=['calendar.weekday.sun','calendar.weekday.mon','calendar.weekday.tue','calendar.weekday.wed','calendar.weekday.thu','calendar.weekday.fri','calendar.weekday.sat'];
const calendarIcon=(id,variant='event')=>`<span class="bq-calendar-icon-wrap bq-calendar-icon-wrap--${variant}" aria-hidden="true"><svg class="bq-calendar-icon bq-calendar-icon--${variant}" viewBox="0 0 24 24" focusable="false"><use href="assets/calendar-feature-icons.svg#${id}"></use></svg></span>`;
const isOccurrence=id=>/:occurrence-\d+$/.test(String(id||''));
const isoDate=date=>date.toISOString().slice(0,10);
const monthStart=date=>new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1));
const addUtcDays=(date,days)=>{const next=new Date(date);next.setUTCDate(next.getUTCDate()+days);return next};
const addUtcMonths=(date,months)=>new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+months,1));
const gridStartFor=date=>addUtcDays(monthStart(date),-monthStart(date).getUTCDay());
const monthLabel=(date,locale)=>date.toLocaleDateString(localeTag(locale),{month:'long',year:'numeric',timeZone:'UTC'});
const dayNumber=iso=>Number(iso.slice(8,10));

export function calendarPage({calendar,onBack,onAccount}={}){
  const locale=localization.getLocale();
  const tx=(key,values)=>localization.t(key,{locale,values});
  const sourceLabel=source=>tx(SOURCE_KEY[source]||'calendar.source.personal');
  return{title:tx('nav.calendar'),html:'<section class="bq-panel" data-calendar-page></section>',mount(root){
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
        const summaries=events.slice(0,3).map(event=>`<span class="bq-calendar-grid-event" data-source="${esc(event.source)}">${calendarIcon(ICON[event.source]||'personal','grid')}<span><strong>${esc(sourceLabel(event.source))}:</strong> ${esc(event.title)}</span></span>`).join('');
        const more=events.length>3?`<span class="bq-calendar-grid-more">${esc(tx('calendar.grid.more',{count:events.length-3}))}</span>`:'';
        const details=events.map(event=>`${sourceLabel(event.source)} ${event.title}`).join('; ');
        const eventSummary=events.length?tx(events.length===1?'calendar.grid.eventSummary.one':'calendar.grid.eventSummary.other',{count:events.length,details}):tx('calendar.grid.noEvents');
        return`<button type="button" class="bq-calendar-grid-day${outside?' is-outside':''}${isSelected?' is-selected':''}" data-calendar-day="${key}" aria-pressed="${isSelected?'true':'false'}" aria-label="${esc(`${fmt(key,locale)}. ${eventSummary}`)}"><span class="bq-calendar-grid-number">${dayNumber(key)}</span><span class="bq-calendar-grid-events">${summaries}${more}</span></button>`;
      }).join('');
      return`<section class="bq-calendar-month" aria-label="${esc(tx('calendar.month.aria'))}"><div class="bq-calendar-month-toolbar"><button type="button" class="bq-secondary-button" data-calendar-month-prev aria-label="${esc(tx('calendar.month.previous'))}">‹</button><h2 aria-live="polite">${esc(monthLabel(viewedMonth,locale))}</h2><button type="button" class="bq-secondary-button" data-calendar-today>${esc(tx('calendar.month.today'))}</button><button type="button" class="bq-secondary-button" data-calendar-month-next aria-label="${esc(tx('calendar.month.next'))}">›</button></div><div class="bq-calendar-legend" aria-label="${esc(tx('calendar.categories.aria'))}"><span>${calendarIcon('assignment','grid')} ${esc(tx('calendar.source.assignment'))}</span><span>${calendarIcon('congregation','grid')} ${esc(tx('calendar.source.congregation'))}</span><span>${calendarIcon('personal','grid')} ${esc(tx('calendar.source.personal'))}</span></div><div class="bq-calendar-weekdays" aria-hidden="true">${WEEKDAY_KEYS.map(key=>`<span>${esc(tx(key))}</span>`).join('')}</div><div class="bq-calendar-grid" role="grid" aria-label="${esc(monthLabel(viewedMonth,locale))}">${cells}</div></section>`;
    };
    const selectedDay=()=>monthAgendaMap().get(selectedDate)||[];
    const renderSelectedDay=()=>{
      const events=selectedDay();
      return`<section class="bq-panel bq-calendar-selected" aria-label="${esc(tx('calendar.selected.aria'))}"><p class="bq-eyebrow">${esc(tx('calendar.selected.eyebrow'))}</p><h2>${esc(fmt(selectedDate,locale))}</h2>${events.length?events.map(event=>`<div class="bq-calendar-selected-event" data-source="${esc(event.source)}">${calendarIcon(ICON[event.source]||'personal')}<span><strong>${esc(sourceLabel(event.source))}</strong> · ${esc(event.title)}</span></div>`).join(''):`<p>${esc(tx('calendar.selected.empty'))}</p>`}</section>`;
    };
    const render=state=>{
      if(disposed)return;currentState=state;
      const agenda=state.agenda;
      const form=editing?`<form data-calendar-add><p class="bq-eyebrow">${esc(tx('calendar.form.editEyebrow'))}</p><input type="text" name="title" aria-label="${esc(tx('calendar.form.eventTitle'))}" placeholder="${esc(tx('calendar.form.eventTitle'))}" maxlength="120" value="${esc(editing.title)}" required><input type="date" name="eventDate" aria-label="${esc(tx('calendar.form.eventDate'))}" value="${esc(editing.date)}" required><label>${esc(tx('calendar.form.repeat'))} <input type="number" name="recurrenceWeeks" min="0" max="52" value="${Number(editing.recurrenceWeeks)||0}" data-calendar-recurrence></label><button type="submit" class="bq-secondary-button">${esc(tx('calendar.form.saveChanges'))}</button><button type="button" class="bq-secondary-button" data-calendar-cancel-edit>${esc(tx('common.cancel'))}</button></form>`:`<form data-calendar-add><input type="text" name="title" aria-label="${esc(tx('calendar.form.eventTitle'))}" placeholder="${esc(tx('calendar.form.eventTitle'))}" maxlength="120" required><input type="date" name="eventDate" aria-label="${esc(tx('calendar.form.eventDate'))}" value="${esc(selectedDate)}" required>${state.canShareWithCongregation?`<label><input type="checkbox" name="shareWithCongregation" data-calendar-share> ${esc(tx('calendar.form.share',{congregation:state.congregationName||tx('calendar.source.congregation')}))}</label><input type="number" name="recurrenceWeeks" min="0" max="52" value="0" title="${esc(tx('calendar.form.repeatTitle'))}" data-calendar-recurrence disabled>`:''}<button type="submit" class="bq-secondary-button">${esc(tx('calendar.form.addEvent'))}</button></form>`;
      const congregationPart=state.congregationName?tx('calendar.intro.congregationPart',{congregation:state.congregationName}):'';
      host.innerHTML=`<div class="bq-calendar-intro"><div><p class="bq-eyebrow">${esc(tx('calendar.intro.eyebrow'))}</p><h1>${esc(tx('calendar.intro.heading'))}</h1><p>${esc(tx('calendar.intro.description',{congregationPart}))} ${esc(tx(state.scope==='account-cloud'?'calendar.intro.signedIn':'calendar.intro.guest'))}</p></div>${calendarIcon('planner','hero')}</div>${message?`<p class="bq-form-message" role="status">${esc(message)}</p>`:''}${renderMonth()}${renderSelectedDay()}${form}<section class="bq-calendar-agenda" aria-label="${esc(tx('calendar.agenda.aria'))}"><h2>${esc(tx('calendar.agenda.heading'))}</h2>${agenda.length?agenda.map(day=>`<section class="bq-panel bq-calendar-day"><p class="bq-eyebrow">${esc(fmt(day.date,locale))}</p>${day.events.map(event=>{const ownsShared=event.source==='congregation'&&state.accountUserId&&event.ownerId===state.accountUserId&&!isOccurrence(event.id);const actions=`${event.source==='personal'?`<button type="button" class="bq-secondary-button" data-calendar-remove="${esc(event.id)}">${esc(tx('calendar.action.remove'))}</button>`:''}${ownsShared?`<button type="button" class="bq-secondary-button" data-calendar-edit="${esc(event.id)}">${esc(tx('calendar.action.edit'))}</button><button type="button" class="bq-secondary-button" data-calendar-remove-congregation="${esc(event.id)}">${esc(tx('calendar.action.delete'))}</button>`:''}`;return`<article class="bq-calendar-event" data-calendar-event-source="${esc(event.source)}">${calendarIcon(ICON[event.source]||'personal')}<div class="bq-calendar-event-content"><p class="bq-calendar-event-title"><span class="bq-calendar-source-label">${esc(sourceLabel(event.source))}</span>${esc(event.title)}</p>${actions?`<div class="bq-calendar-event-actions">${actions}</div>`:''}</div></article>`}).join('')}</section>`).join(''):`<div class="bq-calendar-empty">${calendarIcon('empty','empty')}<p>${esc(tx('calendar.agenda.empty'))}</p></div>`}</section><button type="button" class="bq-secondary-button" data-calendar-back>${esc(tx('common.back'))}</button>`;
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
            editing=null;message=tx('calendar.status.updated');selectedDate=eventDate;viewedMonth=monthStart(new Date(`${eventDate}T00:00:00Z`));render(next);return;
          }
          const shareWithCongregation=Boolean(form.shareWithCongregation?.checked);
          const recurrenceWeeks=shareWithCongregation?Number(form.recurrenceWeeks?.value||0):0;
          const next=await calendar.addEvent({title,eventDate,shareWithCongregation,recurrenceWeeks});
          message=shareWithCongregation?tx('calendar.status.shared'):(next.synced?tx('calendar.status.added'):tx('calendar.status.addedLocal'));
          selectedDate=eventDate;viewedMonth=monthStart(new Date(`${eventDate}T00:00:00Z`));render(next);
        }
        catch(error){message=error?.message||tx(editing?'calendar.error.update':'calendar.error.add');render(calendar.getState())}
      });
      host.querySelectorAll('[data-calendar-edit]').forEach(button=>button.addEventListener('click',()=>{
        const next=findVisibleEvent(button.dataset.calendarEdit);if(!next)return;editing=next;selectedDate=next.date;viewedMonth=monthStart(new Date(`${next.date}T00:00:00Z`));message='';render(currentState);
      },{once:true}));
      host.querySelectorAll('[data-calendar-remove-congregation]').forEach(button=>button.addEventListener('click',async()=>{
        try{const id=button.dataset.calendarRemoveCongregation,next=await calendar.removeCongregationEvent(id);if(editing?.id===id)editing=null;message=tx('calendar.status.deleted');render(next)}
        catch(error){message=error?.message||tx('calendar.error.delete');render(calendar.getState())}
      },{once:true}));
      host.querySelectorAll('[data-calendar-remove]').forEach(button=>button.addEventListener('click',async()=>{
        const id=button.dataset.calendarRemove;
        const next=await calendar.removeEvent(id);
        message=next.synced?tx('calendar.status.removed'):tx('calendar.status.removedLocal');
        render(next);
      },{once:true}));
    };
    calendar.load().then(render).catch(()=>render(calendar.getState()));
    return()=>{disposed=true};
  }};
}