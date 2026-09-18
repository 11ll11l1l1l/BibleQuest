import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

const presets=[
  ['consistency','🔥','Consistency Award'],
  ['scripture-explorer','📖','Scripture Explorer'],
  ['encourager','💛','Encourager'],
  ['journey-finisher','🗺️','Journey Finisher'],
  ['comeback','🌱','Comeback Award'],
  ['group-helper','🤝','Group Helper'],
  ['reflection','💭','Reflection Award'],
  ['most-improved','📈','Most Improved'],
  ['pastor-recognition','🏅','Pastor / Leader Recognition']
];

async function install(page){
  await page.evaluate(async presets=>{
    const {congregationRecognitionPage}=await import('/src/features/congregation-recognition/index.js');
    const rows=presets.map(([code,icon,title],index)=>({id:`r${index}`,displayName:`Member ${index+1}`,awardCode:code,title,note:'',icon,createdAt:'2026-09-16T00:00:00.000Z'}));
    const state={
      authenticated:true,remoteAvailable:true,status:'ready',congregations:[{id:'c1',name:'Harness Church',role:'leader',roleLabel:'Leader'}],
      congregationId:'c1',congregationName:'Harness Church',role:'leader',roleLabel:'Leader',canAward:true,
      members:[{userId:'u1',displayName:'Member One',badges:[{badgeId:'study',icon:'📘',name:'First Study'}]}],
      recognitions:rows,badges:[],presets:presets.map(([code,icon,title])=>({code,icon,title}))
    };
    const recognition={snapshot:()=>state,load:async()=>state,award:async()=>state};
    const root=document.createElement('main');root.id='recognition-art-test-root';document.body.append(root);
    const def=congregationRecognitionPage({recognition,onBack:()=>{},onAccount:()=>{},onLeaderboards:()=>{}});
    root.innerHTML=def.html;const cleanup=def.mount(root);
    window.__removeRecognitionArtHarness=()=>{cleanup?.();root.remove()};
  },presets);
}

async function inspect(width,height,isMobile=false){
  const page=await browser.newPage({viewport:{width,height},isMobile,hasTouch:isMobile});
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(BASE,{waitUntil:'networkidle'});await install(page);
  const root=page.locator('#recognition-art-test-root');
  await root.locator('[data-recognition-row]').first().waitFor();
  const result=await page.evaluate(()=>{
    const scope=document.querySelector('#recognition-art-test-root');
    const arts=[...scope.querySelectorAll('[data-recognition-art]')].map(node=>({symbol:node.dataset.recognitionArt,hidden:node.getAttribute('aria-hidden'),use:node.querySelector('use')?.getAttribute('href')}));
    const glyphs=[...scope.querySelectorAll('[data-recognition-glyph]')].map(node=>({code:node.dataset.recognitionGlyph,hidden:node.getAttribute('aria-hidden'),text:node.textContent}));
    const rows=[...scope.querySelectorAll('[data-recognition-row]')].map(node=>node.innerText);
    const options=[...scope.querySelectorAll('select[name="award_code"] option')].map(node=>node.textContent.trim());
    const controls=[...scope.querySelectorAll('button,select,input,textarea')];
    return{arts,glyphs,rows,options,innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))};
  });
  assert(result.arts.length===5,`Expected five genuine Recognition assets at ${width}px, got ${result.arts.length}.`);
  assert(result.glyphs.length===4,`Expected four reviewed unmatched Recognition glyphs at ${width}px, got ${result.glyphs.length}.`);
  const expected=new Map([['streak','consistency'],['chapter','scripture-explorer'],['growth','comeback'],['progress','most-improved'],['badge','pastor-recognition']]);
  for(const art of result.arts){assert(expected.has(art.symbol),`Unexpected Recognition symbol ${art.symbol}.`);assert(art.hidden==='true',`Recognition symbol ${art.symbol} must be decorative.`);assert(art.use===`assets/progress-feature-icons.svg#${art.symbol}`,`Recognition symbol ${art.symbol} points to the wrong asset.`)}
  for(const glyph of result.glyphs){assert(['encourager','journey-finisher','group-helper','reflection'].includes(glyph.code),`Unexpected unmatched Recognition glyph ${glyph.code}.`);assert(glyph.hidden==='true',`Unmatched Recognition glyph ${glyph.code} must be decorative.`)}
  for(const title of presets.map(row=>row[2]))assert(result.rows.some(text=>text.includes(title)),`Visible Recognition title disappeared: ${title}`);
  assert(result.options.length===9,'Recognition award selector lost presets.');
  for(const title of presets.map(row=>row[2]))assert(result.options.includes(title),`Text-only award option missing: ${title}`);
  assert(!result.options.some(text=>/[🔥📖💛🗺🌱🤝💭📈🏅]/u.test(text)),'Award selector still relies on decorative preset emoji.');
  assert(result.scrollWidth<=result.innerWidth+1,`Recognition artwork overflow at ${width}px: ${result.scrollWidth}px > ${result.innerWidth}px.`);
  assert(result.minTarget>=44,`Recognition control target below 44px at ${width}px.`);
  assert(errors.length===0,`Recognition artwork page errors at ${width}px: ${errors.join(' | ')}`);
  await page.evaluate(()=>window.__removeRecognitionArtHarness());await page.close();
}

try{await inspect(1280,900,false);await inspect(390,844,true);console.log('BibleQuest V5 Recognition artwork browser proof passed.')}finally{await browser.close()}
