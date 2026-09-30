(async function(){
  'use strict';
  var RETURN_KEY='bq_transform_return_action';
  var RUNTIME_URL='transformation-v2.js';
  var GATE_TIMEOUT_MS=8000;
  var RECOVERY_TIMEOUT_MS=8000;
  var lastRecoveryError=null;

  function homeUrl(){return new URL('./',location.href).href;}
  function returnHome(){
    try{var ref=document.referrer?new URL(document.referrer):null;if(ref&&ref.origin===location.origin&&history.length>1){history.back();return;}}catch(_err){}
    location.replace(homeUrl());
  }
  function openMain(action){sessionStorage.setItem(RETURN_KEY,action);location.assign(homeUrl());}
  function typedError(message,kind){var error=new Error(message);error.bqKind=kind;return error;}
  function runtimeApi(){
    var api=window.BQ_TRANSFORMATION;
    return api&&api.mode==='rebuilt-v2'&&typeof api.open==='function'?api:null;
  }
  function clearRuntime(){
    try{delete window.BQ_TRANSFORMATION}catch(_err){window.BQ_TRANSFORMATION=undefined}
    document.querySelector('.bq-transform-v2')?.remove();
    document.body.classList.remove('bq-transform-v2-open');
  }
  function loadFreshRuntime(){
    return new Promise(function(resolve,reject){
      clearRuntime();
      var script=document.createElement('script');
      var done=false;
      var finish=function(error){
        if(done)return;done=true;clearTimeout(timer);
        if(error)reject(error);else resolve(runtimeApi());
      };
      var timer=setTimeout(function(){finish(typedError('Transform runtime recovery timed out.','module-timeout'));},RECOVERY_TIMEOUT_MS);
      script.dataset.bqTransformRecovery='1';
      script.src=RUNTIME_URL+'?bq-recover='+Date.now();
      script.onload=function(){var api=runtimeApi();if(api)finish();else finish(typedError('Transform runtime loaded without the rebuilt-v2 interface.','module'));};
      script.onerror=function(){finish(typedError('Transform runtime could not be loaded.','module'));};
      document.head.appendChild(script);
    });
  }
  async function recoverAndOpen(){
    lastRecoveryError=null;
    try{
      var api=await loadFreshRuntime();
      if(!api){lastRecoveryError=typedError('Transform runtime API is unavailable after recovery.','module');return null;}
      api.open();
      var root=document.querySelector('.bq-transform-v2');
      if(!root)lastRecoveryError=typedError('Transform runtime did not create its application root.','module');
      return root;
    }catch(error){lastRecoveryError=error;return null;}
  }
  async function showFailure(error,kind,fallbackMessage){
    var diagnostic=await window.BQDiagnostics?.diagnose?.(error,{kind:kind||error?.bqKind||'module',feature:'Transform'}).catch?.(function(){return null;});
    if(!diagnostic)diagnostic={code:navigator.onLine===false?'BQ-NET-001':'BQ-MOD-001',category:navigator.onLine===false?'Connection':'App module',title:navigator.onLine===false?'Device is offline':'Transform module failed',message:fallbackMessage,serverReachable:navigator.onLine===false?false:null};
    document.documentElement.classList.add('bq-account-confirmed');
    var networkLine=diagnostic.serverReachable===true?'Internet check passed. This points to an app/runtime problem.':diagnostic.serverReachable===false?'Internet/server reachability check failed. Connection is the likely cause.':'';
    document.body.innerHTML='<main class="bq-transform-load-failure" role="alert"><small>'+diagnostic.code+' · '+diagnostic.category+'</small><h1>Transform could not start</h1><p>'+diagnostic.message+'</p>'+(networkLine?'<small>'+networkLine+'</small>':'')+'<small>Technical detail: '+String(error?.message||fallbackMessage).replace(/[<>]/g,'')+'</small><div class="actions"><button type="button" data-bq-transform-retry>Try Transform again</button><a href="./">Return to BibleQuest</a></div></main>';
    window.BQDiagnostics?.report?.(diagnostic.code+' Transform startup: '+(error?.message||fallbackMessage),error?.stack||'',{kind:kind||error?.bqKind||'module',code:diagnostic.code,category:diagnostic.category,serverReachable:diagnostic.serverReachable,httpStatus:diagnostic.httpStatus,feature:'Transform'}).catch?.(function(){});
    document.querySelector('[data-bq-transform-retry]')?.addEventListener('click',function(){location.replace(location.pathname+'?bq-retry='+Date.now());});
  }
  async function waitForAccountGate(){
    var gate=window.BQStandaloneGate?.ready;
    if(!gate){await showFailure(typedError('Standalone account gate did not load.','module'),'module','BibleQuest could not verify your account for Transform.');return false;}
    var result=await Promise.race([
      Promise.resolve(gate).then(Boolean).catch(function(){return false;}),
      new Promise(function(resolve){setTimeout(function(){resolve('timeout');},GATE_TIMEOUT_MS);})
    ]);
    if(result==='timeout'){await showFailure(typedError('Transform account verification timed out.','module-timeout'),'module-timeout','Account verification took too long.');return false;}
    return result;
  }

  if(!await waitForAccountGate())return;

  var api=runtimeApi();
  var root=null;
  var firstError=null;
  if(api){
    try{api.open();root=document.querySelector('.bq-transform-v2');if(!root)firstError=typedError('Transform opened without creating its application root.','module');}catch(error){firstError=error;firstError.bqKind=firstError.bqKind||'module';}
  }else firstError=typedError('Transform rebuilt-v2 runtime is missing.','module');
  if(!root)root=await recoverAndOpen();
  if(!root){await showFailure(lastRecoveryError||firstError,(lastRecoveryError||firstError)?.bqKind||'module','BibleQuest tried a clean runtime recovery but the reflection tools are still unavailable.');return;}

  root.addEventListener('click',function(event){var target=event.target instanceof Element?event.target:null;if(!target)return;if(target.closest('[data-t2-close]')){event.preventDefault();event.stopImmediatePropagation();returnHome();return}if(target.closest('[data-t2-reader]')){event.preventDefault();event.stopImmediatePropagation();openMain('reader');return}if(target.closest('[data-t2-wisdom]')){event.preventDefault();event.stopImmediatePropagation();openMain('wisdom')}},true);
  root.addEventListener('keydown',function(event){if(event.key!=='Escape')return;event.preventDefault();event.stopImmediatePropagation();returnHome()},true);
})();
