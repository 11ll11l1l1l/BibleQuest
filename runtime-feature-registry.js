(() => {
  'use strict';
  const features={
    journey:()=>window.BQJourneyLoop,
    reader:()=>window.BQReader,
    versePeek:()=>window.BQVersePeek,
    smartReview:()=>window.BQOpenReview,
    ministry:()=>window.BQMinistry,
    media:()=>window.BQMediaLibrary,
    notifications:()=>window.BQNotifications,
    assignments:()=>window.BQAssignments,
    assignmentAdvanced:()=>window.BQAssignmentAdvanced,
    assignmentLaunch:()=>window.BQAssignmentLaunchHardening,
    leaderDashboard:()=>window.BQLeaderDashboard,
    recognition:()=>window.BQRecognition||window.BQCommunity,
    reporting:()=>window.BQContentReport,
    security:()=>window.BQSecurityCenter,
    adaptive:()=>window.BQAdaptiveLearning,
    accessibility:()=>window.BQAccessibility,
    diagnostics:()=>window.BQDiagnostics,
    recovery:()=>window.BQRuntimeRecovery,
    firstFive:()=>window.BQFirstFive,
    presence:()=>window.BQPresence,
    liveRooms:()=>window.BQLiveRooms,
    journeyGroups:()=>window.BQJourneyGroups,
    groupPlay:()=>window.BQGroupPlay,
    teams:()=>window.BQTeams,
    coupleCloud:()=>window.BQCoupleCloud,
    workspace:()=>window.BQWorkspace,
    contextLab:()=>window.BQContextLab,
    avatarVault:()=>window.BQAvatarVault,
    transformation:()=>window.BQ_TRANSFORMATION,
    study:()=>window.BQStudy,
    mission:()=>window.BQMission,
    world:()=>window.BQWorld,
    explorer:()=>window.BQExplorer,
    challenges:()=>window.BQChallenges
  };
  let last='';
  function report(){return Object.fromEntries(Object.entries(features).map(([k,get])=>{try{return[k,Boolean(get())]}catch{return[k,false]}}))}
  function check(){const r=report(),sig=JSON.stringify(r);if(sig===last)return r;last=sig;window.dispatchEvent(new CustomEvent('bq-runtime-capabilities',{detail:r}));const missing=Object.entries(r).filter(([,ok])=>!ok).map(([k])=>k);if(document.readyState==='complete'&&missing.length)window.BQDiagnostics?.report?.(`Runtime capability missing: ${missing.join(', ')}`,'',{kind:'capability'}).catch?.(()=>{});return r}
  window.addEventListener('load',()=>setTimeout(()=>{window.BQRuntimeRecovery?.repairInjected?.();check()},1800),{once:true});window.addEventListener('bq-account-created',()=>setTimeout(check,500));window.BQRuntimeRegistry={report,check,features:Object.keys(features)};
})();