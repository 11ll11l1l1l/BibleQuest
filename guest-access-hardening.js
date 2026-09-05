(() => {
  let intentionalAuth = false;

  function signedIn(){
    try{return Boolean(window.BQAccount?.session?.())}catch{return false}
  }

  function accountLayer(){return document.getElementById('bqAccountLayer')}

  function dismissForcedRegistration(){
    const layer=accountLayer();
    if(!layer||layer.classList.contains('hidden')||signedIn()||intentionalAuth)return;
    const register=layer.querySelector('[data-account-register]');
    if(!register)return;
    layer.classList.add('hidden');
    document.body.classList.remove('account-open');
    try{window.dispatchEvent(new CustomEvent('bq-guest-ready'))}catch{}
  }

  function injectGuestAccountAccess(){
    if(signedIn())return;
    document.querySelectorAll('.top-actions').forEach(host=>{
      if(host.querySelector('[data-account-open],[data-bq-guest-account]'))return;
      const button=document.createElement('button');
      button.type='button';
      button.className='account-avatar-btn';
      button.setAttribute('data-account-open','1');
      button.setAttribute('data-bq-guest-account','1');
      button.setAttribute('aria-label','Sign in or create a BibleQuest account');
      button.setAttribute('title','Sign in or create account');
      button.textContent='👤';
      host.appendChild(button);
    });
  }

  function refreshGuestState(){
    dismissForcedRegistration();
    injectGuestAccountAccess();
  }

  document.addEventListener('pointerdown',e=>{
    if(e.target.closest?.('[data-account-open],[data-auth-tab],[data-account-register],[data-account-login]'))intentionalAuth=true;
  },true);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-account-open],[data-auth-tab],[data-account-register],[data-account-login]'))intentionalAuth=true;
  },true);

  const observer=new MutationObserver(refreshGuestState);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',refreshGuestState,{once:true});
  window.addEventListener('bq-account-created',()=>{intentionalAuth=false;refreshGuestState()});
  window.addEventListener('bq-guest-ready',injectGuestAccountAccess);
  queueMicrotask(refreshGuestState);

  window.BQGuestAccess={
    refresh:refreshGuestState,
    isGuest:()=>!signedIn(),
    openAccount:()=>{intentionalAuth=true;return window.BQAccount?.open?.()}
  };
})();
