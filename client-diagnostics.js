(() => {
  'use strict';
  const VERSION='pwa-v74-runtime-recovery';const sent=new Map();
  const account=()=>window.BQAccount,client=()=>account()?.client?.(),session=()=>account()?.session?.();
  function redact(text=''){return String(text).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]').replace(/https?:\/\/\S+/gi,'[url]').replace(/[A-F0-9]{24,}/gi,'[token]').slice(0,1800)}
  function surface(){const open=[...document.querySelectorAll('[id$="Layer"]:not(.hidden),.modern-sheet:not(.hidden)')].at(-1);return (open?.id||open?.className||location.pathname||'BibleQuest').toString().slice(0,120)}
  async function report(message,stack='',context={}){const c=client(),s=session();if(!c||!s?.user)return;const safe=redact(message),key=safe.slice(0,240),last=sent.get(key)||0;if(Date.now()-last<60000)return;sent.set(key,Date.now());let congregationId=null;try{congregationId=window.BQCloud?.status?.()?.activeCongregation?.id||null}catch{}const row={user_id:s.user.id,congregation_id:congregationId,app_version:VERSION,surface:surface(),message:safe,stack:redact(stack).slice(0,3000)||null,context:{kind:context.kind||'runtime',path:location.pathname}};await c.from('bible_client_errors').insert(row).catch(()=>{})}
  window.addEventListener('error',e=>{const msg=e.error?.message||e.message||'Unknown client error';report(msg,e.error?.stack||'',{kind:'error'}).catch(()=>{})});
  window.addEventListener('unhandledrejection',e=>{const r=e.reason,msg=r?.message||String(r||'Unhandled rejection');report(msg,r?.stack||'',{kind:'promise'}).catch(()=>{})});
  window.BQDiagnostics={report,version:VERSION};
})();