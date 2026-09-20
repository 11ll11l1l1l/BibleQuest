import { createStore } from './store.js';
import { createMyJourneyService } from './my-journey.js';
import { installV5LunaRegressionGuards } from './v5-luna-regression-guards.js';
import { createRouter } from './router.js';
import { createLazyPage } from './lazy-page.js';
import { createSessionService } from './session.js';
import { createAccountService } from './account.js';
import { createBackupService } from './backup.js';
import { createReaderService } from './reader.js';
import { createJapaneseVocabularyService } from './japanese-vocabulary.js';
import { createJapaneseFuriganaService } from './japanese-furigana.js';
import { createJapaneseFuriganaTokenizerRuntime } from './japanese-furigana-tokenizer.js';
import { createGuidedStudyService } from './study.js';
import { createDeepQuestionsService } from './deep-questions.js';
import { createStoryJourneyService } from './story-journey.js';
import { createWisdomSituationsService } from './wisdom-situations.js';
import { createAdaptiveLearningService } from './adaptive-learning.js';
import { createBibleWorldService } from './bible-world.js';
import { createOpenReviewService } from './open-review.js';
import { createDailyMissionService } from './daily-mission.js';
import { createTransformService } from './transform.js';
import { createPersonalityProfileService } from './personality-profile.js';
import { createPsychometricsService } from './psychometrics.js';
import { createAvatarVaultService } from './avatar-vault.js';
import { createMissionService } from './mission.js';
import { createCalendarService } from './calendar.js';
import { createTutorialService } from './tutorial.js';
import { createAccessibilityService } from './accessibility.js';
import { createAudioManager } from './audio.js';
import { createRecordingsService } from './recordings.js';
import { createGameLauncherService } from './games.js';
import { createPrivateNotesService } from './private-notes.js';
import { createCloudNotesService } from './cloud-notes.js';
import { createCouplesFamilyService } from './couples-family.js';
import { createCouplesCloudService } from './couples-cloud.js';
import { createCongregationMembershipService } from './congregation-membership.js';
import { createLiveRoomsService } from './live-rooms.js';
import { createContentModerationService } from './content-moderation.js';
import { createContentReviewService } from './content-review.js';
import { createContentReportingService } from './content-reporting.js';
import { createMinistryHubService } from './ministry-hub.js';
import { createLeaderCenterService } from './leader-center.js';
import { createNotificationCenterService } from './notification-center.js';
import { createWorkspaceService } from './workspace.js';
import { createPresenceService } from './presence.js';
import { createTeamCenterService } from './team-center.js';
import { createTrustedScoreEventsService } from './trusted-score-events.js';
import { createLeaderboardsService } from './leaderboards.js';
import { createCongregationRecognitionService } from './congregation-recognition.js';
import { createAssignmentsService } from './assignments.js';
import { createJourneyGroupsService } from './journey-groups.js';
import { createEncouragementsService } from './encouragements.js';
import { createCommunityBridgeService } from './community-bridge.js';
import { createOperationalRecoveryService } from './operational-recovery.js';
import { createClientDiagnosticsService } from '../core/client-diagnostics.js';
import { createPwaInstallService } from './pwa-install.js';
import { createPushSubscriptionService } from './push-subscription.js';
import { createPushSubscriptionPersistence } from './push-subscription-persistence.js';
import { createOfflineShellService } from './offline-shell.js';
import { createApi } from '../core/api.js';
import { createBibleDataService } from '../core/bible.js';
import { createProgressService } from '../core/progress.js';
import { createRecallPackService } from '../core/recall-packs.js';
import { createLessonEngine } from '../engines/lesson.js';
import { createTransformEngine } from '../engines/transform.js';
import { createPsychometricsEngine } from '../engines/psychometrics.js';
import { storage, privateStorage, authStorage } from '../core/storage.js';
import { mountShell } from '../ui/shell.js';
import { mountAccessibilityRuntime } from '../ui/accessibility.js';
import { mountContentReportingRuntime } from '../ui/content-reporting.js';
import { mountPushOnboarding } from '../ui/push-onboarding.js';
import { mountTutorialOverlay } from '../features/tutorial/index.js';

const featurePageModules = import.meta.glob('../features/*/index.js');

function lazyFeaturePage(feature, exportName, args) {
  const path = `../features/${feature}/index.js`;
  const load = featurePageModules[path];
  if (typeof load !== 'function') throw new Error(`Missing lazy feature module: ${path}`);
  return createLazyPage({
    key: feature,
    load,
    create(module) {
      const factory = module?.[exportName];
      if (typeof factory !== 'function') throw new Error(`Missing ${exportName} export from ${path}`);
      return factory(args);
    },
  });
}

const homePage = args => lazyFeaturePage('home', 'homePage', args);
const accountPage = args => lazyFeaturePage('account', 'accountPage', args);
const backupPage = args => lazyFeaturePage('backup', 'backupPage', args);
const accessibilityPage = args => lazyFeaturePage('accessibility', 'accessibilityPage', args);
const learnPage = args => lazyFeaturePage('learn', 'learnPage', args);
const guidedStudyPage = args => lazyFeaturePage('study', 'guidedStudyPage', args);
const deepQuestionsPage = args => lazyFeaturePage('deep-questions', 'deepQuestionsPage', args);
const storyJourneyPage = args => lazyFeaturePage('story-journey', 'storyJourneyPage', args);
const wisdomSituationsPage = args => lazyFeaturePage('wisdom-situations', 'wisdomSituationsPage', args);
const adaptiveLearningPage = args => lazyFeaturePage('adaptive-learning', 'adaptiveLearningPage', args);
const bibleWorldPage = args => lazyFeaturePage('bible-world', 'bibleWorldPage', args);
const openReviewPage = args => lazyFeaturePage('open-review', 'openReviewPage', args);
const privateNotesPage = args => lazyFeaturePage('private-notes', 'privateNotesPage', args);
const cloudNotesPage = args => lazyFeaturePage('cloud-notes', 'cloudNotesPage', args);
const couplesFamilyPage = args => lazyFeaturePage('couples-family', 'couplesFamilyPage', args);
const couplesCloudPage = args => lazyFeaturePage('couples-cloud', 'couplesCloudPage', args);
const journeyGroupsPage = args => lazyFeaturePage('journey-groups', 'journeyGroupsPage', args);
const encouragementsPage = args => lazyFeaturePage('encouragements', 'encouragementsPage', args);
const liveRoomsPage = args => lazyFeaturePage('live-rooms', 'liveRoomsPage', args);
const communityPage = args => lazyFeaturePage('community', 'communityPage', args);
const ministryHubPage = args => lazyFeaturePage('ministry-hub', 'ministryHubPage', args);
const myJourneyPage = args => lazyFeaturePage('my-journey', 'myJourneyPage', args);
const leaderCenterPage = args => lazyFeaturePage('leader-center', 'leaderCenterPage', args);
const notificationCenterPage = args => lazyFeaturePage('notification-center', 'notificationCenterPage', args);
const workspacePage = args => lazyFeaturePage('workspace', 'workspacePage', args);
const teamCenterPage = args => lazyFeaturePage('team-center', 'teamCenterPage', args);
const leaderboardsPage = args => lazyFeaturePage('leaderboards', 'leaderboardsPage', args);
const congregationRecognitionPage = args => lazyFeaturePage('congregation-recognition', 'congregationRecognitionPage', args);
const assignmentsPage = args => lazyFeaturePage('assignments', 'assignmentsPage', args);
const contentReviewPage = args => lazyFeaturePage('content-review', 'contentReviewPage', args);
const readerPage = args => lazyFeaturePage('reader', 'readerPage', args);
const progressPage = args => lazyFeaturePage('progress', 'progressPage', args);
const dailyMissionPage = args => lazyFeaturePage('daily-mission', 'dailyMissionPage', args);
const transformPage = args => lazyFeaturePage('transform', 'transformPage', args);
const personalityProfilePage = args => lazyFeaturePage('personality-profile', 'personalityProfilePage', args);
const psychometricsPage = args => lazyFeaturePage('psychometrics', 'psychometricsPage', args);
const avatarVaultPage = args => lazyFeaturePage('avatar-vault', 'avatarVaultPage', args);
const missionPage = args => lazyFeaturePage('mission', 'missionPage', args);
const calendarPage = args => lazyFeaturePage('calendar', 'calendarPage', args);
const recordingsPage = args => lazyFeaturePage('recordings', 'recordingsPage', args);
const gamesPage = args => lazyFeaturePage('games', 'gamesPage', args);
const congregationPage = args => lazyFeaturePage('congregation', 'congregationPage', args);
const morePage = args => lazyFeaturePage('more', 'morePage', args);
const helpCenterPage = args => lazyFeaturePage('help-center', 'helpCenterPage', args);

const V5_PUSH_VAPID_PUBLIC_KEY='BKxJ2WXSqmiA9ZEmx8bItafM4fp_R4NkTC4F45BGZjjDqnfK-C3Goqb25CVgWsSSwMZsvOczx8LNv2vstkdqRmI';

function escapeStartupMessage(value){
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

// Fail-fast startup guard: if service construction/wiring below throws (for
// example a dependency-ordering ReferenceError), render an actionable
// diagnostic into #app instead of leaving a blank/frozen screen. This is not
// a second bootstrap owner - it wraps the same, single start() sequence.
function renderStartupFailure(root,error){
  console.error('BibleQuest failed to start.',error);
  if(!root)return;
  root.innerHTML=`<section class="bq-panel" data-startup-failure><p class="bq-eyebrow">STARTUP ERROR</p><h1>BibleQuest could not start</h1><p>Something went wrong while preparing the app. Reloading usually fixes this. If it keeps happening, please let us know.</p><button type="button" data-startup-reload class="bq-primary-button">Reload</button>${error?.message?`<p><small data-startup-error-detail>${escapeStartupMessage(error.message)}</small></p>`:''}</section>`;
  root.querySelector('[data-startup-reload]')?.addEventListener('click',()=>window.location.reload());
}

function start(){
  installV5LunaRegressionGuards();
  const root=document.getElementById('app');
  try{
    boot(root);
  }catch(error){
    renderStartupFailure(root,error);
  }
}

function boot(root){
  const store=createStore({route:'home',bootedAt:Date.now(),session:Object.freeze({status:'booting',authenticated:false,remoteAvailable:true,user:null,expiresAt:null,error:''})});
  const api=createApi();
  const diagnostics=createClientDiagnosticsService({probe:api.diagnostics.probe});
  const pwaInstall=createPwaInstallService();
  const offlineShell=createOfflineShellService();
  const bible=createBibleDataService();
  const progress=createProgressService({storage,store});
  const recall=createRecallPackService();
  const lesson=createLessonEngine({storage});
  const transformEngine=createTransformEngine({storage});
  const psychometricsEngine=createPsychometricsEngine();
  const session=createSessionService({auth:api.auth,store});
  const pushPersistence=createPushSubscriptionPersistence({api:api.pushSubscriptions,session});
  const push=createPushSubscriptionService({session,persistence:pushPersistence,serviceWorker:globalThis.navigator?.serviceWorker,notification:globalThis.Notification,applicationServerKey:V5_PUSH_VAPID_PUBLIC_KEY,ownerStorage:authStorage});
  const account=createAccountService({api,session,storage});
  const backup=createBackupService({storage});
  const reader=createReaderService({bible,storage,progress});
  const vocabulary=createJapaneseVocabularyService({storage});
  const furiganaTokenizer=createJapaneseFuriganaTokenizerRuntime();
  const furigana=createJapaneseFuriganaService({storage,tokenizer:furiganaTokenizer});
  const study=createGuidedStudyService({lesson,progress,reader});
  const deepQuestions=createDeepQuestionsService({lesson,reader});
  const storyJourney=createStoryJourneyService({lesson,progress,reader});
  const wisdomSituations=createWisdomSituationsService({lesson,progress});
  const adaptiveLearning=createAdaptiveLearningService({storage,lesson,progress});
  const bibleWorld=createBibleWorldService({adaptive:adaptiveLearning,reader});
  const dailyMission=createDailyMissionService({lesson,progress,reader});
  const personalityProfile=createPersonalityProfileService({session,privateStorage});
  const psychometrics=createPsychometricsService({engine:psychometricsEngine,storage:privateStorage,session});
  const transform=createTransformService({engine:transformEngine,progress,personalityProfile});
  const audio=createAudioManager();
  const congregation=createCongregationMembershipService({api,session});
  const recordings=createRecordingsService({media:api.media,audio,session,congregation});
  const liveRooms=createLiveRoomsService({api:api.liveRooms,session,congregation});
  const contentModeration=createContentModerationService({api:api.contentDecisions,session,congregation});
  const contentReview=createContentReviewService({api:api.contentReview,session,congregation,recall});
  const games=createGameLauncherService({progress,storage,recall,moderation:contentModeration});
  const openReview=createOpenReviewService({storage,lesson,progress,recall,games,adaptive:adaptiveLearning});
  const mission=createMissionService({openReview});
  const tutorial=createTutorialService({storage});
  const accessibility=createAccessibilityService({storage});
  const privateNotes=createPrivateNotesService({storage});
  const cloudNotes=createCloudNotesService({api:api.cloudNotes,session});
  const couplesFamily=createCouplesFamilyService({storage});
  const couplesCloud=createCouplesCloudService({api:api.couples,session});
  const contentReporting=createContentReportingService({api:api.contentReports,session,congregation});
  const ministryHub=createMinistryHubService({congregation});
  const notifications=createNotificationCenterService({api:api.notifications,session});
  const workspace=createWorkspaceService({session,cloudNotes,congregation,reader,storage});
  const presence=createPresenceService({api:api.presence,session,congregation,store});
  const teamCenter=createTeamCenterService({api:api.teamCenter,session,congregation});
  const scoreEvents=createTrustedScoreEventsService({api:api.scoreEvents,session,congregation});
  const leaderboards=createLeaderboardsService({api:api.leaderboards,session,congregation});
  const recognition=createCongregationRecognitionService({api:api.congregationRecognition,session,congregation});
  const assignments=createAssignmentsService({api:api.assignments,session,congregation});
  const myJourney=createMyJourneyService({progress,assignments});
  const leaderCenter=createLeaderCenterService({assignments,presence});
  const avatarVault=createAvatarVaultService({session,privateStorage,api,progress,bibleWorld,couplesFamily,games,assignments});
  const calendar=createCalendarService({session,privateStorage,api,assignments,congregation});
  const journeyGroups=createJourneyGroupsService({api:api.journeyGroups,session,congregation});
  const encouragements=createEncouragementsService({api:api.encouragements,session,journeyGroups});
  const communityBridge=createCommunityBridgeService({session,congregation,journeyGroups,encouragements});
  void scoreEvents;
  let recovery;
  recovery=createOperationalRecoveryService({report:(error,context)=>diagnostics.classify(error,{kind:'module',route:context.route}).then(diagnostic=>{
    if(recovery.getState()?.id===context.id)shell?.updateRecoveryDiagnostic(context.id,diagnostic);
  })});

  let router,shell,tutorialOverlay,accessibilityRuntime,contentReportingRuntime;
  const reloadAfterLocalDataChange=()=>location.reload();
  const openCouplesScripture=card=>{reader.setTranslation('bsb');reader.setBook(card.code,card.chapter);router.navigate('reader')};
  const routes=Object.freeze({
    home:()=>homePage({progress,dailyMission,assignments,presence,calendar,reader,recordings,transform,notifications,onAssignments:()=>router.navigate('assignments'),onMission:()=>router.navigate('mission'),onRecordings:()=>router.navigate('recordings'),onMedia:()=>router.navigate('media'),onTutorial:()=>tutorial.open({force:true}),onReader:()=>router.navigate('reader'),onCalendar:()=>router.navigate('calendar'),onGrow:()=>router.navigate('grow'),onTransformation:()=>router.navigate('transform'),onNotifications:()=>router.navigate('notification-center')}),
    mission:()=>dailyMissionPage({mission:dailyMission,onReader:()=>router.navigate('reader'),onHome:()=>router.navigate('home')}),
    learn:()=>learnPage({translations:reader.translations,recallSource:recall.sourceInfo(),onReader:()=>router.navigate('reader'),onStudy:()=>router.navigate('study'),onDeepQuestions:()=>router.navigate('deep-questions'),onStoryJourney:()=>router.navigate('story-journey'),onWisdomSituations:()=>router.navigate('wisdom-situations'),onBibleWorld:()=>router.navigate('bible-world'),onAdaptiveLearning:()=>router.navigate('adaptive-learning'),onOpenReview:()=>router.navigate('open-review'),onPrivateNotes:()=>router.navigate('private-notes'),onCloudNotes:()=>router.navigate('cloud-notes')}),
    study:()=>guidedStudyPage({study,onReader:()=>router.navigate('reader'),onLearn:()=>router.navigate('learn')}),
    'deep-questions':()=>deepQuestionsPage({deepQuestions,onReader:()=>router.navigate('reader'),onLearn:()=>router.navigate('learn')}),
    'story-journey':()=>storyJourneyPage({storyJourney,onReader:()=>router.navigate('reader'),onLearn:()=>router.navigate('learn')}),
    'wisdom-situations':()=>wisdomSituationsPage({wisdom:wisdomSituations,onLearn:()=>router.navigate('learn')}),
    'adaptive-learning':()=>adaptiveLearningPage({adaptive:adaptiveLearning,onLearn:()=>router.navigate('learn')}),
    'bible-world':()=>bibleWorldPage({world:bibleWorld,onNavigate:route=>router.navigate(route),onLearn:()=>router.navigate('learn')}),
    'open-review':()=>openReviewPage({review:openReview,onLearn:()=>router.navigate('learn')}),
    'private-notes':()=>privateNotesPage({notes:privateNotes,onLearn:()=>router.navigate('learn')}),
    'cloud-notes':()=>cloudNotesPage({notes:cloudNotes,onLearn:()=>router.navigate('learn'),onAccount:()=>router.navigate('account')}),
    'couples-family':()=>couplesFamilyPage({couples:couplesFamily,onBack:()=>router.navigate('more'),onReader:openCouplesScripture}),
    'couples-cloud':()=>couplesCloudPage({couples:couplesCloud,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    'journey-groups':()=>journeyGroupsPage({journeyGroups,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account'),onEncouragements:()=>router.navigate('encouragements')}),
    encouragements:()=>encouragementsPage({encouragements,onBack:()=>router.navigate('journey-groups'),onAccount:()=>router.navigate('account')}),
    community:()=>communityPage({bridge:communityBridge,onNavigate:route=>router.navigate(route),onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    'live-rooms':()=>liveRoomsPage({liveRooms,onBack:()=>router.navigate('community'),onAccount:()=>router.navigate('account')}),
    'ministry-hub':()=>ministryHubPage({hub:ministryHub,onNavigate:route=>router.navigate(route),onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account'),onCongregation:()=>router.navigate('congregation')}),
    'leader-center':()=>leaderCenterPage({leaderCenter,onBack:()=>router.navigate('ministry-hub'),onAccount:()=>router.navigate('account'),onAssignments:()=>router.navigate('assignments'),onJourneyGroups:()=>router.navigate('journey-groups'),onTeamCenter:()=>router.navigate('team-center'),onCongregation:()=>router.navigate('congregation')}),
    'notification-center':()=>notificationCenterPage({notifications,onNavigate:route=>router.navigate(route),onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    workspace:()=>workspacePage({workspace,onNavigate:route=>router.navigate(route),onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    'team-center':()=>teamCenterPage({teamCenter,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    leaderboards:()=>leaderboardsPage({leaderboards,onBack:()=>router.navigate('community'),onAccount:()=>router.navigate('account')}),
    recognition:()=>congregationRecognitionPage({recognition,onBack:()=>router.navigate('community'),onAccount:()=>router.navigate('account'),onLeaderboards:()=>router.navigate('leaderboards')}),
    assignments:()=>assignmentsPage({assignments,onBack:()=>router.navigate('community'),onAccount:()=>router.navigate('account')}),
    'content-review':()=>contentReviewPage({review:contentReview,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account'),onCongregation:()=>router.navigate('congregation')}),
    reader:()=>readerPage({reader,vocabulary,furigana}),play:()=>gamesPage({games,onHome:()=>router.navigate('home')}),
    grow:()=>progressPage({progress,onTransform:()=>router.navigate('transform'),onPersonalityProfile:()=>router.navigate('personality-profile'),onPsychometrics:()=>router.navigate('psychometrics'),onAvatarVault:()=>router.navigate('avatar-vault'),onMyJourney:()=>router.navigate('my-journey')}),
    'my-journey':()=>myJourneyPage({myJourney,onBack:()=>router.navigate('grow')}),
    transform:()=>transformPage({transform,onGrow:()=>router.navigate('grow')}),
    'personality-profile':()=>personalityProfilePage({profile:personalityProfile,onBack:()=>router.navigate('grow'),onTransform:()=>router.navigate('transform')}),
    psychometrics:()=>psychometricsPage({psychometrics,onBack:()=>router.navigate('grow'),onQuickTransform:()=>router.navigate('transform')}),
    'avatar-vault':()=>avatarVaultPage({vault:avatarVault,onBack:()=>router.navigate('grow'),onAccount:()=>router.navigate('account')}),
    'my-mission':()=>missionPage({mission,onBack:()=>router.navigate('more'),onReview:()=>router.navigate('open-review'),onStudy:()=>router.navigate('study')}),
    calendar:()=>calendarPage({calendar,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    recordings:()=>recordingsPage({recordings,onHome:()=>router.navigate('home'),onAccount:()=>router.navigate('account')}),media:()=>recordingsPage({recordings,onHome:()=>router.navigate('home'),onAccount:()=>router.navigate('account')}),
    more:()=>morePage({pwaInstall,onCommunity:()=>router.navigate('community'),onMinistryHub:()=>router.navigate('ministry-hub'),onNotificationCenter:()=>router.navigate('notification-center'),onWorkspace:()=>router.navigate('workspace'),onContentReview:()=>router.navigate('content-review'),onCouplesFamily:()=>router.navigate('couples-family'),onCouplesCloud:()=>router.navigate('couples-cloud'),onCongregation:()=>router.navigate('congregation'),onJourneyGroups:()=>router.navigate('journey-groups'),onTeamCenter:()=>router.navigate('team-center'),onBackup:()=>router.navigate('backup'),onMission:()=>router.navigate('my-mission'),onAccessibility:()=>router.navigate('accessibility'),onCalendar:()=>router.navigate('calendar'),onHelp:()=>router.navigate('help')}),
    help:()=>helpCenterPage({onBack:()=>router.navigate('more'),onTutorial:()=>tutorial.open({force:true})}),
    accessibility:()=>accessibilityPage({accessibility,onBack:()=>router.navigate('more')}),
    backup:()=>backupPage({backup,onBack:()=>router.navigate('more'),onApplied:reloadAfterLocalDataChange}),
    congregation:()=>congregationPage({membership:congregation,onAccount:()=>router.navigate('account'),onBack:()=>router.navigate('more')}),
    account:()=>accountPage({account,session,onHome:()=>router.navigate('home'),onTutorial:()=>tutorial.open({force:true})}),'not-found':()=>({title:'Not found',html:'<section class="bq-panel"><h1>Page not found</h1><p>Use the navigation below to return to BibleQuest.</p></section>'})
  });
  const showRecovery=failure=>shell.renderRecovery(failure,{onRetry:()=>recovery.retry(),onHome:()=>recovery.home()});
  router=createRouter({routes,onRoute(route,renderPage){
    const result=recovery.run({
      route,
      operation:()=>{store.setState(current=>({...current,route}));shell.render(route,renderPage());contentReportingRuntime?.refresh()},
      retry:()=>router.navigate(route),
      home:()=>router.navigate('home')
    });
    if(!result.ok)showRecovery(result.failure);
  }});
  shell=mountShell(root,{onNavigate:route=>router.navigate(route),onAccountOpen:()=>router.navigate('account')});
  const pushOnboarding=mountPushOnboarding({push,session,ownerStorage:authStorage});
  contentReportingRuntime=mountContentReportingRuntime({reporting:contentReporting,getRoute:()=>store.getState().route,onAccount:()=>router.navigate('account'),onCongregation:()=>router.navigate('congregation')});
  accessibilityRuntime=mountAccessibilityRuntime({accessibility});
  tutorialOverlay=mountTutorialOverlay({tutorial,onNavigate:route=>router.navigate(route)});
  let moderationSessionKey='';
  const syncModeration=current=>{
    const sessionState=current?.session||{},key=`${sessionState.authenticated===true?'1':'0'}:${sessionState.user?.id||''}:${sessionState.remoteAvailable===false?'local':'remote'}`;
    if(key===moderationSessionKey)return;
    moderationSessionKey=key;
    if(!sessionState.authenticated){contentModeration.clear();return}
    void contentModeration.refresh().catch(error=>console.warn('Content moderation unavailable',error));
  };
  let pushSessionKey='';
  const syncPushOnboarding=state=>{
    const current=state?.session||{},key=`${current.authenticated===true?'1':'0'}:${current.user?.id||''}`;
    if(key===pushSessionKey)return;
    pushSessionKey=key;
    if(current.authenticated===true)void pushOnboarding.maybePrompt();
  };
  const syncShell=state=>{shell.updateSession(state.session);shell.updateProgress(state.progress)},unsubscribeStore=store.subscribe(syncShell),unsubscribeModeration=store.subscribe(syncModeration),unsubscribePushOnboarding=store.subscribe(syncPushOnboarding);syncShell(store.getState());syncModeration(store.getState());syncPushOnboarding(store.getState());router.start();
  offlineShell.start().catch(error=>console.warn('Offline shell unavailable',error));
  session.boot().then(()=>{
    // Router starts immediately so public/local-first surfaces stay responsive.
    // Only a successfully restored authenticated session needs a forced
    // re-resolve: signed-out/local-first routes already rendered correctly and
    // must not be remounted just because Auth boot completed.
    if(session.isAuthenticated())router.navigate(router.current());
    presence.start().catch(error=>console.warn('Presence unavailable',error));
    if(session.isAuthenticated())account.ensureCurrentDevice().catch(error=>console.warn('Device registration failed',error));
  }).catch(error=>console.error('Session boot failed',error));
  window.addEventListener('pagehide',()=>{unsubscribeStore();unsubscribeModeration();unsubscribePushOnboarding();pushOnboarding.dispose();push.dispose();contentReview.clear();contentModeration.clear();contentReportingRuntime.dispose();accessibilityRuntime.dispose();accessibility.dispose();tutorialOverlay.dispose();offlineShell.dispose();pwaInstall.dispose();liveRooms.clear();communityBridge.clear();encouragements.clear();journeyGroups.clear();assignments.clear();recognition.clear();leaderboards.clear();teamCenter.clear();void presence.dispose();workspace.clear();notifications.clear();congregation.clear();couplesCloud.clear();cloudNotes.clear();study.close();deepQuestions.close();storyJourney.close();wisdomSituations.close();adaptiveLearning.close();openReview.close();games.leave();recordings.dispose();session.dispose()},{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
