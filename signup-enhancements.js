(() => {
  const CFG=window.BQ_CLOUD_CONFIG||{};
  const FIELD='church_group';
  const isTaglish=()=> (localStorage.getItem('biblequest_ui_language_v1')||'taglish')==='taglish';
  const copy=()=>isTaglish()?{
    label:'Church / fellowship group',
    hint:'Private sa account mo. Para makatulong sa group support at organization; hindi ito ipinapakita sa leaderboard.',
    placeholder:'Hal. JIL Tsukuba, church name, o none yet',
    creating:'Ginagawa ang account…'
  }:{
    label:'Church / fellowship group',
    hint:'Private to your account. Used for group support and organization; not shown on leaderboards.',
    placeholder:'e.g. JIL Tsukuba, church name, or none yet',
    creating:'Creating account…'
  };
  let loadedGroup=false,groupValue='';

  function churchField(value=''){
    const c=copy();
    const label=document.createElement('label');
    label.dataset.churchGroupField='1';
    label.innerHTML=`${c.label}<span class="account-note">${c.hint}</span><input name="${FIELD}" maxlength="120" placeholder="${c.placeholder}">`;
    label.querySelector('input').value=value||'';
    return label;
  }

  function inject(root=document){
    root.querySelectorAll?.('form[data-account-register],form[data-account-profile]').forEach(form=>{
      if(form.querySelector(`[name="${FIELD}"]`))return;
      const anchor=form.querySelector('[name="preferred_name"]')?.closest('label');
      const field=churchField(form.matches('[data-account-profile]')?groupValue:'');
      if(anchor?.nextSibling)anchor.parentNode.insertBefore(field,anchor.nextSibling);else if(anchor)anchor.after(field);else form.prepend(field);
    });
    if(window.BQAccount?.session?.()&&!loadedGroup)loadGroup();
  }

  async function loadGroup(){
    const client=window.BQAccount?.client?.(),session=window.BQAccount?.session?.();
    if(!client||!session||loadedGroup)return;
    loadedGroup=true;
    const {data}=await client.from('bible_profiles').select('church_group').eq('user_id',session.user.id).maybeSingle();
    groupValue=String(data?.church_group||'');
    document.querySelectorAll(`form[data-account-profile] [name="${FIELD}"]`).forEach(i=>{if(!i.value)i.value=groupValue});
  }

  function showError(form,message){
    form.querySelector('.account-error[data-signup-error]')?.remove();
    const box=document.createElement('div');box.className='account-error';box.dataset.signupError='1';box.textContent=message;
    form.appendChild(box);
  }

  async function immediateSignup(form){
    const client=window.BQAccount?.client?.();
    if(!client||!CFG.supabaseUrl||!CFG.publishableKey)throw new Error('Account service is not ready. Please try again.');
    const fd=new FormData(form);
    const avatarRoot=form.querySelector('[data-avatar-builder]');
    let avatar={};try{avatar=JSON.parse(avatarRoot?.dataset.avatar||'{}')}catch{}
    const payload={
      full_name:String(fd.get('full_name')||'').trim(),
      preferred_name:String(fd.get('preferred_name')||'').trim(),
      church_group:String(fd.get(FIELD)||'').trim(),
      email:String(fd.get('email')||'').trim(),
      password:String(fd.get('password')||''),
      avatar
    };
    if(payload.full_name.length<2||payload.preferred_name.length<2)throw new Error('Please enter your name and preferred name.');
    if(payload.password.length<8)throw new Error('Use a password with at least 8 characters.');
    const button=form.querySelector('button[type="submit"],button.account-primary');
    const old=button?.textContent;if(button){button.disabled=true;button.textContent=copy().creating}
    try{
      const resp=await fetch(`${CFG.supabaseUrl}/functions/v1/bq-signup`,{
        method:'POST',
        headers:{'content-type':'application/json','apikey':CFG.publishableKey},
        body:JSON.stringify(payload)
      });
      const body=await resp.json().catch(()=>({}));
      if(!resp.ok)throw new Error(body.error||'Could not create your account.');
      const signed=await client.auth.signInWithPassword({email:payload.email,password:payload.password});
      if(signed.error)throw signed.error;
      groupValue=payload.church_group;loadedGroup=true;
    }finally{if(button){button.disabled=false;button.textContent=old||'Create account'}}
  }

  document.addEventListener('submit',e=>{
    const form=e.target.closest?.('form[data-account-register]');
    if(form){
      e.preventDefault();e.stopImmediatePropagation();
      immediateSignup(form).catch(err=>showError(form,err.message||String(err)));
      return;
    }
    const profileForm=e.target.closest?.('form[data-account-profile]');
    if(profileForm){
      const church=String(new FormData(profileForm).get(FIELD)||'').trim().slice(0,120);
      groupValue=church;loadedGroup=true;
      setTimeout(async()=>{
        const client=window.BQAccount?.client?.(),session=window.BQAccount?.session?.();
        if(client&&session)await client.from('bible_profiles').update({church_group:church||null,updated_at:new Date().toISOString()}).eq('user_id',session.user.id);
      },0);
    }
  },true);

  const obs=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)inject(n)});
  document.addEventListener('DOMContentLoaded',()=>{inject();obs.observe(document.documentElement,{childList:true,subtree:true})});
  setTimeout(inject,100);
})();
