import { localization } from '../../app/localization.js';
import { CONVERSATION_SERIES, CONVERSATION_CARDS, conversationText, conversationCard, normalizeConversationDeck } from '../../content/conversation-decks.js';
import './conversation-deck.css';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy={
  en:{ended:'Session ended',title:'Small-group session',intro:'Read, discuss and pray together. Join a live session in your active congregation.',back:'Back to Groups',account:'Open account',signIn:'Sign in to join a small-group session.',unavailable:'Live sessions need an account and a connection to your congregation.',join:'Join a session',code:'Session code',create:'Host a session',name:'Session title',congregation:'Congregation',hostOnly:'A facilitator, leader, pastor or admin in the active congregation can host.',scope:'Share the code only with your congregation. This session does not collect private answers.',participants:'Participants',reconnect:'Reconnect',leave:'Leave session',end:'End session',connected:'Connected',disconnected:'Showing the last received card. Reconnect or refresh to check for updates.',choose:'Choose cards',series:'Series',preview:'Your preview',shared:'Current shared card',waiting:'Waiting for the host to send a card.',previous:'Previous',next:'Next',send:'Send this card',sending:'Sending…',read:'Read passage',refresh:'Refresh shared card',gesture:'Swipe left or right here to preview. Swipe up here to send.',selection:'Choose at least one card. Previewing does not send.',error:'Could not update the session. Check your connection, refresh and try again.',position:'Card',of:'of',selected:'selected',host:'You are the host.',member:'You joined this session.'},
  tl:{ended:'Tapos na ang sesyon',title:'Sesyon ng maliit na grupo',intro:'Sama-samang magbasa, mag-usap at manalangin. Sumali sa sesyon ng aktibo mong kongregasyon.',back:'Bumalik sa Mga Grupo',account:'Buksan ang account',signIn:'Mag-sign in para sumali sa sesyon ng grupo.',unavailable:'Kailangan ng account at koneksiyon sa iyong kongregasyon ang mga live na sesyon.',join:'Sumali sa sesyon',code:'Code ng sesyon',create:'Mamahala ng sesyon',name:'Pamagat ng sesyon',congregation:'Kongregasyon',hostOnly:'Maaaring mamahala ang facilitator, leader, pastor o admin ng aktibong kongregasyon.',scope:'Ibahagi ang code sa iyong kongregasyon lamang. Walang kinokolektang pribadong sagot ang sesyong ito.',participants:'Mga kalahok',reconnect:'Kumonekta muli',leave:'Umalis sa sesyon',end:'Tapusin ang sesyon',connected:'Konektado',disconnected:'Huling natanggap na card ang ipinapakita. Kumonekta muli o i-refresh para sa mga pagbabago.',choose:'Pumili ng mga card',series:'Serye',preview:'Iyong preview',shared:'Kasalukuyang ibinahaging card',waiting:'Hinihintay ang card mula sa namamahala.',previous:'Nakaraan',next:'Susunod',send:'Ipadala ang card',sending:'Ipinapadala…',read:'Basahin ang talata',refresh:'I-refresh ang ibinahaging card',gesture:'Mag-swipe pakaliwa o pakanan dito para mag-preview. Mag-swipe pataas dito para ipadala.',selection:'Pumili ng kahit isang card. Hindi awtomatikong ipinapadala ang preview.',error:'Hindi ma-update ang sesyon. Tingnan ang koneksiyon, i-refresh at subukang muli.',position:'Card',of:'sa',selected:'napili',host:'Ikaw ang namamahala.',member:'Kasali ka sa sesyong ito.'},
  ceb:{ended:'Natapos na ang sesyon',title:'Sesyon sa gamay nga grupo',intro:'Magbasa, maghisgot ug mag-ampo nga magkauban. Apil sa sesyon sa imong aktibong kongregasyon.',back:'Balik sa Mga Grupo',account:'Ablihi ang account',signIn:'Sign in aron makaapil sa sesyon sa grupo.',unavailable:'Kinahanglan og account ug koneksiyon sa imong kongregasyon ang live nga mga sesyon.',join:'Apil sa sesyon',code:'Code sa sesyon',create:'Pagdumala og sesyon',name:'Titulo sa sesyon',congregation:'Kongregasyon',hostOnly:'Ang facilitator, leader, pastor o admin sa aktibong kongregasyon makadumala sa sesyon.',scope:'Ipaambit ang code sa imong kongregasyon lamang. Walay pribadong tubag nga kolektahon niini nga sesyon.',participants:'Mga partisipante',reconnect:'Konektar pag-usab',leave:'Biya sa sesyon',end:'Taposa ang sesyon',connected:'Konektado',disconnected:'Ang kataposang nadawat nga card ang gipakita. Konektar pag-usab o i-refresh aron masusi ang mga kausaban.',choose:'Pilia ang mga card',series:'Serye',preview:'Imong preview',shared:'Kasamtangang gipaambit nga card',waiting:'Naghulat sa card gikan sa nagdumala.',previous:'Nauna',next:'Sunod',send:'Ipadala kining card',sending:'Gipadala…',read:'Basaha ang teksto',refresh:'I-refresh ang gipaambit nga card',gesture:'Swipe pakaliwa o pakanan dinhi aron mag-preview. Swipe pataas dinhi aron ipadala.',selection:'Pilia ang labing menos usa ka card. Ang preview dili awtomatikong ipadala.',error:'Dili ma-update ang sesyon. Susiha ang koneksiyon, i-refresh ug sulayi pag-usab.',position:'Card',of:'sa',selected:'napili',host:'Ikaw ang nagdumala.',member:'Miapil ka niini nga sesyon.'},
};
export const deckCopy=(key,locale=localization.getLocale())=>(copy[locale]||copy.en)[key]||copy.en[key]||key;
export const conversationLanding=(state,message='')=>{
  const t=deckCopy,rows=state.memberships.filter(row=>row.canHost);
  return `<header class="bq-community-head"><div><p class="bq-eyebrow">BIBLEQUEST · 7.1</p><h1>${esc(t('title'))}</h1><p>${esc(t('intro'))}</p></div><button type="button" class="bq-secondary-button" data-live-rooms-back>${esc(t('back'))}</button></header>${message?`<p role="status">${esc(message)}</p>`:''}<section class="bq-panel"><h2>${esc(t('join'))}</h2><form class="bq-account-form" data-live-room-join><label>${esc(t('code'))}<input name="code" maxlength="8" minlength="4" autocomplete="off" autocapitalize="characters" required></label><button type="submit" class="bq-primary-button" ${state.memberships.length?'':'disabled'}>${esc(t('join'))}</button></form><p>${esc(t('scope'))}</p></section>${rows.length?`<section class="bq-panel"><h2>${esc(t('create'))}</h2><form class="bq-account-form" data-live-room-create><label>${esc(t('congregation'))}<select name="congregation_id" required>${rows.map(row=>`<option value="${esc(row.congregationId)}">${esc(row.congregation?.name||t('congregation'))}</option>`).join('')}</select></label><label>${esc(t('name'))}<input name="title" maxlength="80" value="${esc(t('title'))}" required></label><button type="submit" class="bq-primary-button">${esc(t('create'))}</button></form></section>`:`<p>${esc(t('hostOnly'))}</p>`}`;
};
export function mountConversationDeck(host,{liveRooms,onScripture=()=>{},initialState}){
  const locale=localization.getLocale(),t=key=>deckCopy(key,locale),text=value=>conversationText(value,locale);
  let state=initialState,disposed=false,busy=false,index=0,pointer=null,sharedKey='',refreshing=false;
  const restored=normalizeConversationDeck(state.room?.state);
  let seriesId=restored?.seriesId||CONVERSATION_SERIES[0].id;
  let selected=restored?[...restored.cardIds]:CONVERSATION_CARDS.filter(row=>row.seriesId===seriesId).map(row=>row.id);
  if(restored)index=Math.max(0,selected.indexOf(restored.activeCardId));
  const cardHtml=card=>card?`<h3>${esc(text(card.title))}</h3><p class="bq-deck-reference">${esc(card.reference)}</p><p>${esc(text(card.prompt))}</p><button type="button" class="bq-secondary-button" data-deck-read="${esc(card.id)}">${esc(t('read'))}</button>`:`<p>${esc(t('waiting'))}</p>`;
  host.className='bq-conversation-deck';
  host.innerHTML=`<p class="bq-form-message" role="status" aria-live="polite" data-deck-message></p>${state.isHost?`<details class="bq-panel" data-deck-setup><summary>${esc(t('choose'))}</summary><label>${esc(t('series'))}<select data-deck-series>${CONVERSATION_SERIES.map(row=>`<option value="${esc(row.id)}" ${row.id===seriesId?'selected':''}>${esc(text(row.title))}</option>`).join('')}</select></label><fieldset data-deck-choices></fieldset></details><section class="bq-panel" aria-label="${esc(t('preview'))}"><p class="bq-eyebrow">${esc(t('preview'))}</p><p>${esc(t('selection'))}</p><div data-deck-preview></div><p data-deck-position role="status" aria-live="polite"></p><div class="bq-deck-actions"><button type="button" class="bq-secondary-button" data-deck-previous>${esc(t('previous'))}</button><button type="button" class="bq-secondary-button" data-deck-next>${esc(t('next'))}</button><button type="button" class="bq-primary-button" data-deck-send>${esc(t('send'))}</button></div><div class="bq-deck-gesture" data-deck-gesture tabindex="0" role="group" aria-label="${esc(t('gesture'))}">${esc(t('gesture'))}</div></section>`:''}<section class="bq-panel" data-deck-shared aria-label="${esc(t('shared'))}" aria-live="polite"><p class="bq-eyebrow">${esc(t('shared'))}</p><div data-deck-current></div></section><button type="button" class="bq-secondary-button" data-deck-refresh>${esc(t('refresh'))}</button>`;
  const query=selector=>host.querySelector(selector),message=query('[data-deck-message]');
  const report=()=>{if(!disposed)message.textContent=t('error')};
  function choices(){
    if(!state.isHost)return;
    query('[data-deck-choices]').innerHTML=`<legend>${esc(t('choose'))}</legend>`+CONVERSATION_CARDS.filter(row=>row.seriesId===seriesId).map(card=>`<label><input type="checkbox" value="${esc(card.id)}" ${selected.includes(card.id)?'checked':''}>${esc(text(card.title))}</label>`).join('');
  }
  function preview(){
    if(!state.isHost)return;
    index=Math.max(0,Math.min(index,selected.length-1));
    query('[data-deck-preview]').innerHTML=cardHtml(conversationCard(selected[index]));
    query('[data-deck-position]').textContent=selected.length?`${t('position')} ${index+1} ${t('of')} ${selected.length}`:`0 ${t('selected')}`;
    query('[data-deck-previous]').disabled=busy||index===0;
    query('[data-deck-next]').disabled=busy||index>=selected.length-1;
    query('[data-deck-send]').disabled=!selected.length;
    query('[data-deck-send]').setAttribute('aria-disabled',String(busy));
    host.setAttribute('aria-busy',String(busy));
    query('[data-deck-send]').textContent=t(busy?'sending':'send');
  }
  function move(delta){if(!state.isHost||busy)return;index=Math.max(0,Math.min(selected.length-1,index+delta));preview()}
  async function send(){
    if(disposed||busy||!state.isHost||!selected.length)return;
    busy=true;message.textContent='';preview();
    try{await liveRooms.publishDeck({activity:'conversation-deck',version:1,seriesId,cardIds:[...selected],activeCardId:selected[index]})}catch{report()}finally{busy=false;if(!disposed)preview()}
  }
  async function refresh(){
    if(disposed||refreshing||!state.room)return;
    refreshing=true;
    try{await liveRooms.refresh();if(!disposed)message.textContent=''}catch{report()}finally{refreshing=false}
  }
  const onChange=event=>{
    if(event.target.matches('[data-deck-series]')){seriesId=event.target.value;selected=CONVERSATION_CARDS.filter(row=>row.seriesId===seriesId).map(row=>row.id);index=0;choices();preview()}
    else if(event.target.matches('[data-deck-choices] input')){selected=Array.from(query('[data-deck-choices]').querySelectorAll('input:checked'),node=>node.value);preview()}
  };
  const onClick=event=>{
    const button=event.target.closest('button');if(!button||!host.contains(button))return;
    if(button.matches('[data-deck-previous]'))move(-1);
    if(button.matches('[data-deck-next]'))move(1);
    if(button.matches('[data-deck-send]'))void send();
    if(button.matches('[data-deck-refresh]'))void refresh();
    if(button.matches('[data-deck-read]')){const card=conversationCard(button.dataset.deckRead);if(card)onScripture(card)}
  };
  const gesture=query('[data-deck-gesture]');
  const down=event=>{if(event.isPrimary===false||event.button>0)return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY};try{gesture.setPointerCapture?.(event.pointerId)}catch{}};
  const up=event=>{if(!pointer||pointer.id!==event.pointerId)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer=null;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.2)move(dx<0?1:-1);else if(dy<-64&&Math.abs(dy)>Math.abs(dx)*1.2)void send()};
  const cancel=()=>{pointer=null};
  const key=event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1)}};
  host.addEventListener('change',onChange);host.addEventListener('click',onClick);
  gesture?.addEventListener('pointerdown',down);gesture?.addEventListener('pointerup',up);gesture?.addEventListener('pointercancel',cancel);gesture?.addEventListener('keydown',key);
  const visible=()=>{if(host.ownerDocument.visibilityState!=='hidden')void refresh()};
  const timer=setInterval(visible,5000);host.ownerDocument.addEventListener('visibilitychange',visible);
  function update(next){
    if(disposed)return;state=next;
    const deck=normalizeConversationDeck(next.room?.state),signature=deck?`${deck.seriesId}:${deck.activeCardId}`:'waiting';
    if(signature!==sharedKey){sharedKey=signature;query('[data-deck-current]').innerHTML=cardHtml(deck?conversationCard(deck.activeCardId):null)}
  }
  choices();preview();update(initialState);
  return{update,dispose(){disposed=true;clearInterval(timer);host.ownerDocument.removeEventListener('visibilitychange',visible);host.removeEventListener('change',onChange);host.removeEventListener('click',onClick);gesture?.removeEventListener('pointerdown',down);gesture?.removeEventListener('pointerup',up);gesture?.removeEventListener('pointercancel',cancel);gesture?.removeEventListener('keydown',key)}};
}
