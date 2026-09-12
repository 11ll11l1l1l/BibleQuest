import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function installHarness(page,{allowAdd=true}={}){
  await page.evaluate(async(allowAdd)=>{
    const [{createAudioManager},{createRecordingsService},{recordingsPage}]=await Promise.all([
      import('/src/app/audio.js'),import('/src/app/recordings.js'),import('/src/features/recordings/index.js')
    ]);
    window.__removeRecordingHarness?.();
    const audio=createAudioManager();
    let mediaCalls=0,createCalls=0;
    const media={
      async listLiveRecordings(){mediaCalls++;return[
        {id:'rec-1',youtube_id:'abcDEF12345',title:'Sunday Worship',description:'Worship replay',featured:true},
        {id:'rec-2',youtube_id:'ZyxWV987654',title:'Bible Study',description:'Study replay',featured:false}
      ]},
      async createVideo(payload){
        createCalls++;
        if(!allowAdd){throw new Error('new row violates row-level security policy for table "bible_media_library"');}
        return {id:'rec-3',...payload};
      },
      async updateVideo(){throw new Error('not used in this harness')}
    };
    const session={getState:()=>({authenticated:true,user:{id:'u1'}}),isAuthenticated:()=>true};
    const congregation={load:async()=>[{congregationId:'c1'}]};
    const recordings=createRecordingsService({media,audio,session,congregation});
    const root=document.createElement('div');root.id='recordings-test-root';document.body.append(root);
    const definition=recordingsPage({recordings,onHome:()=>{},onAccount:()=>{}});root.innerHTML=definition.html;
    const cleanup=definition.mount(root);
    window.__recordingHarness={recordings,get mediaCalls(){return mediaCalls},get createCalls(){return createCalls}};
    window.__removeRecordingHarness=()=>{cleanup?.();root.remove();delete window.__recordingHarness};
  },allowAdd);
}

async function desktop(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>mock player</title>'}));
  let supabase=0;page.on('request',request=>{if(request.url().includes('supabase.co'))supabase++});
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-open-recordings]').click();await page.waitForURL(/#\/recordings$/);
  await page.locator('h1',{hasText:'Sign in to view congregation videos'}).waitFor();
  assert(supabase===0,'Guest Videos route must not contact Supabase.');

  await installHarness(page);
  const root=page.locator('#recordings-test-root');
  await root.locator('[data-video-select]').first().waitFor();
  assert(await root.locator('[data-video-select]').count()===2,'Videos harness did not load two valid rows.');
  assert(await page.evaluate(()=>window.__recordingHarness.mediaCalls)===1,'Video list should load exactly once on initial mount.');

  // No custom play/pause/seek buttons anywhere - YouTube's own iframe
  // controls are the only playback controls, once a video is selected.
  for (const selector of ['[data-recording-play]','[data-recording-pause]','[data-recording-stop]','[data-recording-seek]']) {
    assert(await root.locator(selector).count()===0,`Videos page must not render the retired custom control: ${selector}`);
  }
  assert(await root.locator('iframe[data-bq-audio-player]').count()===0,'No player should exist before a video is selected.');

  await root.locator('[data-video-select="rec-1"]').click();
  await root.locator('iframe[data-bq-audio-player]').waitFor();
  assert(await root.locator('iframe[data-bq-audio-player]').count()===1,'Selecting a video must create exactly one player iframe (single-player Audio owner).');
  assert((await root.locator('iframe[data-bq-audio-player]').getAttribute('src')).includes('abcDEF12345'),'First video loaded the wrong player source.');
  assert(await root.locator('[data-video-select="rec-1"].is-selected').count()===1,'Selected video card must show a selected state.');

  await root.locator('[data-video-select="rec-2"]').click();
  await page.waitForFunction(()=>document.querySelector('#recordings-test-root iframe[data-bq-audio-player]')?.src.includes('ZyxWV987654'));
  assert(await root.locator('iframe[data-bq-audio-player]').count()===1,'Switching videos must not create duplicate player instances.');
  assert(await page.evaluate(()=>window.__recordingHarness.recordings.getPlayerCount())===1,'Audio owner reports more than one active player.');

  // Curation: leader/pastor/admin path.
  await root.locator('[data-video-curator-toggle]').click();
  await root.locator('[data-video-add-form]').waitFor();
  await root.locator('input[name="title"]').fill('New Bible Study');
  await root.locator('input[name="youtubeUrl"]').fill('https://www.youtube.com/watch?v=abcdefghijk');
  await root.locator('form[data-video-add-form] button[type="submit"]').click();
  await root.locator('[data-video-message]',{hasText:'Video added.'}).waitFor();
  assert(await page.evaluate(()=>window.__recordingHarness.createCalls)===1,'Submitting the add-video form must call the API boundary exactly once.');
  assert(await page.evaluate(()=>window.__recordingHarness.mediaCalls)===2,'Adding a video must reload the list from the server, not just splice it in client-side.');

  await page.evaluate(()=>window.__removeRecordingHarness());
  assert(await page.locator('#recordings-test-root iframe[data-bq-audio-player]').count()===0,'Leaving the feature failed to tear down the player.');
  await installHarness(page);const reopened=page.locator('#recordings-test-root');await reopened.locator('[data-video-select]').first().waitFor();
  await reopened.locator('[data-video-select="rec-1"]').click();await reopened.locator('iframe[data-bq-audio-player]').waitFor();
  assert(await reopened.locator('iframe[data-bq-audio-player]').count()===1,'Returning to Videos did not create one clean player instance.');
  await page.evaluate(()=>window.__removeRecordingHarness());
  await page.close();
}

async function deniedCuration(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>mock player</title>'}));
  await page.goto(BASE,{waitUntil:'networkidle'});
  await installHarness(page,{allowAdd:false});
  const root=page.locator('#recordings-test-root');
  await root.locator('[data-video-select]').first().waitFor();
  await root.locator('[data-video-curator-toggle]').click();
  await root.locator('input[name="title"]').fill('Should be rejected');
  await root.locator('input[name="youtubeUrl"]').fill('https://www.youtube.com/watch?v=zzzzzzzzzzz');
  await root.locator('form[data-video-add-form] button[type="submit"]').click();
  await root.locator('[data-video-message]',{hasText:'leaders, pastors, and admins'}).waitFor();
  assert(await root.locator('[data-video-select]').count()===2,'A rejected add must not appear in the list.');
  await page.evaluate(()=>window.__removeRecordingHarness());
  await page.close();
}

async function mobile(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>mock player</title>'}));
  await page.goto(BASE,{waitUntil:'networkidle'});await installHarness(page);
  const root=page.locator('#recordings-test-root');await root.locator('[data-video-select]').first().waitFor();await root.locator('[data-video-select="rec-1"]').click();await root.locator('iframe[data-bq-audio-player]').waitFor();
  const metrics=await page.evaluate(()=>{const scope=document.querySelector('#recordings-test-root');const controls=[...scope.querySelectorAll('button,input')];return{innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))}});
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Videos mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,'Videos mobile control target is below 44px.');
  assert(await root.locator('iframe[data-bq-audio-player]').count()===1,'Mobile Videos page must keep one player.');
  await page.evaluate(()=>window.__removeRecordingHarness());await page.close();
}

try{await desktop();await deniedCuration();await mobile();console.log('BibleQuest v3 Videos (formerly Live Recordings) browser regression passed.')}finally{await browser.close()}
