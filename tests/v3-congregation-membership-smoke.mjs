import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/congregation`,{waitUntil:'networkidle'});
  await page.locator('[data-congregation-view]').waitFor();
  const guestText=(await page.locator('[data-congregation-view]').textContent())||'';
  assert(guestText.includes('Sign in to view or join a congregation.'),'Signed-out congregation route must fail safely into sign-in guidance.');

  await page.evaluate(async()=>{
    const {congregationPage}=await import('/src/features/congregation/index.js');
    const host=document.querySelector('#bq-view');
    let rows=[{congregationId:'c1',userId:'u1',role:'member',roleKnown:true,roleLabel:'Member',displayName:'Mark',joinedAt:null,congregation:{id:'c1',name:'ICAC Test Church',timezone:'Asia/Tokyo',ownerId:'u2'}}];
    const membership={
      isAuthenticated:()=>true,
      async load(){return rows.slice()},
      async join(code){if(String(code).replace(/[^A-Za-z0-9]/g,'').length<5)throw new Error('Enter a valid congregation invite code.');rows=[...rows,{congregationId:'c2',userId:'u1',role:'facilitator',roleKnown:true,roleLabel:'Facilitator',displayName:'Mark',joinedAt:null,congregation:{id:'c2',name:'Joined Test Church',timezone:'Asia/Tokyo',ownerId:'u3'}}];return rows.slice()}
    };
    const view=congregationPage({membership,onAccount:()=>{},onBack:()=>{}});host.innerHTML=view.html;window.__bqMembershipCleanup=view.mount(host);
  });
  await page.locator('[data-congregation-row="c1"]').waitFor();
  assert((await page.locator('[data-congregation-row="c1"]').textContent())?.includes('Role: Member'),'Membership screen must display the recovered role.');
  await page.locator('[data-congregation-join] input[name="invite_code"]').fill('ab-cd23');
  await page.locator('[data-congregation-join] button[type="submit"]').click();
  await page.locator('[data-congregation-row="c2"]').waitFor();
  const joinedText=(await page.locator('[data-congregation-row="c2"]').textContent())||'';
  assert(joinedText.includes('Joined Test Church')&&joinedText.includes('Role: Facilitator'),'Successful join must render server-returned membership/role data.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-congregation-view] button')].map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Congregation membership mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,`Congregation membership touch target below 44px: ${metrics.minTarget}px.`);
  await page.evaluate(()=>window.__bqMembershipCleanup?.());
  assert(errors.length===0,`Unexpected congregation membership console/page errors: ${errors.join(' | ')}`);
  await page.close();
}
try{await run();console.log('BibleQuest v3 congregation membership browser regression passed.')}finally{await browser.close()}
