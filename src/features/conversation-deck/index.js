import { liveRoomsPage as legacyLiveRoomsPage } from '../live-rooms/index.js';
import { mountConversationDeck, conversationLanding, deckCopy } from '../live-rooms/conversation-deck.js';
const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function activeRoom(state,message,conversationMode=true){
  const room=state.room,ended=room.status==='ended';
  if(conversationMode&&ended)return `<section class="bq-panel"><h1>${esc(deckCopy('ended'))}</h1><button type="button" class="bq-secondary-button" data-live-room-leave>${esc(deckCopy('leave'))}</button></section>`;
  if(conversationMode)return `<header class="bq-community-head"><div><p class="bq-eyebrow">${esc(deckCopy('title'))}</p><h1>${esc(room.title)}</h1><p data-live-room-connection role="status"></p></div><button type="button" class="bq-secondary-button" data-live-rooms-back>${esc(deckCopy('back'))}</button></header><section class="bq-panel" data-live-room-active><p>${esc(deckCopy('code'))}: <code data-live-room-code>${esc(room.roomCode)}</code></p><p>${esc(deckCopy(state.isHost?'host':'member'))} ${esc(deckCopy('scope'))}</p><details><summary>${esc(deckCopy('participants'))} (<span data-live-room-count>${state.participants.length}</span>)</summary><ul data-live-room-participants></ul></details><div class="bq-account-actions"><button type="button" class="bq-secondary-button" data-live-room-reconnect>${esc(deckCopy('reconnect'))}</button><button type="button" class="bq-secondary-button" data-live-room-leave>${esc(deckCopy('leave'))}</button>${state.isHost?`<button type="button" class="bq-secondary-button" data-live-room-end>${esc(deckCopy('end'))}</button>`:''}</div></section><p data-live-room-message role="status"></p><div data-conversation-panel></div>`;

}
export function conversationDeckPage({liveRooms,onBack,onAccount,conversationMode=true,onScripture,onConversation,subscribeContext=()=>()=>{},initialCode='',onRoom=()=>{}}={}){
  return{title:conversationMode?deckCopy('title'):'Live Rooms',html:'<section class="bq-community" data-live-rooms-view></section>',mount(root){
    const view=root.querySelector('[data-live-rooms-view]');let disposed=false,busy=false,message='',activeKey='',deckPanel=null,pendingContext=false,initialJoinAttempted=false,lastCode='';
    const contextIdentity=()=>{const s=liveRooms.snapshot();return JSON.stringify([s.userId,s.activeCongregationId,s.activeRole,s.authenticated,s.remoteAvailable])};
    let contextKey=contextIdentity();
    const finish=()=>{busy=false;if(pendingContext&&!disposed){pendingContext=false;void load()}};
    const clearDeck=()=>{deckPanel?.dispose();deckPanel=null;activeKey=''};
    const bind=()=>{
      view.querySelector('[data-live-rooms-back]')?.addEventListener('click',()=>onBack?.(),{once:!conversationMode});
      view.querySelector('[data-live-rooms-account]')?.addEventListener('click',()=>onAccount?.(),{once:!conversationMode});
      view.querySelector('[data-live-room-create]')?.addEventListener('submit',create,{once:!conversationMode});
      view.querySelector('[data-live-room-join]')?.addEventListener('submit',join,{once:!conversationMode});
      view.querySelector('[data-live-room-reconnect]')?.addEventListener('click',reconnect,{once:!conversationMode});
      view.querySelector('[data-live-room-leave]')?.addEventListener('click',leave,{once:!conversationMode});
      view.querySelector('[data-live-room-end]')?.addEventListener('click',end,{once:!conversationMode});
    };
    const render=state=>{if(disposed)return;
      if(conversationMode){const code=state.room?.roomCode||'';if(code!==lastCode){lastCode=code;onRoom(code)}}
      const key=conversationMode&&state.room&&state.room.status!=='ended'?`${state.room.id}:${state.isHost}`:'';
      if(key&&key===activeKey&&deckPanel){
        const connection=view.querySelector('[data-live-room-connection]');connection.textContent=deckCopy(state.connected?'connected':'disconnected');
        const count=view.querySelector('[data-live-room-count]');count.textContent=String(state.participants.length);
        const people=view.querySelector('[data-live-room-participants]');const labels=state.participants.map(row=>row.displayName).join('\n');if(people.dataset.labels!==labels){people.dataset.labels=labels;people.innerHTML=state.participants.map(row=>`<li>${esc(row.displayName)}</li>`).join('')}
        view.querySelector('[data-live-room-message]').textContent=message;deckPanel.update(state);return;
      }
      clearDeck();
      if(conversationMode&&(!state.authenticated||!state.remoteAvailable)){view.innerHTML=`<h1>${esc(deckCopy('title'))}</h1><p>${esc(deckCopy(state.authenticated?'unavailable':'signIn'))}</p><button type="button" class="bq-primary-button" data-live-rooms-account>${esc(deckCopy('account'))}</button><button type="button" class="bq-secondary-button" data-live-rooms-back>${esc(deckCopy('back'))}</button>`;bind();return;}
      view.innerHTML=state.room?activeRoom(state,message,true):conversationLanding(state,message);bind();
      if(key){activeKey=key;deckPanel=mountConversationDeck(view.querySelector('[data-conversation-panel]'),{liveRooms,onScripture,initialState:state});render(state)}
    };

    const subscription=liveRooms.subscribe(render);
    async function load(){if(busy||disposed)return;busy=true;try{await liveRooms.load();const state=liveRooms.snapshot();if(conversationMode&&initialCode&&!initialJoinAttempted&&state.authenticated&&state.memberships.length&&!state.room){initialJoinAttempted=true;await liveRooms.join(initialCode)}message=''}catch(error){if(!['BQ_LIVE_ROOMS_AUTH_REQUIRED','BQ_LIVE_ROOMS_REMOTE_DISABLED'].includes(error?.code)){message=conversationMode?deckCopy('error'):(error?.message||'Live Rooms could not load.');render(liveRooms.snapshot())}}finally{finish()}}
    async function create(event){event.preventDefault();if(busy)return;busy=true;const data=new FormData(event.currentTarget);try{message='';await liveRooms.create({congregationId:data.get('congregation_id'),title:data.get('title'),...(conversationMode?{activity:'conversation-deck'}:{})})}catch(error){message=conversationMode?deckCopy('error'):(error?.message||'Could not create Live Room.');render(liveRooms.snapshot())}finally{finish()}}
    async function join(event){event.preventDefault();if(busy)return;busy=true;try{message='';await liveRooms.join(new FormData(event.currentTarget).get('code'))}catch(error){message=conversationMode?deckCopy('error'):(error?.message||'Could not join Live Room.');render(liveRooms.snapshot())}finally{finish()}}
    async function reconnect(){if(busy)return;busy=true;try{await liveRooms.reconnect();message=conversationMode?deckCopy('connected'):'Reconnected to the latest room state.';render(liveRooms.snapshot())}catch(error){message=conversationMode?deckCopy('error'):(error?.message||'Could not reconnect.');render(liveRooms.snapshot())}finally{finish()}}
    function leave(){message=conversationMode?'':'You left the Live Room.';liveRooms.leave();render(liveRooms.snapshot())}
    async function end(){if(busy)return;busy=true;try{await liveRooms.end();message=conversationMode?deckCopy('ended'):'Live Room ended.';render(liveRooms.snapshot())}catch(error){message=conversationMode?deckCopy('error'):(error?.message||'Could not end Live Room.');render(liveRooms.snapshot())}finally{finish()}}
    const unsubscribeContext=subscribeContext(()=>{if(disposed)return;const next=contextIdentity();if(next===contextKey)return;contextKey=next;if(lastCode)initialJoinAttempted=true;liveRooms.clear();message='';if(busy)pendingContext=true;else void load()});
    void load();return()=>{disposed=true;clearDeck();unsubscribeContext();subscription();liveRooms.disconnect()};
  }};
}

export function liveRoomsWithDeck(args){
  const page=legacyLiveRoomsPage(args);
  return {...page,mount(root){
    const cleanup=page.mount(root);
    const button=root.ownerDocument.createElement('button');
    button.type='button';button.className='bq-secondary-button';button.textContent=deckCopy('title');
    button.addEventListener('click',args.onConversation);root.append(button);
    return()=>{button.removeEventListener('click',args.onConversation);button.remove();cleanup?.()};
  }};
}
