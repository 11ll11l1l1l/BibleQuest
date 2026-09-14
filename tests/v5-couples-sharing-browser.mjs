import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base=process.env.BQ_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const browserErrors=[];
page.on('pageerror',error=>browserErrors.push(String(error)));

try{
  await page.goto(`${base}/`,{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async()=>{
    const [{createCouplesCloudService},{couplesCloudPage}]=await Promise.all([
      import('/src/app/couples-cloud.js'),
      import('/src/features/couples-cloud/index.js')
    ]);
    const pair={id:'pair-browser',user_a:'spouse-a',user_b:'spouse-b',status:'active',created_at:'2026-09-13T00:00:00Z',updated_at:'2026-09-13T00:00:00Z'};
    const shared=[];
    let seq=0;
    const sessionFor=userId=>({getState:()=>({authenticated:true,remoteAvailable:true,user:{id:userId}})});
    const apiFor=userId=>({
      async status(){return {pair}},
      async listShared(pairId){return shared.filter(row=>row.pair_id===pairId).map(row=>({...row}))},
      async addShared(rows){for(const row of rows)shared.push({...row,id:`row-${++seq}`,created_at:new Date(Date.UTC(2026,8,13,0,0,seq)).toISOString(),updated_at:null,due_on:null,completed_at:null})}
    });
    const a=createCouplesCloudService({api:apiFor('spouse-a'),session:sessionFor('spouse-a')});
    const b=createCouplesCloudService({api:apiFor('spouse-b'),session:sessionFor('spouse-b')});
    await a.load();await b.load();
    await a.completeJourney(1,'Pray Honestly','A commits to pray with B.');
    await b.refreshShared();
    await b.completeJourney(2,'Listen First','B commits to listen before advising.');
    await a.refreshShared();

    document.body.innerHTML='<main><section id="a"></section><section id="b"></section><section id="privacy"></section></main>';
    const mount=(id,service)=>{const root=document.getElementById(id);const spec=couplesCloudPage({couples:service});root.innerHTML=spec.html;spec.mount(root)};
    mount('a',a);mount('b',b);

    const unpaired={snapshot:()=>({authenticated:true,remoteAvailable:true,pair:null,shared:[],inviteCode:''}),async load(){},async createPair(){},async join(){},async leave(){}};
    mount('privacy',unpaired);
    await new Promise(resolve=>setTimeout(resolve,60));
    const text=id=>document.getElementById(id).innerText;
    return {
      a:text('a'),b:text('b'),privacy:text('privacy'),
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
      aCommitments:[...document.querySelectorAll('#a .bq-couples-cloud-history article p')].map(node=>node.textContent),
      bCommitments:[...document.querySelectorAll('#b .bq-couples-cloud-history article p')].map(node=>node.textContent)
    };
  });

  for(const [label,items] of [['A',result.aCommitments],['B',result.bCommitments]]){
    assert.ok(items.includes('A commits to pray with B.'),`${label} view must show spouse A shared commitment`);
    assert.ok(items.includes('B commits to listen before advising.'),`${label} view must show spouse B shared commitment`);
  }
  assert.match(result.privacy,/Only intentionally shared Couple Journey completions, commitments, and pair-linked couples challenge history belong to the pair\./);
  assert.match(result.privacy,/Private Notes, Transformation results, passwords, and personal account data remain private\./);
  assert.equal(result.overflow,false,'390px Couples verification fixture must not introduce horizontal overflow');
  assert.deepEqual(browserErrors,[],'Couples browser verification must not emit page errors');
  console.log('v5 Couples Journey browser bidirectional-sharing/privacy: PASS');
}finally{
  await browser.close();
}