import { getContentProvenance } from '../../core/content-provenance.js';
import { sourceLabel } from '../../ui/source-labels.js';
import { legacyLiveQuestionPresentation, legacyLiveResultPresentation } from '../../v6/games/live-presentation.ts';
import { renderLauncherView, renderMemoryView, renderMemoryCompleteView } from './views/launcher-memory.js';
import { renderSameRoomSetupView, renderSameRoomQuestionView, renderSameRoomCompleteView } from './views/same-room.js';
import { renderDetectiveView, renderTimelineView } from './views/challenges.js';
import { renderRecallLibraryView, renderRecallQuestionView, renderRecallCompleteView } from './views/recall.js';
import { renderSoloCompleteView, renderSoloQuestionView } from './views/solo.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const GAME_SOURCE=sourceLabel(getContentProvenance('bq-game'),{compact:true});
const RECALL_SOURCE=sourceLabel(getContentProvenance('bq-recall'),{compact:true});
const requireRecallProvenance=state=>{if(typeof state?.source!=='string'||!state.source.trim()||typeof state?.license!=='string'||!state.license.trim())throw new Error('Recall source metadata is unavailable.');return state};

export function gamesPage({games,onHome}){
  return{
    title:'Play',html:'<section data-games-page></section>',
    mount(root){
      const host=root.querySelector('[data-games-page]');let disposed=false,memoryTimer=null;
      const clearMemoryTimer=()=>{if(memoryTimer!==null){clearTimeout(memoryTimer);memoryTimer=null}};
      const memoryWidth=()=>Math.max(1,Math.round(root.getBoundingClientRect().width||window.innerWidth||390));
      const render=state=>{
        if(disposed)return;
        if(state.phase==='launcher'){host.innerHTML=renderLauncherView({games,escapeHtml});return;}
        if(state.phase==='memory'){host.innerHTML=renderMemoryView({state,escapeHtml});return;}
        if(state.phase==='memory-complete'){host.innerHTML=renderMemoryCompleteView(state);return;}
        if(state.phase==='same-room-setup'){host.innerHTML=renderSameRoomSetupView();return;}
        if(state.phase==='same-room-question'){host.innerHTML=renderSameRoomQuestionView({state,escapeHtml,gameSource:GAME_SOURCE});return;}
        if(state.phase==='same-room-complete'){host.innerHTML=renderSameRoomCompleteView({state,escapeHtml});return;}
        if(state.phase==='detective'){host.innerHTML=renderDetectiveView({state,escapeHtml,gameSource:GAME_SOURCE});return;}
        if(state.phase==='timeline'){host.innerHTML=renderTimelineView({state,escapeHtml,gameSource:GAME_SOURCE});return;}
        if(state.phase==='recall-library'){host.innerHTML=renderRecallLibraryView({state:requireRecallProvenance(state),games,escapeHtml});return;}
        if(state.phase==='recall-question'){host.innerHTML=renderRecallQuestionView({state:requireRecallProvenance(state),escapeHtml});return;}
        if(state.phase==='recall-complete'){host.innerHTML=renderRecallCompleteView({state:requireRecallProvenance(state),escapeHtml});return;}
        if(state.phase==='complete'){host.innerHTML=renderSoloCompleteView({state,escapeHtml,resultView:legacyLiveResultPresentation(state)});return;}
        host.innerHTML=renderSoloQuestionView({state,escapeHtml,presentation:legacyLiveQuestionPresentation(state),recallSource:RECALL_SOURCE});
      };
      const loading=text=>{host.innerHTML=`<section class="bq-panel" role="status"><p class="bq-eyebrow">PLAY</p><h1>${escapeHtml(text)}</h1><p>Loading only the content this activity needs.</p></section>`};
      const showError=error=>{clearMemoryTimer();host.innerHTML=`<section class="bq-panel" role="alert"><h1>Game could not continue</h1><p>${escapeHtml(error?.message||'Unknown game error.')}</p><button type="button" class="bq-secondary-button" data-game-launcher>Back to games</button></section>`};
      const scheduleMemory=pending=>{clearMemoryTimer();if(!pending)return;memoryTimer=setTimeout(()=>{memoryTimer=null;if(disposed)return;try{const result=games.kidsMemory.resolve(pending.token);if(result.applied)render(result.state)}catch(error){showError(error)}},pending.delayMs)};
      const onClick=async event=>{
        const target=event.target instanceof Element?event.target:null;if(!target)return;
        try{
          if(target.closest('[data-game-home]')){clearMemoryTimer();games.leave();onHome();return}
          if(target.closest('[data-game-launcher]')){clearMemoryTimer();render(games.showLauncher());return}
          if(target.closest('[data-memory-open]')){clearMemoryTimer();render(games.kidsMemory.start(memoryWidth()));return}
          if(target.closest('[data-memory-replay]')){clearMemoryTimer();render(games.kidsMemory.replay(memoryWidth()));return}
          const memoryCard=target.closest('[data-memory-index]');if(memoryCard){const result=games.kidsMemory.flip(memoryCard.dataset.memoryIndex);render(result.state);scheduleMemory(result.pending);return}
          if(target.closest('[data-same-room-open]')){render(games.getSameRoomState());return}
          const sameStart=target.closest('[data-same-room-start]');if(sameStart){render(games.startSameRoom(sameStart.dataset.sameRoomStart));return}
          const sameAnswer=target.closest('[data-same-room-answer]');if(sameAnswer){render(games.answerSameRoom(sameAnswer.dataset.sameRoomAnswer));return}
          if(target.closest('[data-same-room-next]')){render(games.nextSameRoom());return}
          if(target.closest('[data-same-room-finish]')){render(games.finishSameRoom());return}
          if(target.closest('[data-detective-replay]')){render(games.replayDetective());return}
          if(target.closest('[data-timeline-replay]')){render(games.replayTimeline());return}
          if(target.closest('[data-timeline-check]')){render(games.checkTimeline());return}
          const move=target.closest('[data-timeline-move]');if(move){const [index,direction]=move.dataset.timelineMove.split(',');render(games.moveTimeline(index,direction));return}
          if(target.closest('[data-recall-library]')){loading('Opening recall library…');render(await games.returnRecallLibrary());return}
          if(target.closest('[data-recall-reveal]')){render(games.revealRecall());return}
          const rate=target.closest('[data-recall-rate]');if(rate){render(games.rateRecall(rate.dataset.recallRate));return}
          if(target.closest('[data-recall-replay]')){loading('Preparing this book again…');render(await games.replayRecall());return}
          const book=target.closest('[data-recall-book]');if(book){loading('Loading selected Bible book…');render(await games.startRecallBook(book.dataset.recallBook));return}
          const launch=target.closest('[data-game-launch]');if(launch){if(launch.dataset.gameLaunch==='per-book-recall'){loading('Opening recall library…');render(await games.openRecallLibrary())}else render(games.start(launch.dataset.gameLaunch));return}
          const answer=target.closest('[data-game-answer]');if(answer){render(games.answer(answer.dataset.gameAnswer));return}
          if(target.closest('[data-game-next]')){render(games.next());return}
          if(target.closest('[data-game-replay]')){render(games.replay());return}
        }catch(error){showError(error)}
      };
      const onInput=event=>{const target=event.target instanceof Element?event.target:null;if(target?.matches('[data-recall-search]'))render(games.setRecallQuery(target.value))};
      const onSubmit=event=>{const form=event.target instanceof HTMLFormElement?event.target:null;if(!form?.matches('[data-detective-form]'))return;event.preventDefault();try{const input=form.querySelector('[data-detective-answer]');render(games.answerDetective(input?.value||''))}catch(error){showError(error)}};
      host.addEventListener('click',onClick);host.addEventListener('input',onInput);host.addEventListener('submit',onSubmit);render(games.getState());
      return()=>{disposed=true;clearMemoryTimer();host.removeEventListener('click',onClick);host.removeEventListener('input',onInput);host.removeEventListener('submit',onSubmit);games.leave()};
    }
  };
}
