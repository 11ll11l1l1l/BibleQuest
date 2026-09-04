const PRIMARY_ORIGIN='https://079b159e.biblequest-7th.pages.dev';
const ALLOWED_ORIGINS=new Set([PRIMARY_ORIGIN,'https://11ll11l1l1l.github.io']);
function headers(req:Request){const origin=req.headers.get('Origin')||'';const allow=ALLOWED_ORIGINS.has(origin)?origin:PRIMARY_ORIGIN;return {'Access-Control-Allow-Origin':allow,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Vary':'Origin'}}
Deno.serve((req:Request)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:headers(req)});return new Response(JSON.stringify({error:'One-time recovery codes are retired. Use the Supabase Auth password-reset email flow.'}),{status:410,headers:headers(req)})});
