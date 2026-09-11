const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt=iso=>{const d=new Date(`${iso}T00:00:00`);return Number.isNaN(d.getTime())?iso:d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})};
const ICON={assignment:'📌',congregation:'⛪',personal:'🗓️'};

export function calendarPage({calendar,onBack,onAccount}={}){
  return{title:'Calendar',html:'<section class="bq-panel" data-calendar-page></section>',mount(root){
    const host=root.querySelector('[data-calendar-page]');let message='',disposed=false;
    const render=state=>{
      if(disposed)return;
      const agenda=state.agenda;
      host.innerHTML=`<p class="bq-eyebrow">CALENDAR</p><h1>Next 30 days</h1><p>Personal reminders, assignment due dates${state.congregationName?` and ${esc(state.congregationName)} events`:''} in one agenda. ${state.scope==='account-cloud'?'Signed-in: your personal events sync across devices.':'Guest: personal events stay on this device only.'}</p>${message?`<p class="bq-form-message" role="status">${esc(message)}</p>`:''}<form data-calendar-add><input type="text" name="title" placeholder="Event title" maxlength="120" required><input type="date" name="eventDate" required>${state.canShareWithCongregation?`<label><input type="checkbox" name="shareWithCongregation" data-calendar-share> Share with ${esc(state.congregationName||'congregation')} (leaders only)</label><input type="number" name="recurrenceWeeks" min="0" max="52" value="0" title="Repeat weekly for this many extra weeks" data-calendar-recurrence disabled>`:''}<button type="submit" class="bq-secondary-button">Add event</button></form>${agenda.length?agenda.map(day=>`<section class="bq-panel"><p class="bq-eyebrow">${esc(fmt(day.date))}</p>${day.events.map(event=>`<p>${ICON[event.source]||'🗓️'} ${esc(event.title)}${event.source==='personal'?` <button type="button" class="bq-secondary-button" data-calendar-remove="${esc(event.id)}">Remove</button>`:''}</p>`).join('')}</section>`).join(''):'<p>Nothing in the next 30 days.</p>'}<button type="button" class="bq-secondary-button" data-calendar-back>Back</button>`;
      bind();
    };
    const bind=()=>{
      host.querySelector('[data-calendar-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
      host.querySelector('[data-calendar-share]')?.addEventListener('change',event=>{
        const recurrence=host.querySelector('[data-calendar-recurrence]');
        if(recurrence)recurrence.disabled=!event.currentTarget.checked;
      });
      host.querySelector('[data-calendar-add]')?.addEventListener('submit',async event=>{
        event.preventDefault();
        const form=event.currentTarget,title=form.title.value,eventDate=form.eventDate.value;
        const shareWithCongregation=Boolean(form.shareWithCongregation?.checked);
        const recurrenceWeeks=shareWithCongregation?Number(form.recurrenceWeeks?.value||0):0;
        try{
          const next=await calendar.addEvent({title,eventDate,shareWithCongregation,recurrenceWeeks});
          message=shareWithCongregation?'Event shared with your congregation.':(next.synced?'Event added.':'Added on this device. Cloud sync will retry next time you open Calendar.');
          render(next);
        }
        catch(error){message=error?.message||'Could not add that event.';render(calendar.getState())}
      });
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
