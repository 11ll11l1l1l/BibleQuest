import { createStore } from './store.js';
import { createMyJourneyService } from './my-journey.js';
import { installV5LunaRegressionGuards } from './v5-luna-regression-guards.js';
import { createRouter } from './router.js';
import { createSessionService } from './session.js';
import { createAccountService } from './account.js';
import { createAdminAccessService } from './admin-access.js';
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
import { createExplorerService } from './explorer.js';
import { createExplorerCloudSyncService } from './explorer-cloud-sync.js';
import { createOpenReviewService } from './open-review.js';
import { createDailyMissionService } from './daily-mission.js';
import { createBibleQuestService } from './bible-quest.js';
import { createBibleQuestCloudSyncService } from './bible-quest-cloud-sync.js';
import { createProgressCloudSyncService } from './progress-cloud-sync.js';
import { createWeeklyJourneyService } from './weekly-journey.js';
import { createWeeklyJourneyCloudSyncService } from './weekly-journey-cloud-sync.js';
import { createPersonalChallengesService } from './personal-challenges.js';
import { createPersonalChallengesCloudSyncService } from './personal-challenges-cloud-sync.js';
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
import { homePage } from '../features/home/index.js';
import { bibleQuestPage } from '../features/bible-quest/index.js';
import { accountPage } from '../features/account/index.js';
import { backupPage } from '../features/backup/index.js';
import { accessibilityPage } from '../features/accessibility/index.js';
import { learnPage } from '../features/learn/index.js';
import { guidedStudyPage } from '../features/study/index.js';
import { deepQuestionsPage } from '../features/deep-questions/index.js';
import { storyJourneyPage } from '../features/story-journey/index.js';
import { wisdomSituationsPage } from '../features/wisdom-situations/index.js';
import { adaptiveLearningPage } from '../features/adaptive-learning/index.js';
import { bibleWorldPage } from '../features/bible-world/index.js';
import { explorerPage } from '../features/explorer/index.js';
import { openReviewPage } from '../features/open-review/index.js';
import { privateNotesPage } from '../features/private-notes/index.js';
import { cloudNotesPage } from '../features/cloud-notes/index.js';
import { couplesFamilyPage } from '../features/couples-family/index.js';
import { couplesCloudPage } from '../features/couples-cloud/index.js';
import { journeyGroupsPage } from '../features/journey-groups/index.js';
import { encouragementsPage } from '../features/encouragements/index.js';
import { liveRoomsPage } from '../features/live-rooms/index.js';
import { communityPage } from '../features/community/index.js';
import { ministryHubPage } from '../features/ministry-hub/index.js';
import { myJourneyPage } from '../features/my-journey/index.js';
import { leaderCenterPage } from '../features/leader-center/index.js';
import { notificationCenterPage } from '../features/notification-center/index.js';
import { workspacePage } from '../features/workspace/index.js';
import { teamCenterPage } from '../features/team-center/index.js';
import { leaderboardsPage } from '../features/leaderboards/index.js';
import { congregationRecognitionPage } from '../features/congregation-recognition/index.js';
import { assignmentsPage } from '../features/assignments/index.js';
import { contentReviewPage } from '../features/content-review/index.js';
import { readerPage } from '../features/reader/index.js';
import { progressPage } from '../features/progress/index.js';
import { dailyMissionPage } from '../features/daily-mission/index.js';
import { transformPage } from '../features/transform/index.js';
import { personalityProfilePage } from '../features/personality-profile/index.js';
import { psychometricsPage } from '../features/psychometrics/index.js';
import { avatarVaultPage } from '../features/avatar-vault/index.js';
import { missionPage } from '../features/mission/index.js';
import { calendarPage } from '../features/calendar/index.js';
import { recordingsPage } from '../features/recordings/index.js';
import { gamesPage } from '../features/games/index.js';
import { congregationPage } from '../features/congregation/index.js';
import { morePage } from '../features/more/index.js';
import { challengesPage } from '../features/challenges/index.js';
import { mountTutorialOverlay } from '../features/tutorial/index.js';
import { helpCenterPage } from '../features/help-center/index.js';

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
  const progressCloudSync=createProgressCloudSyncService({api:api.progressSnapshots,session,progress,ownerStorage:authStorage,cacheStorage:privateStorage});
  const pushPersistence=createPushSubscriptionPersistence({api:api.pushSubscriptions,session});
  const push=createPushSubscriptionService({session,persistence:pushPersistence,serviceWorker:globalThis.navigator?.serviceWorker,notification:globalThis.Notification,applicationServerKey:V5_PUSH_VAPID_PUBLIC_KEY,ownerStorage:authStorage});
  const account=createAccountService({api,session,storage});
  const adminAccess=createAdminAccessService({api:api.adminConsole,session});
  const backup=createBackupService({storage});
  const bibleQuest=createBibleQuestService({storage,books:bible.books,progress});
  const bibleQuestCloudSync=createBibleQuestCloudSyncService({api:api.progressSnapshots,session,bibleQuest,ownerStorage:authStorage,cacheStorage:privateStorage});
  const reader=createReaderService({bible,storage,progress,bibleQuest});
  const vocabulary=createJapaneseVocabularyService({storage});
  const furiganaTokenizer=createJapaneseFuriganaTokenizerRuntime();
  const furigana=createJapaneseFuriganaService({storage,tokenizer:furiganaTokenizer});
  const study=createGuidedStudyService({lesson,progress,reader});
  const deepQuestions=createDeepQuestionsService({lesson,reader});
  const storyJourney=createStoryJourneyService({lesson,progress,reader});
  const wisdomSituations=createWisdomSituationsService({lesson,progress});
  const adaptiveLearning=createAdaptiveLearningService({storage,lesson,progress});
  const bibleWorld=createBibleWorldService({adaptive:adaptiveLearning,reader});
  const explorer=createExplorerService({storage});
  const explorerCloudSync=createExplorerCloudSyncService({api:api.progressSnapshots,session,explorer,ownerStorage:authStorage,cacheStorage:privateStorage});
  const dailyMission=createDailyMissionService({lesson,progress,reader});
  const weeklyJourney=createWeeklyJourneyService({storage,getDateKey:progress.getDateKey});
  const weeklyJourneyCloudSync=createWeeklyJourneyCloudSyncService({api:api.progressSnapshots,session,weeklyJourney,ownerStorage:authStorage,cacheStorage:privateStorage});
  const personalChallenges=createPersonalChallengesService({storage});
  const personalChallengesCloudSync=createPersonalChallengesCloudSyncService({api:api.progressSnapshots,session,challenges:personalChallenges,ownerStorage:authStorage,cacheStorage:privateStorage});
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
  const myJourney=createMyJourneyService({progress,assignments,bibleQuest});
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
  const navigateGeneral=route=>{if(route==='reader'){bibleQuest.deactivate();router.navigate('reader');return}router.navigate(route)};
  const openFreeReader=()=>navigateGeneral('reader');
  const openCouplesScripture=card=>{bibleQuest.deactivate();reader.setTranslation('bsb');reader.setBook(card.code,card.chapter);router.navigate('reader')};
  const openChallengeScripture=target=>{bibleQuest.deactivate();reader.setBook(target.code,target.chapter);router.navigate('reader')};
  const openExplorerScripture=target=>{bibleQuest.deactivate();reader.setBook(target.code,target.chapter);router.navigate('reader')};
  const openBibleQuestNext=()=>{
    const quest=bibleQuest.activateNext(),target=quest.next;
    if(!target){router.navigate('bible-quest');return}
    reader.setBook(target.code,target.chapter);
    router.navigate('reader');
  };
  const routes=Object.freeze({
    home:()=>homePage({progress,bibleQuest,dailyMission,weeklyJourney,assignments,presence,calendar,reader,recordings,transform,notifications,onBibleQuest:()=>router.navigate('bible-quest'),onBibleQuestContinue:openBibleQuestNext,onAssignments:()=>router.navigate('assignments'),onMission:()=>router.navigate('mission'),onRecordings:()=>router.navigate('recordings'),onMedia:()=>router.navigate('media'),onTutorial:()=>tutorial.open({force:true}),onReader:openFreeReader,onCalendar:()=>router.navigate('calendar'),onGrow:()=>router.navigate('grow'),onTransformation:()=>router.navigate('transform'),onNotifications:()=>router.navigate('notification-center')}),
    'bible-quest':()=>bibleQuestPage({bibleQuest,reader,onContinue:openBibleQuestNext,onFreeRead:openFreeReader,onBack:()=>router.navigate('home')}),
    mission:()=>dailyMissionPage({mission:dailyMission,onReader:openFreeReader,onHome:()=>router.navigate('home')}),
    learn:()=>learnPage({translations:reader.translations,recallSource:recall.sourceInfo(),onReader:openFreeReader,onStudy:()=>router.navigate('study'),onDeepQuestions:()=>router.navigate('deep-questions'),onStoryJourney:()=>router.navigate('story-journey'),onWisdomSituations:()=>router.navigate('wisdom-situations'),onBibleWorld:()=>router.navigate('bible-world'),onExplorer:()=>router.navigate('explorer'),onAdaptiveLearning:()=>router.navigate('adaptive-learning'),onOpenReview:()=>router.navigate('open-review'),onPrivateNotes:()=>router.navigate('private-notes'),onCloudNotes:()=>router.navigate('cloud-notes')}),
    study:()=>guidedStudyPage({study,onReader:openFreeReader,onLearn:()=>router.navigate('learn')}),
    'deep-questions':()=>deepQuestionsPage({deepQuestions,onReader:openFreeReader,onLearn:()=>router.navigate('learn')}),
    'story-journey':()=>storyJourneyPage({storyJourney,onReader:openFreeReader,onLearn:()=>router.navigate('learn')}),
    'wisdom-situations':()=>wisdomSituationsPage({wisdom:wisdomSituations,onLearn:()=>router.navigate('learn')}),
    'adaptive-learning':()=>adaptiveLearningPage({adaptive:adaptiveLearning,onLearn:()=>router.navigate('learn')}),
    'bible-world':()=>bibleWorldPage({world:bibleWorld,onNavigate:navigateGeneral,onLearn:()=>router.navigate('learn')}),
    explorer:()=>explorerPage({explorer,onBack:()=>router.navigate('learn'),onReader:openExplorerScripture}),
    'open-review':()=>openReviewPage({review:openReview,onLearn:()=>router.navigate('learn')}),
    'private-notes':()=>privateNotesPage({notes:privateNotes,onLearn:()=>router.navigate('learn')}),
    'cloud-notes':()=>cloudNotesPage({notes:cloudNotes,onLearn:()=>router.navigate('learn'),onAccount:()=>router.navigate('account')}),
    'couples-family':()=>couplesFamilyPage({couples:couplesFamily,onBack:()=>router.navigate('more'),onReader:openCouplesScripture}),
    'couples-cloud':()=>couplesCloudPage({couples:couplesCloud,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    'journey-groups':()=>journeyGroupsPage({journeyGroups,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account'),onEncouragements:()=>router.navigate('encouragements')}),
    encouragements:()=>encouragementsPage({encouragements,onBack:()=>router.navigate('journey-groups'),onAccount:()=>router.navigate('account')}),
    community:()=>communityPage({bridge:communityBridge,onNavigate:navigateGeneral,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    'live-rooms':()=>liveRoomsPage({liveRooms,onBack:()=>router.navigate('community'),onAccount:()=>router.navigate('account')}),
    'ministry-hub':()=>ministryHubPage({hub:ministryHub,onNavigate:navigateGeneral,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account'),onCongregation:()=>router.navigate('congregation')}),
    'leader-center':()=>leaderCenterPage({leaderCenter,onBack:()=>router.navigate('ministry-hub'),onAccount:()=>router.navigate('account'),onAssignments:()=>router.navigate('assignments'),onJourneyGroups:()=>router.navigate('journey-groups'),onTeamCenter:()=>router.navigate('team-center'),onCongregation:()=>router.navigate('congregation')}),
    'notification-center':()=>notificationCenterPage({notifications,onNavigate:navigateGeneral,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    workspace:()=>workspacePage({workspace,onNavigate:navigateGeneral,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    'team-center':()=>teamCenterPage({teamCenter,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    leaderboards:()=>leaderboardsPage({leaderboards,onBack:()=>router.navigate('community'),onAccount:()=>router.navigate('account')}),
    recognition:()=>congregationRecognitionPage({recognition,onBack:()=>router.navigate('community'),onAccount:()=>router.navigate('account'),onLeaderboards:()=>router.navigate('leaderboards')}),
    assignments:()=>assignmentsPage({assignments,onBack:()=>router.navigate('community'),onAccount:()=>router.navigate('account')}),
    'content-review':()=>contentReviewPage({review:contentReview,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account'),onCongregation:()=>router.navigate('congregation')}),
    reader:()=>readerPage({reader,vocabulary,furigana}),challenges:()=>challengesPage({challenges:personalChallenges,onBack:()=>router.navigate('more'),onReader:openChallengeScripture}),play:()=>gamesPage({games,onHome:()=>router.navigate('home')}),
    grow:()=>progressPage({progress,onTransform:()=>router.navigate('transform'),onPersonalityProfile:()=>router.navigate('personality-profile'),onPsychometrics:()=>router.navigate('psychometrics'),onAvatarVault:()=>router.navigate('avatar-vault'),onMyJourney:()=>router.navigate('my-journey')}),
    'my-journey':()=>myJourneyPage({myJourney,onBack:()=>router.navigate('grow'),onBibleQuest:()=>router.navigate('bible-quest')}),
    transform:()=>transformPage({transform,onGrow:()=>router.navigate('grow')}),
    'personality-profile':()=>personalityProfilePage({profile:personalityProfile,onBack:()=>router.navigate('grow'),onTransform:()=>router.navigate('transform')}),
    psychometrics:()=>psychometricsPage({psychometrics,onBack:()=>router.navigate('grow'),onQuickTransform:()=>router.navigate('transform')}),
    'avatar-vault':()=>avatarVaultPage({vault:avatarVault,onBack:()=>router.navigate('grow'),onAccount:()=>router.navigate('account')}),
    'my-mission':()=>missionPage({mission,onBack:()=>router.navigate('more'),onReview:()=>router.navigate('open-review'),onStudy:()=>router.navigate('study')}),
    calendar:()=>calendarPage({calendar,onBack:()=>router.navigate('more'),onAccount:()=>router.navigate('account')}),
    recordings:()=>recordingsPage({recordings,onHome:()=>router.navigate('home'),onAccount:()=>router.navigate('account')}),media:()=>recordingsPage({recordings,onHome:()=>router.navigate('home'),onAccount:()=>router.navigate('account')}),
    more:()=>morePage({pwaInstall,adminAccess,onAdmin:()=>{location.href='./admin'},onCommunity:()=>router.navigate('community'),onMinistryHub:()=>router.navigate('ministry-hub'),onNotificationCenter:()=>router.navigate('notification-center'),onWorkspace:()=>router.navigate('workspace'),onContentReview:()=>router.navigate('content-review'),onCouplesFamily:()=>router.navigate('couples-family'),onCouplesCloud:()=>router.navigate('couples-cloud'),onCongregation:()=>router.navigate('congregation'),onJourneyGroups:()=>router.navigate('journey-groups'),onTeamCenter:()=>router.navigate('team-center'),onChallenges:()=>router.navigate('challenges'),onBackup:()=>router.navigate('backup'),onMission:()=>router.navigate('my-mission'),onAccessibility:()=>router.navigate('accessibility'),onCalendar:()=>router.navigate('calendar'),onHelp:()=>router.navigate('help')}),
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
  shell=mountShell(root,{onNavigate:navigateGeneral,onAccountOpen:()=>router.navigate('account')});
  const pushOnboarding=mountPushOnboarding({push,session,ownerStorage:authStorage});
  contentReportingRuntime=mountContentReportingRuntime({reporting:contentReporting,getRoute:()=>store.getState().route,onAccount:()=>router.navigate('account'),onCongregation:()=>router.navigate('congregation')});
  accessibilityRuntime=mountAccessibilityRuntime({accessibility});
  tutorialOverlay=mountTutorialOverlay({tutorial,onNavigate:navigateGeneral});
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
  let accountProgressSessionKey='';
  const accountProgressSyncOwners=[
    ['general',progressCloudSync],
    ['bible-quest',bibleQuestCloudSync],
    ['weekly-journey',weeklyJourneyCloudSync],
    ['personal-challenges',personalChallengesCloudSync],
    ['explorer',explorerCloudSync]
  ];
  const syncAccountProgress=state=>{
    const current=state?.session||{},key=`${current.authenticated===true?'1':'0'}:${current.user?.id||''}`;
    if(key===accountProgressSessionKey)return;
    accountProgressSessionKey=key;
    if(current.authenticated!==true)return;
    void Promise.allSettled(accountProgressSyncOwners.map(([owner,service])=>
      Promise.resolve().then(()=>service.syncNow()).catch(error=>{
        console.warn(`Account progress resume unavailable for ${owner}; using local progress`,error);
        throw error;
      })
    ))
      .then(()=>router.navigate(router.current()))
      .catch(error=>console.warn('Account progress refresh unavailable',error));
  };
  let adminAccessSessionKey='';
  const syncAdminAccess=state=>{
    const current=state?.session||{},key=`${current.authenticated===true?'1':'0'}:${current.user?.id||''}`;
    if(key===adminAccessSessionKey)return;
    adminAccessSessionKey=key;
    if(current.authenticated===true)void adminAccess.refresh();else adminAccess.clear();
  };
  const syncShell=state=>{shell.updateSession(state.session);shell.updateProgress(state.progress)},
    unsubscribeStore=store.subscribe(syncShell),
    unsubscribeModeration=store.subscribe(syncModeration),
    unsubscribePushOnboarding=store.subscribe(syncPushOnboarding),
    unsubscribeBibleQuestAccount=store.subscribe(syncAccountProgress),
    unsubscribeAdminAccess=store.subscribe(syncAdminAccess);
  syncShell(store.getState());syncModeration(store.getState());syncPushOnboarding(store.getState());syncAccountProgress(store.getState());syncAdminAccess(store.getState());router.start();
  offlineShell.start().catch(error=>console.warn('Offline shell unavailable',error));
  session.boot().then(()=>{
    // Authentication must hydrate the requested route independently of cloud progress.
    if(session.isAuthenticated())router.navigate(router.current());
    presence.start().catch(error=>console.warn('Presence unavailable',error));
    if(session.isAuthenticated())account.ensureCurrentDevice().catch(error=>console.warn('Device registration failed',error));
  }).catch(error=>console.error('Session boot failed',error));
  window.addEventListener('pagehide',()=>{unsubscribeStore();unsubscribeModeration();unsubscribePushOnboarding();unsubscribeBibleQuestAccount();unsubscribeAdminAccess();adminAccess.clear();progressCloudSync.dispose();bibleQuestCloudSync.dispose();weeklyJourneyCloudSync.dispose();personalChallengesCloudSync.dispose();explorerCloudSync.dispose();pushOnboarding.dispose();push.dispose();contentReview.clear();contentModeration.clear();contentReportingRuntime.dispose();accessibilityRuntime.dispose();accessibility.dispose();tutorialOverlay.dispose();offlineShell.dispose();pwaInstall.dispose();liveRooms.clear();communityBridge.clear();encouragements.clear();journeyGroups.clear();assignments.clear();recognition.clear();leaderboards.clear();teamCenter.clear();void presence.dispose();workspace.clear();notifications.clear();congregation.clear();couplesCloud.clear();cloudNotes.clear();study.close();deepQuestions.close();storyJourney.close();wisdomSituations.close();adaptiveLearning.close();openReview.close();games.leave();recordings.dispose();session.dispose()},{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
