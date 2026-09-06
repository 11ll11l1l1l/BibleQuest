import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function installHarness(page){
  await page.evaluate(async()=>{
    const [{createAudioManager},{createRecordingsService},{createMediaLibraryService},{mediaLibraryPage}]=await Promise.all([
      import('/src/app/audio.js'),import('/src/app/recordings.js'),import('/src/app/media-library.js'),import('/src/features/media-library/index.js')
    ]);
    window.__removeMediaHarness?.();
    const audio=createAudioManager();let mediaCalls=0;
    const media={async listLiveRecordings(){mediaCalls++;return[
      {id:'media-1',youtube_id:'abcDEF12345',title:'Sunday Worship',description:'Worship replay',featured:true},
      {id:'media-2',youtube_id:'ZyxWV987654',title:'Wednesday Bible Study',description:'Study replay',featured:false}
    ]}};
    const session={isAuthenticated:()=>true};
    const recordings=createRecordingsService({media,audio,session});
    const library=createMediaLibraryService({recordings});
    const root=document.createElement('div');root.id='media-library-test-root';document.body.append(root);
    const definition=mediaLibraryPage({library,onHome:()=>{},onAccount:()=>{}});root.innerHTML=definition.html;const cleanup=definition.mount(root);
    window.__mediaHarness={library,get mediaCalls(){return mediaCalls}};
    window.__removeMediaHarness=()=>{cleanup?.();recordings.dispose();root.remove();delete window.__mediaHarness};
  });
}

async function desktop(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>mock player</title>'}));
  let supabase=0;page.on('request',request=>{if(request.url().includes('supabase.co'))supabase++});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-open-media]').click();await page.waitForURL(/#\/media$/);await page.locator('h1',{hasText:'Sign in to browse congregation media'}).waitFor();
  assert(supabase===0,'Guest Media Library route must not contact Supabase.');

  await installHarness(page);const root=page.locator('#media-library-test-root');await root.locator('[data-media-open]').first().waitFor();
  assert(await root.locator('[data-media-open]').count()===2,'Media Library did not browse two published items.');
  assert(await page.evaluate(()=>window.__mediaHarness.mediaCalls)===1,'Media Library should load the shared media list once on mount.');
  await root.locator('[data-media-view="featured"]').click();assert(await root.locator('[data-media-open]').count()===1,'Featured Media Library filter failed.');
  await root.locator('[data-media-view="all"]').click();assert(await root.locator('[data-media-open]').count()===2,'All Media Library filter failed to restore rows.');
  await root.locator('[data-media-search]').fill('Bible Study');await root.locator('[data-media-search]').blur();assert(await root.locator('[data-media-open]').count()===1,'Media Library search failed.');
  await root.locator('[data-media-search]').fill('');await root.locator('[data-media-search]').blur();assert(await root.locator('[data-media-open]').count()===2,'Clearing Media Library search failed.');

  await root.locator('[data-media-open="media-1"]').click();await root.locator('iframe[data-bq-audio-player]').waitFor();
  assert(await root.locator('iframe[data-bq-audio-player]').count()===1,'Opening library media must create exactly one shared player.');
  assert((await root.locator('iframe[data-bq-audio-player]').getAttribute('src')).includes('abcDEF12345'),'Media Library opened the wrong source.');
  await root.locator('[data-media-play]').click();await root.locator('[data-media-message]',{hasText:'Playing'}).waitFor();
  await root.locator('[data-media-pause]').click();await root.locator('[data-media-message]',{hasText:'Paused'}).waitFor();
  await root.locator('[data-media-seek-value]').fill('60');await root.locator('[data-media-seek]').click();await root.locator('[data-media-message]',{hasText:'Seek requested'}).waitFor();
  await root.locator('[data-media-stop]').click();await root.locator('[data-media-message]',{hasText:'Stopped'}).waitFor();
  await root.locator('[data-media-close-item]').click();assert(await root.locator('iframe[data-bq-audio-player]').count()===0,'Back to library must tear down the shared player.');
  await root.locator('[data-media-open="media-2"]').click();await page.waitForFunction(()=>document.querySelector('#media-library-test-root iframe[data-bq-audio-player]')?.src.includes('ZyxWV987654'));
  assert(await root.locator('iframe[data-bq-audio-player]').count()===1,'Reopening another media item created duplicate players.');
  assert(await page.evaluate(()=>window.__mediaHarness.library.getPlayerCount())===1,'Media Library reports more than one shared player.');
  await page.evaluate(()=>window.__removeMediaHarness());assert(await page.locator('#media-library-test-root iframe[data-bq-audio-player]').count()===0,'Leaving Media Library leaked playback.');
  await installHarness(page);const reopened=page.locator('#media-library-test-root');await reopened.locator('[data-media-open]').first().waitFor();assert(await reopened.locator('[data-media-open]').count()===2,'Returning to Media Library failed to restore a clean browse view.');
  await page.evaluate(()=>window.__removeMediaHarness());await page.close();
}

async function mobile(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>mock player</title>'}));
  await page.goto(BASE,{waitUntil:'networkidle'});await installHarness(page);const root=page.locator('#media-library-test-root');await root.locator('[data-media-open]').first().waitFor();await root.locator('[data-media-open="media-1"]').click();await root.locator('iframe[data-bq-audio-player]').waitFor();
  const metrics=await page.evaluate(()=>{const scope=document.querySelector('#media-library-test-root');const controls=[...scope.querySelectorAll('button,input')];return{innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))}});
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Media Library mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,'Media Library mobile control target is below 44px.');assert(await root.locator('iframe[data-bq-audio-player]').count()===1,'Mobile Media Library must keep one shared player.');
  await page.evaluate(()=>window.__removeMediaHarness());await page.close();
}

try{await desktop();await mobile();console.log('BibleQuest v3 Media Library browser regression passed.')}finally{await browser.close()}
