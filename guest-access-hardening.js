(() => {
  let intentionalAuth = false;

  function signedIn(){
    try{return Boolean(window.BQAccount?.session?.())}catch{return false}
  }

  function accountLayer(){return document.getElementById('bqAccountLayer')}

  function hideAccount(){
    const layer=accountLayer();
    if(layer)layer.classList.add('hidden');
    document.body.classList.remove('account-open');
  }

  function dismissForcedRegistration(){
    const layer=accountLayer();
    if(!layer||layer.classList.contains('hidden')||signedIn()||intentionalAuth)return;
    const register=layer.querySelector('[data-account-register]');
    if(!register)return;
    hideAccount();
    try{window.dispatchEvent(new CustomEvent('bq-guest-ready'))}catch{}
  }

  function ensureGuestExit(){
    const layer=accountLayer();
    if(!layer||signedIn())return;
    const authForm=layer.querySelector('[data-account-register],[data-account-login]');
    const card=layer.querySelector('.account-card');
    if(!authForm||!card||card.querySelector('[data-bq-continue-guest]'))return;
    const wrap=document.createElement('div');
    wrap.className='account-actions';
    wrap.style.marginTop='12px';
    const button=document.createElement('button');
    button.type='button';
    button.className='account-secondary';
    button.setAttribute('data-bq-continue-guest','1');
    button.textContent='Continue without an account';
    wrap.appendChild(button);
    const note=document.createElement('p');
    note.className='account-note';
    note.textContent='You can use BibleQuest without registering. Create an account later when you want cloud sync or account features.';
    wrap.appendChild(note);
    card.appendChild(wrap);
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
    ensureGuestExit();
    dismissForcedRegistration();
    injectGuestAccountAccess();
  }

  document.addEventListener('pointerdown',e=>{
    if(e.target.closest?.('[data-account-open],[data-auth-tab],[data-account-register],[data-account-login]'))intentionalAuth=true;
  },true);
  document.addEventListener('click',e=>{
    const guest=e.target.closest?.('[data-bq-continue-guest]');
    if(guest){
      e.preventDefault();
      intentionalAuth=false;
      hideAccount();
      try{window.dispatchEvent(new CustomEvent('bq-guest-ready'))}catch{}
      return;
    }
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
    closeAccount:()=>{intentionalAuth=false;hideAccount();refreshGuestState()},
    openAccount:()=>{intentionalAuth=true;return window.BQAccount?.open?.()}
  };
})();
