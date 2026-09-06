(() => {
  'use strict';
  let busy=false;
  const account=()=>window.BQAccount,client=()=>account()?.client?.(),session=()=>account()?.session?.();
  const cloud=()=>{try{return JSON.parse(localStorage.getItem('biblequest_cloud_v1')||'{}')}catch{return {}}};
  const cid=()=>cloud().activeCongregationId||'';
  const ensure=(key)=>window.BQRuntimeRecovery?.ensure?.bind(window.BQRuntimeRecovery);
  function notice(text){let n=document.querySelector('.bq-assignment-launch-notice');if(!n){n=document.createElement('div');n.className='bq-assignment-launch-notice';n.style.cssText='position:fixed;z-index:2147482500;left:16px;right:16px;bottom:max(88px,env(safe-area-inset-bottom));max-width:560px;margin:auto;padding:14px 16px;border-radius:16px;background:#fff;color:#243028;box-shadow:0 12px 32px rgba(0,0,0,.22);border:1px solid #d9ddd7;font:inherit';document.body.appendChild(n)}n.textContent=text;setTimeout(()=>n.remove(),5500)}
  async function route(kind,type){
    const k=kind||type||'custom';
    if(k==='reader'||k==='reading'){await window.BQRuntimeRecovery?.ensure?.(()=>window.BQReader?.openLibrary,'reader.js');return window.BQReader.openLibrary()}
    if(k==='guided-study'){await window.BQRuntimeRecovery?.ensure?.(()=>window.BQStudy?.open,'guided-study-expanded.js');return window.BQStudy.open()}
    if(k==='mission'){await window.BQRuntimeRecovery?.ensure?.(()=>window.BQMission?.open,'innovation-suite.js');return window.BQMission.open()}
    if(k==='wisdom'){await window.BQRuntimeRecovery?.ensure?.(()=>document.querySelector('[data-action="situation"]'));return document.querySelector('[data-action="situation"]')?.click()}
    if(k==='journey'){await window.BQRuntimeRecovery?.ensure?.(()=>window.BQJourneyLoop?.open,'journey-loop.js');return window.BQJourneyLoop.open()}
    if(k==='live'){await window.BQRuntimeRecovery?.ensure?.(()=>window.BQLiveRooms?.open,'live-rooms.js');return window.BQLiveRooms.open()}
    if(k==='couples'){await window.BQRuntimeRecovery?.ensure?.(()=>window.BQCoupleCloud?.open,'couple-cloud.js');return window.BQCoupleCloud.open()}
    if(k==='group'){await window.BQRuntimeRecovery?.ensure?.(()=>window.BQJourneyGroups?.open||window.BQGroupPlay?.open,'journey-groups.js');return (window.BQJourneyGroups?.open||window.BQGroupPlay?.open)?.()}
    if(k==='reflection'){if(window.BQNotes?.open)return window.BQNotes.open();throw new Error('Bible Notes is unavailable.')}
    if(k==='quiz'){await window.BQRuntimeRecovery?.ensure?.(()=>window.BQOpenReview?.start,'open-review.js');return window.BQOpenReview.start()}
    notice('This custom assignment has instructions but no linked app activity. Follow the instructions, then return here and mark it complete.');return true;
  }
  async function launch(button){
    if(busy)return;busy=true;try{
      const c=client(),s=session(),congregationId=cid(),id=button.dataset.assignmentStart,type=button.dataset.type||'custom';if(!c||!s||!congregationId||!id)throw new Error('Assignment account or congregation is not ready.');
      const row=await c.from('bible_assignments').select('id,assignment_type,linked_activity').eq('id',id).eq('congregation_id',congregationId).maybeSingle();if(row.error)throw row.error;if(!row.data)throw new Error('Assignment is no longer available.');
      const start=await c.functions.invoke('bq-assignment',{body:{action:'start',congregationId,assignmentId:id}});if(start.error)throw start.error;
      account()?.track?.('leader_assignment','started',{assignment_id:id,assignment_type:row.data.assignment_type||type,linked_activity:row.data.linked_activity||{}}).catch?.(()=>{});
      const kind=String(row.data.linked_activity?.kind||'').trim();if(kind||type!=='custom'){document.getElementById('bqAssignmentLayer')?.classList.add('hidden');document.body.classList.remove('completion-open')}
      await route(kind,row.data.assignment_type||type);
    }catch(err){window.BQDiagnostics?.report?.(`Assignment launch failed: ${err?.message||err}`,'',{kind:'assignment-launch'}).catch?.(()=>{});notice(err?.message||String(err))}finally{busy=false}
  }
  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-assignment-start]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();launch(b)},true);
  window.BQAssignmentLaunchHardening={launch};
})();