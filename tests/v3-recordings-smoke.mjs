import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function installHarness(page){
  await page.evaluate(async()=>{
    const [{createAudioManager},{createRecordingsService},{recordingsPage}]=await Promise.all([
      import('/src/app/audio.js'),import('/src/app/recordings.js'),import('/src/features/recordings/index.js')
    ]);
    window.__removeRecordingHarness?.();
    const audio=createAudioManager();
    let mediaCalls=0;
    const media={async listLiveRecordings(){mediaCalls++;return[
      {id:'rec-1',youtube_id:'abcDEF12345',title:'Sunday Worship',description:'Worship replay',featured:true},
      {id:'rec-2',youtube_id:'ZyxWV987654',title:'Bible Study',description:'Study replay',featured:false}
    ]}};
    const session={isAuthenticated:()=>true};
    const recordings=createRecordingsService({media,audio,session});
    const root=document.createElement('div');root.id='recordings-test-root';document.body.append(root);
    const definition=recordingsPage({recordings,onHome:()=>{},onAccount:()=>{}});root.innerHTML=definition.html;
    const cleanup=definition.mount(root);
    window.__recordingHarness={recordings,get mediaCalls(){return mediaCalls}};
    window.__removeRecordingHarness=()=>{cleanup?.();root.remove();delete window.__recordingHarness};
  });
}

async function desktop(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>mock player</title>'}));
  let supabase=0;page.on('request',request=>{if(request.url().includes('supabase.co'))supabase++});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-open-recordings]').click();await page.waitForURL(/#\/recordings$/);
  await page.locator('h1',{hasText:'Sign in to view congregation recordings'}).waitFor();
  assert(supabase===0,'Guest Live Recordings route must not contact Supabase.');

  await installHarness(page);
  const root=page.locator('#recordings-test-root');
  await root.locator('[data-recording-select]').first().waitFor();
  assert(await root.locator('[data-recording-select]').count()===2,'Recordings harness did not load two valid rows.');
  assert(await page.evaluate(()=>window.__recordingHarness.mediaCalls)===1,'Recordings list should load exactly once on initial mount.');

  await root.locator('[data-recording-select="rec-1"]').click();
  await root.locator('iframe[data-bq-audio-player]').waitFor();
  assert(await root.locator('iframe[data-bq-audio-player]').count()===1,'Selecting a recording must create exactly one player iframe.');
  assert((await root.locator('iframe[data-bq-audio-player]').getAttribute('src')).includes('abcDEF12345'),'First recording loaded the wrong player source.');
  await root.locator('[data-recording-play]').click();await root.locator('[data-recording-message]',{hasText:'Playing'}).waitFor();
  await root.locator('[data-recording-pause]').click();await root.locator('[data-recording-message]',{hasText:'Paused'}).waitFor();
  await root.locator('[data-recording-seek-value]').fill('45');await root.locator('[data-recording-seek]').click();await root.locator('[data-recording-message]',{hasText:'Seek requested'}).waitFor();
  await root.locator('[data-recording-stop]').click();await root.locator('[data-recording-message]',{hasText:'Stopped'}).waitFor();

  await root.locator('[data-recording-select="rec-2"]').click();
  await page.waitForFunction(()=>document.querySelector('#recordings-test-root iframe[data-bq-audio-player]')?.src.includes('ZyxWV987654'));
  assert(await root.locator('iframe[data-bq-audio-player]').count()===1,'Switching recordings created duplicate player instances.');
  assert(await page.evaluate(()=>window.__recordingHarness.recordings.getPlayerCount())===1,'Audio owner reports more than one active player.');

  await page.evaluate(()=>window.__removeRecordingHarness());
  assert(await page.locator('#recordings-test-root iframe[data-bq-audio-player]').count()===0,'Leaving the feature failed to tear down the player.');
  await installHarness(page);const reopened=page.locator('#recordings-test-root');await reopened.locator('[data-recording-select]').first().waitFor();
  await reopened.locator('[data-recording-select="rec-1"]').click();await reopened.locator('iframe[data-bq-audio-player]').waitFor();
  assert(await reopened.locator('iframe[data-bq-audio-player]').count()===1,'Returning to Live Recordings did not create one clean player instance.');
  await page.evaluate(()=>window.__removeRecordingHarness());
  await page.close();
}

async function mobile(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>mock player</title>'}));
  await page.goto(BASE,{waitUntil:'networkidle'});await installHarness(page);
  const root=page.locator('#recordings-test-root');await root.locator('[data-recording-select]').first().waitFor();await root.locator('[data-recording-select="rec-1"]').click();await root.locator('iframe[data-bq-audio-player]').waitFor();
  const metrics=await page.evaluate(()=>{const scope=document.querySelector('#recordings-test-root');const controls=[...scope.querySelectorAll('button,input')];return{innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))}});
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Live Recordings mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,'Live Recordings mobile control target is below 44px.');
  assert(await root.locator('iframe[data-bq-audio-player]').count()===1,'Mobile Live Recordings must keep exactly one player.');
  await page.evaluate(()=>window.__removeRecordingHarness());await page.close();
}

try{await desktop();await mobile();console.log('BibleQuest v3 Live Recordings browser regression passed.')}finally{await browser.close()}
