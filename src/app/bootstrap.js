import { createStore } from './store.js';
import { createRouter } from './router.js';
import { createSessionService } from './session.js';
import { createAccountService } from './account.js';
import { createReaderService } from './reader.js';
import { createDailyMissionService } from './daily-mission.js';
import { createTransformService } from './transform.js';
import { createAudioManager } from './audio.js';
import { createRecordingsService } from './recordings.js';
import { createMediaLibraryService } from './media-library.js';
import { createGameLauncherService } from './games.js';
import { createApi } from '../core/api.js';
import { createBibleDataService } from '../core/bible.js';
import { createProgressService } from '../core/progress.js';
import { createLessonEngine } from '../engines/lesson.js';
import { createTransformEngine } from '../engines/transform.js';
import { storage } from '../core/storage.js';
import { mountShell } from '../ui/shell.js';
import { homePage, pendingPage } from '../features/home/index.js';
import { accountPage } from '../features/account/index.js';
import { learnPage } from '../features/learn/index.js';
import { readerPage } from '../features/reader/index.js';
import { progressPage } from '../features/progress/index.js';
import { dailyMissionPage } from '../features/daily-mission/index.js';
import { transformPage } from '../features/transform/index.js';
import { recordingsPage } from '../features/recordings/index.js';
import { mediaLibraryPage } from '../features/media-library/index.js';
import { gamesPage } from '../features/games/index.js';

function start(){
  const root=document.getElementById('app');
  const store=createStore({
    route:'home',
    bootedAt:Date.now(),
    session:Object.freeze({status:'booting',authenticated:false,remoteAvailable:true,user:null,expiresAt:null,error:''})
  });
  const api=createApi();
  const bible=createBibleDataService();
  const progress=createProgressService({storage,store});
  const lesson=createLessonEngine({storage});
  const transformEngine=createTransformEngine({storage});
  const session=createSessionService({auth:api.auth,store});
  const account=createAccountService({api,session,storage});
  const reader=createReaderService({bible,storage,progress});
  const dailyMission=createDailyMissionService({lesson,progress,reader});
  const transform=createTransformService({engine:transformEngine,progress});
  const audio=createAudioManager();
  const recordings=createRecordingsService({media:api.media,audio,session});
  const mediaLibrary=createMediaLibraryService({recordings});
  const games=createGameLauncherService({progress});

  let router,shell;
  const routes=Object.freeze({
    home:()=>homePage({
      progress,
      dailyMission,
      onMission:()=>router.navigate('mission'),
      onRecordings:()=>router.navigate('recordings'),
      onMedia:()=>router.navigate('media')
    }),
    mission:()=>dailyMissionPage({mission:dailyMission,onReader:()=>router.navigate('reader'),onHome:()=>router.navigate('home')}),
    learn:()=>learnPage({onReader:()=>router.navigate('reader')}),
    reader:()=>readerPage({reader}),
    play:()=>gamesPage({games,onHome:()=>router.navigate('home')}),
    grow:()=>progressPage({progress,onTransform:()=>router.navigate('transform')}),
    transform:()=>transformPage({transform,onGrow:()=>router.navigate('grow')}),
    recordings:()=>recordingsPage({recordings,onHome:()=>router.navigate('home'),onAccount:()=>router.navigate('account')}),
    media:()=>mediaLibraryPage({library:mediaLibrary,onHome:()=>router.navigate('home'),onAccount:()=>router.navigate('account')}),
    more:()=>pendingPage('More'),
    account:()=>accountPage({account,session,onHome:()=>router.navigate('home')}),
    'not-found':()=>({title:'Not found',html:'<section class="bq-panel"><h1>Page not found</h1><p>Use the navigation below to return to BibleQuest.</p></section>'})
  });

  router=createRouter({
    routes,
    onRoute(route,renderPage){
      try{
        store.setState(current=>({...current,route}));
        shell.render(route,renderPage());
      }catch(error){
        console.error(error);
        shell.renderError(error?.message||'Unknown application error.');
      }
    }
  });

  shell=mountShell(root,{onNavigate:route=>router.navigate(route),onAccountOpen:()=>router.navigate('account')});
  const syncShell=state=>{shell.updateSession(state.session);shell.updateProgress(state.progress)};
  const unsubscribeStore=store.subscribe(syncShell);
  syncShell(store.getState());
  router.start();
  session.boot().then(()=>{
    if(session.isAuthenticated()) account.ensureCurrentDevice().catch(error=>console.warn('Device registration failed',error));
  }).catch(error=>console.error('Session boot failed',error));
  window.addEventListener('pagehide',()=>{
    unsubscribeStore();
    games.leave();
    mediaLibrary.leave();
    recordings.dispose();
    session.dispose();
  },{once:true});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
