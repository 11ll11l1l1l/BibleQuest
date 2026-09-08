import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(condition,message)=>{if(!condition)throw new Error(message)};
async function run(){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${BASE}#/journey-groups`,{waitUntil:'networkidle'});await page.locator('[data-journey-groups-view]').waitFor();assert(((await page.locator('[data-journey-groups-view]').textContent())||'').includes('Journey Groups are disabled in local preview'),'Local-preview route must fail safely.');
 await page.evaluate(async()=>{
   const {journeyGroupsPage}=await import('/src/features/journey-groups/index.js');const host=document.querySelector('#bq-view');
   let groups=[{id:'g1',name:'Faith Group',description:'Weekly study',scheduleText:'Wednesday',maxMembers:6,memberCount:2,role:'member',isLeader:false,canLeave:true}],inviteCode='';
   const congregations=[{id:'c1',name:'Test Church',role:'leader',roleLabel:'Leader',canCreate:true}];
   const svc={snapshot:()=>({authenticated:true,remoteAvailable:true,groups:groups.slice(),congregations,inviteCode,inviteGroupId:''}),async load(){return this.snapshot()},async join(code){groups.push({id:'g3',name:'Joined Group',description:'',scheduleText:'',maxMembers:4,memberCount:1,role:'member',isLeader:false,canLeave:true});return this.snapshot()},async create(p){groups.push({id:'g2',name:p.name,description:p.description,scheduleText:p.scheduleText,maxMembers:p.maxMembers,memberCount:1,role:'leader',isLeader:true,canLeave:false});inviteCode='ABCD2345';return this.snapshot()},async rotateCode(){inviteCode='ZXCV6789';return this.snapshot()},async leave(id){groups=groups.filter(g=>g.id!==id);return this.snapshot()}};
   const view=journeyGroupsPage({journeyGroups:svc,onAccount:()=>{},onBack:()=>{}});host.innerHTML=view.html;window.__bqJgCleanup=view.mount(host);
 });
 await page.locator('[data-journey-group="g1"]').waitFor();
 await page.locator('[data-journey-groups-join] input').fill('ABCD2345');await page.locator('[data-journey-groups-join] button').click();await page.locator('[data-journey-group="g3"]').waitFor();
 await page.locator('[data-journey-groups-create] input[name="name"]').fill('Leader Group');await page.locator('[data-journey-groups-create] textarea[name="description"]').fill('Weekly group');await page.locator('[data-journey-groups-create] button').click();await page.locator('[data-journey-group="g2"]').waitFor();assert(((await page.locator('.bq-journey-group-code').textContent())||'').includes('ABCD2345'),'Create must reveal returned group code.');
 await page.locator('[data-journey-group-code="g2"]').click();await page.waitForFunction(()=>document.body.textContent.includes('ZXCV6789'));
 page.once('dialog',d=>d.accept());await page.locator('[data-journey-group-leave="g1"]').click();await page.locator('[data-journey-group="g1"]').waitFor({state:'detached'});
 const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-journey-groups-view] button')].map(n=>n.getBoundingClientRect().height))}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Journey Groups mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Journey Groups touch target below 44px: ${metrics.minTarget}px.`);
 await page.evaluate(()=>window.__bqJgCleanup?.());assert(errors.length===0,`Unexpected Journey Groups console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Journey Groups browser regression passed.')}finally{await browser.close()}
