import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const AUTH_ORIGIN='https://zkfmgezvzugchcwppreq.supabase.co';
const STORAGE_KEY='biblequest.v3.auth.sb-zkfmgezvzugchcwppreq-auth-token';
const USER_ID='11111111-2222-4333-8444-555555555555';
const EMAIL='deeplink-probe@example.invalid';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const b64url=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const now=Math.floor(Date.now()/1000);
const token=`${b64url({alg:'HS256',typ:'JWT'})}.${b64url({aud:'authenticated',exp:now+3600,iat:now-5,sub:USER_ID,role:'authenticated'})}.c2ln`;
const user={
  id:USER_ID,
  aud:'authenticated',
  role:'authenticated',
  email:EMAIL,
  email_confirmed_at:new Date((now-60)*1000).toISOString(),
  phone:'',
  confirmed_at:new Date((now-60)*1000).toISOString(),
  last_sign_in_at:new Date((now-60)*1000).toISOString(),
  app_metadata:{provider:'email',providers:['email']},
  user_metadata:{preferred_name:'Deep Link Probe'},
  identities:[],
  created_at:new Date((now-3600)*1000).toISOString(),
  updated_at:new Date((now-60)*1000).toISOString()
};
const session={
  access_token:token,
  refresh_token:'synthetic-refresh-token',
  expires_in:3600,
  expires_at:now+3600,
  token_type:'bearer',
  user
};

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(({storageKey,storedSession})=>{
    localStorage.setItem(storageKey,JSON.stringify(storedSession));
  },{storageKey:STORAGE_KEY,storedSession:session});

  const cors={
    'access-control-allow-origin':'*',
    'access-control-allow-headers':'authorization,apikey,content-type,x-client-info',
    'content-type':'application/json'
  };
  await context.route(`${AUTH_ORIGIN}/auth/v1/user**`,route=>route.fulfill({status:200,headers:cors,body:JSON.stringify(user)}));
  await context.route(`${AUTH_ORIGIN}/rest/v1/**`,route=>route.fulfill({status:200,headers:{...cors,'content-range':'0-0/0'},body:'[]'}));
  await context.route(`${AUTH_ORIGIN}/functions/v1/**`,route=>route.fulfill({status:200,headers:cors,body:'{"ok":true}'}));

  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});

  await page.goto(`${BASE}#/assignments`,{waitUntil:'domcontentloaded'});
  await page.locator('h1').filter({hasText:'Assignments'}).waitFor({timeout:5000});

  await page.waitForFunction(()=>{
    const text=document.querySelector('#bq-view')?.textContent||'';
    return !text.includes('Sign in to receive and complete congregation assignments across your devices.');
  },{timeout:5000});

  const text=(await page.locator('#bq-view').textContent())||'';
  assert(!text.includes('Sign in to receive and complete congregation assignments across your devices.'),'Authenticated deep link remained stuck on the pre-hydration guest card.');
  assert(page.url().includes('#/assignments'),'Session hydration changed the requested deep-link route.');

  const persisted=await page.evaluate(key=>Boolean(localStorage.getItem(key)),STORAGE_KEY);
  assert(persisted,'Synthetic persisted session was unexpectedly cleared during deep-link hydration.');
  assert(errors.length===0,`Unexpected auth deep-link console/page errors: ${errors.join(' | ')}`);

  await context.close();
  console.log('PASS V5 authenticated notification deep-link rehydrates current route.');
}finally{
  await browser.close();
}
