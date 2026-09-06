const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const modeLabel=mode=>mode==='context-challenge'?'Context Challenge':'Quick Recall';

export function gamesPage({games,onHome}){
  return{
    title:'Play',
    html:'<section data-games-page></section>',
    mount(root){
      const host=root.querySelector('[data-games-page]');
      let disposed=false;

      const render=state=>{
        if(disposed)return;
        if(state.phase==='launcher'){
          host.innerHTML=`<section class="bq-panel bq-games-head"><p class="bq-eyebrow">PLAY</p><h1>Bible games, rebuilt cleanly</h1><p>Choose a verified game. Each round uses one shared launcher and scoring lifecycle.</p></section>
          <section class="bq-game-launcher" aria-label="BibleQuest games">${games.modes.map(mode=>`<article class="bq-panel bq-game-card"><span>${escapeHtml(mode.kicker)}</span><h2>${escapeHtml(mode.title)}</h2><p>${escapeHtml(mode.description)}</p><button type="button" class="bq-primary-button" data-game-launch="${escapeHtml(mode.id)}">Play ${escapeHtml(mode.title)}</button></article>`).join('')}</section>
          <div class="bq-game-footer"><button type="button" class="bq-secondary-button" data-game-home>Back home</button></div>`;
          return;
        }

        if(state.phase==='complete'){
          const pct=Math.round((state.score/Math.max(1,state.total))*100);
          const message=pct>=90?'Excellent recall. Keep connecting the details to the bigger story.':pct>=70?'Good round. Review the explanations and keep strengthening the weak spots.':'Useful round. The misses point to what to review next.';
          host.innerHTML=`<section class="bq-panel bq-game-result" data-game-complete><p class="bq-eyebrow">ROUND COMPLETE</p><div class="bq-game-medal" aria-hidden="true">${pct>=90?'🏆':pct>=70?'🌟':'🌱'}</div><h1>${state.score}/${state.total}</h1><p>${escapeHtml(message)}</p><div class="bq-game-stats"><div><b>${pct}%</b><span>accuracy</span></div><div><b>+${state.gained}</b><span>XP</span></div><div><b>${escapeHtml(modeLabel(state.mode))}</b><span>mode</span></div></div><div class="bq-game-actions"><button type="button" class="bq-primary-button" data-game-replay>Play again</button><button type="button" class="bq-secondary-button" data-game-launcher>Choose another game</button><button type="button" class="bq-secondary-button" data-game-home>Back home</button></div></section>`;
          return;
        }

        const q=state.question;
        const typeLabel=q.mode==='connection'?'Connections':q.level>=2?'Context':'Recall';
        const progressPct=Math.round((state.index/Math.max(1,state.total))*100);
        host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-game-launcher>All games</button><div class="bq-game-score" data-game-score>Score <b>${state.score}</b> · +${state.gained} XP</div></section>
        <section class="bq-panel bq-question-card" data-game-question="${escapeHtml(q.id)}">
          <div class="bq-game-meta"><span>${escapeHtml(q.book)} · ${escapeHtml(typeLabel)}</span><span data-game-progress>Question ${state.index+1} of ${state.total}</span></div>
          <div class="bq-game-progress" aria-hidden="true"><i style="width:${progressPct}%"></i></div>
          <h1>${escapeHtml(q.q)}</h1>
          <div class="bq-game-choices">${q.choices.map((choice,index)=>{
            const isCorrect=state.locked&&index===q.answer;
            const isWrong=state.locked&&index===state.selected&&!state.correct;
            const className=isCorrect?' is-correct':isWrong?' is-wrong':'';
            return `<button type="button" class="bq-game-choice${className}" data-game-answer="${index}" ${state.locked?'disabled':''}><span aria-hidden="true">${String.fromCharCode(65+index)}</span><b>${escapeHtml(choice)}</b></button>`;
          }).join('')}</div>
          <div class="bq-game-feedback" aria-live="polite">${state.locked?`<div class="bq-game-explanation" data-game-feedback><strong>${state.correct?'Correct':'Review this one'}</strong><p>${escapeHtml(q.why)}</p><span>📖 ${escapeHtml(q.ref)}</span><small>${q.mode==='basic'?'DIRECT / RECALL':'CONTEXT / CONNECTION'}</small></div><button type="button" class="bq-primary-button" data-game-next>${state.index+1===state.total?'See results':'Next question'}</button>`:''}</div>
        </section>`;
      };

      const safeRender=next=>{try{render(next)}catch(error){host.innerHTML=`<section class="bq-panel" role="alert"><h1>Game could not continue</h1><p>${escapeHtml(error?.message||'Unknown game error.')}</p><button type="button" class="bq-secondary-button" data-game-launcher>Back to games</button></section>`}};
      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;
        if(!target)return;
        try{
          if(target.closest('[data-game-home]')){games.leave();onHome();return}
          if(target.closest('[data-game-launcher]')){render(games.showLauncher());return}
          const launch=target.closest('[data-game-launch]');if(launch){render(games.start(launch.dataset.gameLaunch));return}
          const answer=target.closest('[data-game-answer]');if(answer){render(games.answer(answer.dataset.gameAnswer));return}
          if(target.closest('[data-game-next]')){render(games.next());return}
          if(target.closest('[data-game-replay]')){render(games.replay());return}
        }catch(error){safeRender(games.getState());const message=host.querySelector('[data-game-feedback] p');if(message)message.textContent=error?.message||'Game action failed.'}
      };

      host.addEventListener('click',onClick);
      render(games.showLauncher());
      return()=>{disposed=true;host.removeEventListener('click',onClick);games.leave()};
    }
  };
}
