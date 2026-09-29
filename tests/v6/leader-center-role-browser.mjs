import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const AUTH_ORIGIN='https://zkfmgezvzugchcwppreq.supabase.co';
const STORAGE_KEY='biblequest.v3.auth.sb-zkfmgezvzugchcwppreq-auth-token';
const USER_ID='11111111-2222-4333-8444-555555555555';
const ROLES=['member','leader','pastor','admin'];
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const b64url=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const now=Math.floor(Date.now()/1000);

function sessionFor(role){
  const token=`${b64url({alg:'HS256',typ:'JWT'})}.${b64url({aud:'authenticated',exp:now+3600,iat:now-5,sub:USER_ID,role:'authenticated'})}.c2ln`;
  const user={id:USER_ID,aud:'authenticated',role:'authenticated',email:`${role}-probe@example.invalid`,email_confirmed_at:new Date((now-60)*1000).toISOString(),phone:'',confirmed_at:new Date((now-60)*1000).toISOString(),last_sign_in_at:new Date((now-60)*1000).toISOString(),app_metadata:{provider:'email',providers:['email']},user_metadata:{preferred_name:`${role} probe`},identities:[],created_at:new Date((now-3600)*1000).toISOString(),updated_at:new Date((now-60)*1000).toISOString()};
  return {access_token:token,refresh_token:'synthetic-refresh-token',expires_in:3600,expires_at:now+3600,token_type:'bearer',user};
}

const browser=await chromium.launch({headless:true});
try{
  const cors={'access-control-allow-origin':'*','access-control-allow-headers':'authorization,apikey,content-type,x-client-info','content-type':'application/json'};
  const observations=[];
  for(const role of ROLES){
    const congregationId=`church-${role}`;
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await context.addInitScript(({storageKey,storedSession})=>localStorage.setItem(storageKey,JSON.stringify(storedSession)),{storageKey:STORAGE_KEY,storedSession:sessionFor(role)});
    await context.route(`${AUTH_ORIGIN}/auth/v1/user**`,route=>route.fulfill({status:200,headers:cors,body:JSON.stringify(sessionFor(role).user)}));
    await context.route(`${AUTH_ORIGIN}/rest/v1/**`,async route=>{
      const request=route.request(),url=new URL(request.url()),table=url.pathname.split('/').pop();
      let body=[];
      if(table==='bible_congregation_members')body=[{congregation_id:congregationId,user_id:USER_ID,role,display_name:`${role} probe`,active:true,joined_at:'2026-01-01T00:00:00.000Z'}];
      else if(table==='bible_congregations')body=[{id:congregationId,name:`Church ${role}`,timezone:'Asia/Tokyo',owner_id:USER_ID,active:true}];
      else if(url.pathname.endsWith('/rpc/bible_presence_active_count'))body=0;
      if(table==='bible_assignments')observations.push({role,table,query:url.search});
      await route.fulfill({status:200,headers:{...cors,'content-range':`0-${Array.isArray(body)?Math.max(body.length-1,0):0}/${Array.isArray(body)?body.length:1}`},body:JSON.stringify(body)});
    });
    await context.route(`${AUTH_ORIGIN}/functions/v1/**`,async route=>{
      const body=route.request().postDataJSON?.()||{};
      const response=body.action==='lifecycle'?{assignments:[]}:body.action==='targets'?{members:[],groups:[],teams:[]}:{ok:true};
      await route.fulfill({status:200,headers:cors,body:JSON.stringify(response)});
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
    await page.goto(`${BASE}#/leader-center`,{waitUntil:'domcontentloaded'});
    await page.locator('[data-leader-center-view] h1').waitFor({timeout:10000});
    if(role==='member'){
      await page.locator('[data-leader-center-denied]').waitFor({timeout:10000});
      assert(!(await page.locator('[data-leader-overview]').count()),'Member unexpectedly received the Leader Center overview.');
    }else{
      try{await page.locator('[data-leader-overview]').waitFor({timeout:10000})}catch(error){throw new Error(`${role} Leader Center did not render its authorized overview. Page text: ${(await page.locator('body').innerText()).slice(-1800)}. Browser errors: ${errors.join(' | ')}. Assignment observations: ${JSON.stringify(observations)}. Original: ${error.message}`)}
      const viewText=(await page.locator('[data-leader-overview]').textContent())||'';
      assert(viewText.includes(role),`${role} was not shown as the authorized active-congregation role.`);
    }
    assert(errors.length===0,`${role} role browser errors: ${errors.join(' | ')}`);
    await context.close();
  }
  for(const role of ROLES){
    const query=observations.find(item=>item.role===role)?.query||'';
    assert(query.includes(`congregation_id=eq.church-${role}`),`${role} assignment read was not scoped to its congregation: ${query}`);
  }
  console.log('PASS V6 built-artifact Leader Center Member/Leader/Pastor/Admin route-role matrix (synthetic auth; no backend RLS claim).');
}finally{
  await browser.close();
}
