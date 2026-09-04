(() => {
  const MEDIA={
    adventurer:'assets/avatar-adventurer.webp', scholar:'assets/avatar-scholar.webp', shepherd:'assets/avatar-shepherd.webp', royal:'assets/avatar-royal.webp', locked:'assets/avatar-locked.webp', worldLocked:'assets/world-locked.webp', worldRevealed:'assets/world-revealed.webp'
  };
  const SOUND_KEY='biblequest_sound_enabled_v1';
  let audio=null,lastFeedback='',scanQueued=false;
  function state(){try{return JSON.parse(localStorage.getItem('biblequest_state_v4')||'{}')}catch{return {}}}
  function enabled(){const saved=localStorage.getItem(SOUND_KEY);if(saved!==null)return saved==='1';return Boolean(state().settings?.sound)}
  function setEnabled(v){localStorage.setItem(SOUND_KEY,v?'1':'0');syncButton();if(v)play('unlock')}
  function ctx(){if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(A)audio=new A()}if(audio?.state==='suspended')audio.resume().catch(()=>{});return audio}
  function tone(c,f,start,dur,g=.035,type='sine'){const o=c.createOscillator(),a=c.createGain(),t=c.currentTime+start;o.type=type;o.frequency.setValueAtTime(f,t);a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(g,t+.012);a.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(a).connect(c.destination);o.start(t);o.stop(t+dur+.03)}
  const patterns={
    tap:[[760,0,.055,.018]],
    correct:[[659,0,.11,.035],[784,.08,.13,.032],[988,.16,.16,.028]],
    wrong:[[330,0,.15,.03,'triangle'],[247,.11,.20,.025,'triangle']],
    unlock:[[523,0,.14,.032],[659,.09,.16,.033],[784,.19,.18,.033],[1047,.31,.24,.028]],
    achievement:[[523,0,.16,.03],[659,.1,.18,.032],[784,.21,.2,.034],[988,.34,.25,.034],[1319,.49,.3,.026]],
    complete:[[392,0,.16,.028,'triangle'],[523,.11,.2,.032],[659,.23,.22,.033],[784,.38,.3,.03]],
    reveal:[[262,0,.32,.02],[392,.12,.35,.024],[523,.27,.38,.028],[784,.48,.36,.025]]
  };
  function play(name){if(!enabled())return;const c=ctx();if(!c)return;(patterns[name]||patterns.tap).forEach(n=>tone(c,...n))}
  function soundButton(){let b=document.getElementById('bqSoundToggle');if(!b){b=document.createElement('button');b.id='bqSoundToggle';b.type='button';b.className='bq-sound-toggle';b.title='Sound effects';b.onclick=e=>{e.stopPropagation();setEnabled(!enabled())};const top=document.querySelector('.top-actions')||document.querySelector('.modern-home .home-top-actions');(top||document.body).appendChild(b);if(!top)b.classList.add('floating')}syncButton()}
  function syncButton(){const b=document.getElementById('bqSoundToggle');if(b){b.textContent=enabled()?'🔊':'🔇';b.setAttribute('aria-label',enabled()?'Mute sound effects':'Enable sound effects')}}
  function mediaImg(src,alt,cls=''){return `<img src="${src}" alt="${alt}" class="${cls}" loading="lazy" decoding="async">`}
  function decorateVault(){const root=document.getElementById('bqAvatarVault');if(!root||root.classList.contains('hidden'))return;const map={starter:MEDIA.adventurer,scholar:MEDIA.scholar,shepherd:MEDIA.shepherd,crown:MEDIA.royal};root.querySelectorAll('[data-vault-style]').forEach(card=>{const icon=card.querySelector('.vault-icon');if(!icon||icon.dataset.mediaDone)return;const id=card.dataset.vaultStyle,src=card.classList.contains('locked')?MEDIA.locked:map[id];if(src){icon.innerHTML=mediaImg(src,card.classList.contains('locked')?'Locked avatar':(card.querySelector('b')?.textContent||'Avatar'),'bq-vault-art');icon.dataset.mediaDone='1'}})}
  function masteryPct(){const m=state().mastery||{},vals=['Genesis','Exodus','History','Wisdom','Prophets','Gospels','Acts','Letters'].map(k=>Math.max(0,Math.min(100,Number(m[k]||0))));return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)}
  function decorateWorld(){const root=document.getElementById('bqWorldLayer');if(!root||root.classList.contains('hidden'))return;const map=root.querySelector('.world-map');if(!map||root.querySelector('.bq-world-art'))return;const pct=masteryPct(),art=document.createElement('section');art.className='bq-world-art';art.innerHTML=`<div class="bq-world-picture">${mediaImg(MEDIA.worldLocked,'Bible world hidden in clouds','bq-world-locked')}${mediaImg(MEDIA.worldRevealed,'Revealed Bible world','bq-world-revealed')}</div><div class="bq-world-reveal-text"><b>${pct}% of the world revealed</b><small>Complete learning activities to clear more of the clouds. Scripture itself stays available.</small></div>`;art.style.setProperty('--bq-reveal',`${pct}%`);map.before(art);play('reveal')}
  function feedbackSound(){const f=document.querySelector('#feedback');if(!f)return;const text=f.textContent.trim();if(!text||text===lastFeedback)return;lastFeedback=text;if(/correct|perfect|key idea|remembered|got it/i.test(text))play('correct');else if(/not yet|revisit|answer:/i.test(text))play('wrong')}
  function maybeComplete(){const text=document.querySelector('#bqJourneyLoop:not(.hidden)')?.textContent||document.querySelector('#app')?.textContent||'';if(/Journey complete/i.test(text)&&!document.body.dataset.bqJourneyCompleteSound){document.body.dataset.bqJourneyCompleteSound='1';play('complete')}if(!/Journey complete/i.test(text))delete document.body.dataset.bqJourneyCompleteSound}
  function scan(){soundButton();decorateVault();decorateWorld();feedbackSound();maybeComplete()}
  const style=document.createElement('style');style.textContent=`
    .bq-sound-toggle{border:0;background:rgba(255,255,255,.8);border-radius:999px;min-width:36px;height:36px;display:grid;place-items:center;font-size:17px;box-shadow:0 4px 14px rgba(0,0,0,.08)}
    .bq-sound-toggle.floating{position:fixed;right:14px;top:max(14px,env(safe-area-inset-top));z-index:9999}.bq-vault-art{width:72px;height:72px;object-fit:contain;border-radius:20px;display:block}
    .vault-card.locked .bq-vault-art{filter:grayscale(1);opacity:.72}.vault-icon:has(.bq-vault-art){font-size:0}
    .bq-world-art{margin:14px 0 18px;border-radius:24px;overflow:hidden;background:#dde4e6;box-shadow:0 12px 30px rgba(24,39,50,.12)}
    .bq-world-picture{position:relative;aspect-ratio:16/9;overflow:hidden;background:#dfe6e9}.bq-world-picture img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .bq-world-revealed{clip-path:inset(0 calc(100% - var(--bq-reveal)) 0 0);transition:clip-path .8s ease}.bq-world-locked{filter:saturate(.45) brightness(.96)}
    .bq-world-reveal-text{padding:12px 14px 14px;display:grid;gap:3px}.bq-world-reveal-text b{font-size:15px}.bq-world-reveal-text small{opacity:.72;line-height:1.35}
  `;document.head.appendChild(style);
  document.addEventListener('pointerdown',e=>{if(e.target.closest('button,[role="button"]')&&!e.target.closest('#bqSoundToggle'))play('tap')},{passive:true});
  document.addEventListener('click',e=>{const c=e.target.closest('[data-vault-style]:not([disabled])');if(c)setTimeout(()=>play('unlock'),30)});
  function queueScan(){if(scanQueued)return;scanQueued=true;requestAnimationFrame(()=>{scanQueued=false;scan()})}new MutationObserver(queueScan).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  window.BQMedia={...MEDIA,playSound:play,soundEnabled:enabled,setSoundEnabled:setEnabled};
  scan();
})();
