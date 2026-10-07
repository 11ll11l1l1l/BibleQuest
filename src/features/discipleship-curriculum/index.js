import { localization } from '../../app/localization.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COPY = {
  en:{title:'Assigned lessons',loading:'Loading assigned lessons…',empty:'No lessons have been assigned yet.',error:'This assigned path is unavailable. Check your account and congregation, then reload.',changed:'Account or congregation changed. Reload assigned lessons.',reload:'Reload',back:'Back',account:'Account',congregation:'Choose congregation'},
  tl:{title:'Mga nakatalagang aralin',loading:'Nilo-load ang mga nakatalagang aralin…',empty:'Wala pang nakatalagang aralin.',error:'Hindi mabuksan ang nakatalagang landas. Suriin ang account at kongregasyon, saka i-load muli.',changed:'Nagbago ang account o kongregasyon. I-load muli ang mga aralin.',reload:'I-load muli',back:'Bumalik',account:'Account',congregation:'Pumili ng kongregasyon'},
  ceb:{title:'Gitudlo nga mga leksyon',loading:'Gi-load ang gitudlo nga mga leksyon…',empty:'Wala pay gitudlo nga mga leksyon.',error:'Dili maablihan ang gitudlo nga agianan. Susiha ang account ug kongregasyon, unya i-load pag-usab.',changed:'Nausab ang account o kongregasyon. I-load pag-usab ang mga leksyon.',reload:'I-load pag-usab',back:'Balik',account:'Account',congregation:'Pagpili og kongregasyon'},
};
export function assignedPath(tracks, {view,trackId,moduleId}) {
  if(view==='track'&&!trackId)return {title:null,rows:tracks,kind:'track'};
  const track=tracks.find(row=>row.id===trackId);
  if(!track)throw new Error('Assigned track unavailable.');
  if(view==='track')return {title:track.title,rows:track.modules,kind:'module'};
  const module=track.modules.find(row=>row.id===moduleId);
  if(view!=='module'||!module)throw new Error('Assigned module unavailable.');
  return {title:module.title,rows:module.lessons,kind:'lesson'};
}
export function assignedCurriculumPage({service,view,pairId,trackId='',moduleId='',isContextReady=()=>false,subscribeContext,onNavigate,onBack,onAccount,onCongregation}) {
  const t=key=>escape(localization.t(key,{dictionaries:COPY}));
  return {title:localization.t('title',{dictionaries:COPY}),html:`<section class="bq-panel" data-assigned-curriculum><h1>${t('title')}</h1><p role="status" aria-live="polite" data-assigned-status></p><div data-assigned-rows></div><button type="button" data-assigned-action="reload">${t('reload')}</button><button type="button" data-assigned-action="back">${t('back')}</button><button type="button" data-assigned-action="account">${t('account')}</button><button type="button" data-assigned-action="congregation">${t('congregation')}</button></section>`,mount(root){
    const page=root.querySelector('[data-assigned-curriculum]'),status=page.querySelector('[data-assigned-status]'),host=page.querySelector('[data-assigned-rows]');
    let generation=0,disposed=false,path=null;
    async function load(){
      const token=++generation;path=null;host.innerHTML='';status.textContent=localization.t('loading',{dictionaries:COPY});
      try{
        const tracks=await service.loadCurriculum(pairId);
        if(disposed||token!==generation)return;
        path=assignedPath(tracks,{view,trackId,moduleId});
        status.textContent=path.rows.length?'':localization.t('empty',{dictionaries:COPY});
        host.innerHTML=`${path.title?`<h2>${escape(path.title)}</h2>`:''}<ul>${path.rows.map((row,index)=>`<li><button type="button" data-assigned-index="${index}">${escape(row.title)}</button></li>`).join('')}</ul>`;
      }catch{if(!disposed&&token===generation){path=null;host.innerHTML='';status.textContent=localization.t('error',{dictionaries:COPY});}}
    }
    const click=event=>{
      const button=event.target.closest?.('button');if(!button||disposed)return;
      const action=button.getAttribute('data-assigned-action');
      if(action==='reload')void load();if(action==='back')onBack();if(action==='account')onAccount();if(action==='congregation')onCongregation();
      if(!button.hasAttribute('data-assigned-index')||!path)return;
      const row=path.rows[Number(button.getAttribute('data-assigned-index'))];if(!row)return;
      onNavigate(path.kind==='track'?{routeKey:'one-to-one-track',pairId,trackId:row.id}:path.kind==='module'?{routeKey:'one-to-one-module',pairId,trackId,moduleId:row.id}:{routeKey:'one-to-one-lesson',pairId,trackId,moduleId,revisionId:row.revisionId});
    };
    page.addEventListener('click',click);
    const unsubscribe=subscribeContext(()=>{generation++;path=null;host.innerHTML='';status.textContent=localization.t('changed',{dictionaries:COPY});if(isContextReady())void load();});
    void load();
    return()=>{disposed=true;generation++;path=null;unsubscribe();page.removeEventListener('click',click);};
  }};
}
