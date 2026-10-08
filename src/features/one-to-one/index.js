import { localization } from '../../app/localization.js';
import { loadV7VisualRegistry, findV7Visual } from '../../ui/visual-assets.js';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const text = key => localization.t(`v7.pairing.${key}`);
const copy = key => escapeHtml(text(key));

// Consume only Lane D resolver outputs, never raw unreviewed agent records.
// The optional provider is installed by the shared integration after registry
// publication; the CSS-only art remains complete if it is absent or offline.
const VERIFIED_LOCAL_IMAGE=/^\/v7\/images\/[a-z0-9-]+\/[a-z0-9-]+\.(?:webp|png|jpe?g)$/i;
function safeHeroAsset(value){
  if(!value||typeof value!=='object')return null;
  const src=String(value.src||''),assetId=String(value.assetId||'');
  if(!VERIFIED_LOCAL_IMAGE.test(src)||!/^bqv7-[a-z0-9-]+$/.test(assetId))return null;
    const rawX=Number(value.focalPoint?.x),rawY=Number(value.focalPoint?.y);
  const focalX=Number.isFinite(rawX)&&rawX>=0&&rawX<=1?rawX:.5;
  const focalY=Number.isFinite(rawY)&&rawY>=0&&rawY<=1?rawY:.5;
  return Object.freeze({src,assetId,focalX,focalY});
}

async function defaultOneToOneCover(key) {
  const registry = await loadV7VisualRegistry();
  // Live heading overlays this hero; explicitly select CLEAN so an embedded
  // TYPE caption is not rendered a second time or cropped under the scrim.
  return findV7Visual(registry, [key], localization.getLocale());
}

export function oneToOnePage({service,subscribeContext,onAccount,onCongregation,onBack,onAuthoring=()=>{},onAssignments=()=>{},onPair=()=>{},onInvite=()=>{},isContextReady=()=>false,coverProvider=defaultOneToOneCover}) {
  return {
    title:'ONE 2 ONE',
    html:`<section class="bq-panel bq-one2one-home"><header class="bq-one2one-home__hero" data-one-to-one-hero data-cover-state="fallback"><div class="bq-one2one-home__art" data-one-to-one-art aria-hidden="true"><span class="bq-one2one-home__art-mark"></span></div><div class="bq-one2one-home__hero-copy"><p class="bq-one2one-home__eyebrow">ONE 2 ONE</p><h1>ONE 2 ONE</h1><p>${copy('overviewIntro')}</p></div></header><div class="bq-one2one-home__primary"><button type="button" class="bq-primary-button" data-pair-invite>${escapeHtml(localization.t('v7.pairing.invite'))}</button></div><section class="bq-one2one-home__relationships" aria-label="${copy('overviewReady')}"><h2>${copy('overviewReady')}</h2><p data-pair-status role="status" aria-live="polite"></p><ul data-pair-results></ul><button type="button" class="bq-secondary-button" data-pair-retry>${copy('reload')}</button></section><section class="bq-one2one-home__tools"><h2>${copy('leaderTools')}</h2><div class="bq-one2one-home__links"><button type="button" class="bq-secondary-button" data-pair-authoring>${escapeHtml(localization.t('v7.authoring.title'))}</button><button type="button" class="bq-secondary-button" data-pair-assignments>${escapeHtml(localization.t('v7.assignment.title'))}</button></div></section><nav class="bq-one2one-home__context" aria-label="${copy('contextTools')}"><button type="button" class="bq-secondary-button" data-pair-account>${copy('account')}</button><button type="button" class="bq-secondary-button" data-pair-congregation>${copy('congregation')}</button><button type="button" class="bq-secondary-button" data-pair-back>${copy('backGrow')}</button></nav></section>`,
    mount(root) {
      const status=root.querySelector('[data-pair-status]'),results=root.querySelector('[data-pair-results]');
      let operation=0,disposed=false;
      const hero=root.querySelector('[data-one-to-one-hero]');
      // Artwork is decorative and cannot replace the live translated heading.
      // A failed request, revoked image or unapproved URL leaves original CSS art.
      if(typeof coverProvider==='function'&&hero?.querySelector){
        void Promise.resolve().then(()=>coverProvider('hero:one-to-one-overview')).then(result=>{
          if(disposed)return;
          const asset=safeHeroAsset(result),art=hero.querySelector('[data-one-to-one-art]');
          if(!asset||!art?.ownerDocument?.createElement)return;
          const image=art.ownerDocument.createElement('img');
          image.className='bq-one2one-home__cover-image';
          image.alt='';
          image.setAttribute('aria-hidden','true');
          image.decoding='async';
          if(image.style)image.style.objectPosition=`${Math.round(asset.focalX*100)}% ${Math.round(asset.focalY*100)}%`;
          image.loading='eager';
          image.addEventListener('load',()=>{if(!disposed&&image.isConnected)hero.dataset.coverState='ready'});
          image.addEventListener('error',()=>{image.remove();if(!disposed)hero.dataset.coverState='fallback'});
          image.src=asset.src;
          art.prepend(image);
        }).catch(()=>{if(!disposed)hero.dataset.coverState='fallback'});
      }
      const load=async()=>{
        if(disposed)return;
        const request=++operation;
        results.innerHTML='';
        if(!isContextReady()){status.textContent=text('overviewChanged');return;}
        status.textContent=text('overviewLoading');
        try{
          const pairs=await service.listPairs();
          if(disposed||request!==operation)return;
          status.textContent=text(pairs.length?'overviewReady':'overviewEmpty');
          results.innerHTML=pairs.map(pair=>`<li class="bq-one2one-home__pair"><button type="button" data-open-pair="${escapeHtml(pair.id)}">${escapeHtml(localization.t('v7.pairing.title'))} — ${escapeHtml(localization.t(`v7.pairing.${pair.state}`))}<span aria-hidden="true"> →</span></button></li>`).join('');
        }catch{
          if(disposed||request!==operation)return;
          status.textContent=text('error');
        }
      };
      const bindings=[['retry',()=>void load()],['account',onAccount],['congregation',onCongregation],['back',onBack],['authoring',onAuthoring],['assignments',onAssignments],['invite',onInvite]].map(([key,fn])=>[root.querySelector(`[data-pair-${key}]`),fn]);
      for(const [button,fn] of bindings)button.addEventListener('click',fn);
      const openPair=event=>{const button=event.target.closest?.('[data-open-pair]');if(button&&!disposed)onPair(button.getAttribute('data-open-pair'))};
      results.addEventListener('click',openPair);
      const unsubscribe=subscribeContext(()=>{if(disposed)return;void load();});
      void load();
      return ()=>{disposed=true;operation++;unsubscribe();results.removeEventListener('click',openPair);for(const [button,fn] of bindings)button.removeEventListener('click',fn)};
    }
  };
}
