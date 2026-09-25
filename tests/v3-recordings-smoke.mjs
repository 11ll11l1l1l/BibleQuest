import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function installHarness(page,{allowAdd=true}={}){
  await page.evaluate(async(allowAdd)=>{
    const [{createRecordingsMediaRuntime},{createRecordingsService},{recordingsPage}]=await Promise.all([
      import('/src/v6/media/recordings-runtime.ts'),import('/src/app/recordings.js'),import('/src/features/recordings/index.js')
    ]);
    window.__removeRecordingHarness?.();
    class FakeYouTubePlayer{
      constructor(element,options={}){
        this.element=typeof element==='string'?document.getElementById(element):element;
        this.frame=document.createElement('iframe');
        this.frame.dataset.bqMediaPlayer='1';
        this.element.append(this.frame);
        this.events=options.events||{};
        queueMicrotask(()=>this.events.onReady?.({target:this}));
      }
      cueVideoById(input){this.frame.dataset.videoId=String(input?.videoId||'')}
      loadVideoById(input){this.frame.dataset.videoId=String(input?.videoId||'')}
      playVideo(){}
      pauseVideo(){}
      stopVideo(){}
      seekTo(){}
      destroy(){this.frame.remove()}
    }
    window.YT={Player:FakeYouTubePlayer};
    const mediaRuntime=createRecordingsMediaRuntime({visibilityTarget:null,pageTarget:null,enableVisibilityLifecycle:false,playerReadyTimeoutMs:1000});
    const audio=mediaRuntime.audio;
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
    window.__recordingHarness={recordings,mediaRuntime,get mediaCalls(){return mediaCalls},get createCalls(){return createCalls}};
    window.__removeRecordingHarness=()=>{cleanup?.();recordings.dispose();root.remove();delete window.__recordingHarness;delete window.YT};
  },allowAdd);
}

async function desktop(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>mock player</title>'}));
  let supabase=0;page.on('request',request=>{if(request.url().includes('supabase.co'))supabase++});
  await page.goto(BASE,{waitUntil:'networkidle'});
  // Home now also carries a separate "latest completed service" auto-surface
  // tile (data-home-latest-service) that shares the same navigation hook -
  // that is someone else's in-progress feature, not this test's concern.
  // Scope to the general Videos tile (data-home-recordings) specifically.
  await page.locator('[data-home-recordings] [data-open-recordings]').click();await page.waitForURL(/#\/recordings$/);
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
  assert(await root.locator('iframe[data-bq-media-player]').count()===0,'No player should exist before a video is selected.');

  await root.locator('[data-video-select="rec-1"]').click();
  await root.locator('iframe[data-bq-media-player]').waitFor();
  assert(await root.locator('iframe[data-bq-media-player]').count()===1,'Selecting a video must create exactly one player iframe (single-player V6 Media owner).');
  assert((await root.locator('iframe[data-bq-media-player]').getAttribute('data-video-id'))==='abcDEF12345','First video loaded the wrong player source.');
  assert(await root.locator('[data-video-select="rec-1"].is-selected').count()===1,'Selected video card must show a selected state.');

  await root.locator('[data-video-select="rec-2"]').click();
  await page.waitForFunction(()=>document.querySelector('#recordings-test-root iframe[data-bq-media-player]')?.dataset.videoId==='ZyxWV987654');
  assert(await root.locator('iframe[data-bq-media-player]').count()===1,'Switching videos must not create duplicate player instances.');
  assert(await page.evaluate(()=>window.__recordingHarness.recordings.getPlayerCount())===1,'V6 Media owner reports more than one active player.');

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
  assert(await page.locator('#recordings-test-root iframe[data-bq-media-player]').count()===0,'Leaving the feature failed to tear down the player.');
  await installHarness(page);const reopened=page.locator('#recordings-test-root');await reopened.locator('[data-video-select]').first().waitFor();
  await reopened.locator('[data-video-select="rec-1"]').click();await reopened.locator('iframe[data-bq-media-player]').waitFor();
  assert(await reopened.locator('iframe[data-bq-media-player]').count()===1,'Returning to Videos did not create one clean player instance.');
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
  const root=page.locator('#recordings-test-root');await root.locator('[data-video-select]').first().waitFor();await root.locator('[data-video-select="rec-1"]').click();await root.locator('iframe[data-bq-media-player]').waitFor();
  const metrics=await page.evaluate(()=>{const scope=document.querySelector('#recordings-test-root');const controls=[...scope.querySelectorAll('button,input')];return{innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))}});
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Videos mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,'Videos mobile control target is below 44px.');
  assert(await root.locator('iframe[data-bq-media-player]').count()===1,'Mobile Videos page must keep one player.');
  await page.evaluate(()=>window.__removeRecordingHarness());await page.close();
}

async function v6MediaEngineBrowser(){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const [{createMediaProviderRegistry},{createMediaSessionManager},{createYouTubeIframeAdapter},{createMediaVisibilityLifecycle}]=await Promise.all([
      import('/src/v6/media/registry.ts'),
      import('/src/v6/media/session.ts'),
      import('/src/v6/media/youtube-iframe-adapter.ts'),
      import('/src/v6/media/visibility-lifecycle.ts')
    ]);
    const calls=[],events=[];
    class Player{
      constructor(target,options){this.target=String(target);calls.push(`yt:${this.target}:construct`);queueMicrotask(()=>options?.events?.onReady?.({target:this}))}
      cueVideoById(input){calls.push(`yt:${this.target}:cue:${input.videoId}@${input.startSeconds??0}`)}
      loadVideoById(input){calls.push(`yt:${this.target}:load:${input.videoId}@${input.startSeconds??0}`)}
      playVideo(){calls.push(`yt:${this.target}:play`)}
      pauseVideo(){calls.push(`yt:${this.target}:pause`)}
      stopVideo(){calls.push(`yt:${this.target}:stop`)}
      seekTo(seconds,allowSeekAhead){calls.push(`yt:${this.target}:seek:${seconds}:${allowSeekAhead}`)}
      destroy(){calls.push(`yt:${this.target}:destroy`)}
    }
    const youtube=createYouTubeIframeAdapter({
      api:{Player},
      resolveElement:instanceId=>`engine-${instanceId}`
    });
    const native={
      kind:'native',
      capabilities:{seek:true,pictureInPicture:true},
      create(instanceId){return{
        load(source,startAtSeconds){calls.push(`native:${instanceId}:load:${source.id}@${startAtSeconds}`)},
        play(){calls.push(`native:${instanceId}:play`)},
        pause(){calls.push(`native:${instanceId}:pause`)},
        stop(){calls.push(`native:${instanceId}:stop`)},
        seek(seconds){calls.push(`native:${instanceId}:seek:${seconds}`)},
        unload(){calls.push(`native:${instanceId}:unload`)},
        requestPictureInPicture(){calls.push(`native:${instanceId}:pip`)}
      }}
    };
    const providers=createMediaProviderRegistry([youtube,native]);
    const manager=createMediaSessionManager({providers,maxInstances:4});
    manager.subscribe(event=>events.push(event.type));
    const source=(id,provider,externalId)=>({id,provider,externalId,title:id,durationSeconds:600});
    await manager.register('engine-player','recordings');
    await manager.register('engine-preview','home');
    await manager.setQueue('engine-player',[
      {source:source('service-one','youtube','abcdefghijk'),resumeSeconds:12},
      {source:source('service-two','native','native-service-two'),resumeSeconds:5}
    ]);
    await manager.setQueue('engine-preview',[
      {source:source('preview','youtube','ZYXWVUTsrqp'),resumeSeconds:0}
    ]);
    await manager.play('engine-preview');
    await manager.play('engine-player');
    const afterAudibleSwitch=manager.snapshot();
    await manager.seek('engine-player',34);
    await manager.next('engine-player');
    await manager.play('engine-player');
    await manager.previous('engine-player');
    await manager.play('engine-player');

    class FakeTarget{
      constructor(){this.visibilityState='visible';this.listeners=new Map()}
      addEventListener(type,listener){const set=this.listeners.get(type)||new Set();set.add(listener);this.listeners.set(type,set)}
      removeEventListener(type,listener){this.listeners.get(type)?.delete(listener)}
      dispatch(type){for(const listener of this.listeners.get(type)||[])listener()}
    }
    const target=new FakeTarget();
    const lifecycle=createMediaVisibilityLifecycle({session:manager,visibilityTarget:target});
    target.visibilityState='hidden';target.dispatch('visibilitychange');target.dispatch('pagehide');await lifecycle.flush();
    const afterBackground=manager.snapshot();
    target.visibilityState='visible';target.dispatch('visibilitychange');target.dispatch('pageshow');await lifecycle.flush();
    const resumeCandidate=lifecycle.consumeResumeCandidate();
    lifecycle.dispose();

    await manager.teardownRoute('recordings');
    const afterRouteTeardown=manager.snapshot();
    await manager.teardownRoute('home');
    const afterAllTeardown=manager.snapshot();
    return{calls,events,afterAudibleSwitch,afterBackground,resumeCandidate,afterRouteTeardown,afterAllTeardown};
  });
  assert(result.afterAudibleSwitch.activeAudibleInstanceId==='engine-player','V6 Media browser harness did not enforce one audible owner.');
  assert(result.afterAudibleSwitch.instances.find(row=>row.instanceId==='engine-preview')?.status==='paused','V6 Media browser harness did not pause the previous audible instance.');
  assert(result.calls.includes('native:engine-player:load:service-two@5'),'V6 Media browser harness did not load the queued native provider at its resume position.');
  assert(result.calls.includes('yt:engine-engine-player:cue:abcdefghijk@34'),'V6 Media browser harness did not restore the YouTube resume position after provider switching.');
  assert(result.events.includes('provider-switched'),'V6 Media browser harness did not emit provider-switch lifecycle evidence.');
  assert(result.afterBackground.activeAudibleInstanceId===null,'V6 Media browser harness left audible ownership active in the background.');
  assert(result.afterBackground.instances.find(row=>row.instanceId==='engine-player')?.status==='paused','V6 Media browser harness did not pause playback on background transition.');
  assert(result.resumeCandidate==='engine-player','V6 Media browser harness did not preserve an explicit foreground resume candidate.');
  assert(result.afterRouteTeardown.instances.length===1&&result.afterRouteTeardown.instances[0].instanceId==='engine-preview','V6 Media route teardown removed the wrong registered instance set.');
  assert(result.afterAllTeardown.instances.length===0,'V6 Media teardown left registered player resources behind.');
  await page.close();
}

try{await desktop();await deniedCuration();await mobile();await v6MediaEngineBrowser();console.log('BibleQuest v3 Videos (formerly Live Recordings) browser regression passed.')}finally{await browser.close()}
