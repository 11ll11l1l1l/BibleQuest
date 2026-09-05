(() => {
  'use strict';
  const nativeFetch=window.fetch.bind(window);
  const STORAGE='biblequest_content_policy_v2';
  const CLOUD='biblequest_cloud_v1';
  const registry=new Map();
  let memory={congregationId:'',rows:[],at:0};

  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
  function hash(s=''){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
  const genericKey=(text,ref='')=>`entry:${hash(`${normalize(text)}|${normalize(ref)}`)}`;
  const packCode=input=>{const url=typeof input==='string'?input:input?.url||'';return url.match(/(?:^|\/)data\/packs\/questions\/([A-Z0-9]+)\.json(?:[?#].*)?$/i)?.[1]?.toUpperCase()||''};
  const activeCongregationId=()=>window.BQCloud?.status?.().activeCongregation?.id||(()=>{try{return JSON.parse(localStorage.getItem(CLOUD)||'{}').activeCongregationId||''}catch{return ''}})();
  const signedIn=()=>Boolean(window.BQCloud?.status?.().signedIn||window.BQAccount?.session?.()?.user);
  const client=()=>window.BQAccount?.client?.()||window.BQ_SUPABASE_CLIENT||null;

  function cached(congregationId){try{const all=JSON.parse(localStorage.getItem(STORAGE)||'{}');const row=all[congregationId];return Array.isArray(row?.rows)?row:null}catch{return null}}
  function cache(congregationId,rows){try{const all=JSON.parse(localStorage.getItem(STORAGE)||'{}');all[congregationId]={rows,at:Date.now()};localStorage.setItem(STORAGE,JSON.stringify(all))}catch{}}
  async function waitClient(){let c=client();for(let i=0;i<8&&!c;i++){await new Promise(r=>setTimeout(r,100));c=client()}return c}

  async function loadPolicy(congregationId,force=false){
    if(!congregationId||!signedIn())return [];
    if(!force&&memory.congregationId===congregationId&&Date.now()-memory.at<60000)return memory.rows;
    const fallback=cached(congregationId);
    try{
      const c=await waitClient();if(!c)throw new Error('cloud client unavailable');
      const request=c.from('bible_content_decisions').select('content_key,decision,content_type,origin,content_ref,content_snapshot,rationale,updated_at').eq('congregation_id',congregationId).limit(4000);
      const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('moderation policy timeout')),1600));
      const result=await Promise.race([request,timeout]);if(result.error)throw result.error;
      const rows=result.data||[];memory={congregationId,rows,at:Date.now()};cache(congregationId,rows);return rows;
    }catch(_err){const rows=fallback?.rows||[];memory={congregationId,rows,at:Date.now()};return rows}
  }

  const policyMap=rows=>new Map((rows||[]).map(r=>[r.content_key,r]));
  const blocked=d=>['exempt','remove','delete'].includes(d?.decision);
  function revisedSnapshot(d){const s=d?.content_snapshot||{};return s.revised&&typeof s.revised==='object'?{...s,...s.revised}:s}
  function applyRevision(row,d){
    if(!d||d.decision!=='include')return row;
    const s=revisedSnapshot(d),next={...row};
    const q=s.question??s.q??s.text,a=s.answer??s.a??s.payload?.answer,r=s.ref??s.reference??d.content_ref;
    if(typeof q==='string'&&q.trim())next.q=q.trim();
    if(typeof a==='string'&&a.trim())next.a=a.trim();
    if(typeof r==='string'&&r.trim())next.r=r.trim().replace(/^[A-Za-z0-9 ]+\s+(?=\d+:)/,'');
    next.safety={...(next.safety||{}),originalAction:next.safety?.originalAction||next.safety?.action||'allow',action:'allow',moderationOverride:'include',ministryRevised:Boolean(s.revised||s.edited_at||s.edited)};
    return next;
  }
  function register(code,rows){for(const row of rows||[]){if(!row?.q)continue;const key=`question:${code}:${row.id}`;const meta={key,contentType:'question',ref:row.r||row.ref||'',answer:row.a||row.answer||'',source:`question-pack:${code}`,row};registry.set(normalize(row.q),meta)}}

  async function applyPack(response,code){
    if(!response.ok)return response;
    let rows;try{rows=await response.clone().json()}catch{return response}if(!Array.isArray(rows))return response;
    register(code,rows);
    const congregationId=activeCongregationId();if(!congregationId||!signedIn())return response;
    const decisions=policyMap(await loadPolicy(congregationId));
    const next=[];
    for(const row of rows){const d=decisions.get(`question:${code}:${row.id}`);if(blocked(d))continue;next.push(applyRevision(row,d))}
    const includes=[...decisions.entries()].filter(([key,d])=>d.decision==='include'&&key.startsWith(`question:${code}:`));
    if(includes.length){
      try{
        const q=await nativeFetch(`data/quarantine/questions/${encodeURIComponent(code)}.json`,{cache:'no-store'});
        if(q.ok){const quarantined=await q.json();const have=new Set(next.map(r=>String(r.id)));for(const row of Array.isArray(quarantined)?quarantined:[]){const key=`question:${code}:${row.id}`,d=decisions.get(key);if(d?.decision!=='include'||have.has(String(row.id)))continue;next.push(applyRevision({...row,safety:{...(row.safety||{}),originalAction:row.safety?.action||'quarantine',action:'allow',moderationOverride:'include'}},d));have.add(String(row.id))}}
      }catch(_err){}
    }
    register(code,next);
    return new Response(JSON.stringify(next),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json; charset=utf-8'}});
  }

  window.fetch=async function bibleQuestModeratedFetch(input,init){const code=packCode(input);const response=await nativeFetch(input,init);return code?applyPack(response,code):response};

  async function applyCore(){
    if(!Array.isArray(window.BQ_QUESTIONS))return;
    const congregationId=activeCongregationId();if(!congregationId||!signedIn())return;
    const decisions=policyMap(await loadPolicy(congregationId)),next=[];
    for(const row of window.BQ_QUESTIONS){const key=`question:core:${row.id}`,d=decisions.get(key);registry.set(normalize(row.q),{key,contentType:'question',ref:row.ref||'',answer:row.a||row.answer||'',source:'core-question',row});if(blocked(d))continue;next.push(applyRevision(row,d))}
    window.BQ_QUESTIONS=next;register('core',next);
  }
  document.addEventListener('load',e=>{const t=e.target;if(t instanceof HTMLScriptElement&&/data\/questions\.js(?:[?#]|$)/.test(t.src))queueMicrotask(()=>applyCore().catch(()=>{}))},true);
  if(Array.isArray(window.BQ_QUESTIONS))applyCore().catch(()=>{});

  function resolve(text,ref=''){
    const exact=registry.get(normalize(text));if(exact)return exact;
    return {key:genericKey(text,ref),contentType:/\?$/.test(String(text||'').trim())?'question':'statement',ref,answer:'',source:'screen-entry',row:null};
  }
  function getDecision(key){return memory.rows.find(r=>r.content_key===key)||null}
  function decisionFor(key){return getDecision(key)?.decision||''}
  async function refresh(){memory={congregationId:'',rows:[],at:0};const id=activeCongregationId();if(id&&signedIn())await loadPolicy(id,true);await applyCore().catch(()=>{});window.dispatchEvent(new CustomEvent('bq-content-policy-refreshed'))}
  window.addEventListener('bq-cloud-board-change',()=>refresh().catch(()=>{}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&signedIn())refresh().catch(()=>{})});
  window.BQContentModeration={resolve,decisionFor,getDecision,loadPolicy,refresh,activeCongregationId,genericKey,diagnostics:()=>({congregationId:memory.congregationId,decisions:memory.rows.length,registry:registry.size})};
})();
