const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function ministryAnnouncementsPage({announcements,onBack}={}){
  return {title:'Congregation announcements',html:'<section class="bq-community" data-ministry-announcements></section>',mount(root){
    const view=root.querySelector('[data-ministry-announcements]');let disposed=false,busy=false,message='';
    const render=rows=>{
      if(disposed)return;
      const cards=rows.map(row=>`<article class="bq-panel" data-announcement-row><h3>${esc(row.title)}</h3><p>${esc(row.body).replace(/\n/g,'<br>')}</p><small>${esc(row.publishAt?new Date(row.publishAt).toLocaleString():'Recently published')}</small></article>`).join('');
      view.innerHTML=`<div class="bq-community-head"><div><p class="bq-eyebrow">LEADER CENTER</p><h1>Congregation announcements</h1><p>Publish a message for active members of your current congregation.</p></div><button type="button" class="bq-secondary-button" data-announcement-back>Back</button></div>${message?`<p class="bq-form-message" role="status">${esc(message)}</p>`:''}<section class="bq-panel"><h2>Write an announcement</h2><form class="bq-account-form" data-announcement-form><label>Title<input name="title" maxlength="120" minlength="2" required></label><label>Message<textarea name="body" maxlength="6000" rows="6" required></textarea></label><button type="submit" class="bq-primary-button" data-announcement-submit ${busy?'disabled':''}>Publish announcement</button></form></section><section class="bq-panel"><h2>Recent announcements</h2>${cards||'<p>No announcements have been published yet.</p>'}</section>`;
      view.querySelector('[data-announcement-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
      view.querySelector('[data-announcement-form]')?.addEventListener('submit',submit,{once:true});
    };
    async function submit(event){event.preventDefault();if(busy)return;busy=true;const fd=new FormData(event.currentTarget);message='Publishing…';let rows=[];try{await announcements.publish({title:fd.get('title'),body:fd.get('body')});message='Announcement published.';rows=await announcements.list()}catch(error){message=error?.message||'Could not publish this announcement.';try{rows=await announcements.list()}catch{rows=[]}}finally{busy=false;if(!disposed)render(rows)}}
    async function load(){try{render(await announcements.list())}catch(error){message=error?.message||'Could not load announcements.';render([])}}
    void load();return()=>{disposed=true};
  }};
}
