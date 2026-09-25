export function renderSameRoomSetupView(){
  return `<section class="bq-panel bq-games-head" data-same-room-setup><p class="bq-eyebrow">PLAY TOGETHER</p><h1>How many players?</h1><p>Pass this device after each question. Scores stay local to this session and do not award profile XP.</p><div class="bq-game-actions">${[2,3,4,5,6].map(count=>`<button type="button" class="bq-primary-button" data-same-room-start="${count}">${count} players</button>`).join('')}</div><button type="button" class="bq-secondary-button" data-game-launcher>All games</button></section>`;
}

export function renderSameRoomQuestionView({state,escapeHtml,gameSource}){
  const q=state.question;
  const progressPct=Math.round((state.index/Math.max(1,state.total))*100);
  const scoreboard=state.players.map(player=>`<div data-same-room-player="${escapeHtml(player.id)}"><b>${player.score}</b><span>${escapeHtml(player.name)}${player.active?' · turn':''}</span></div>`).join('');
  const choices=q.choices.map((choice,index)=>{
    const isCorrect=state.locked&&index===q.answer;
    const isWrong=state.locked&&index===state.selected&&!state.correct;
    const className=isCorrect?' is-correct':isWrong?' is-wrong':'';
    return `<button type="button" class="bq-game-choice${className}" data-same-room-answer="${index}" ${state.locked?'disabled':''}><span aria-hidden="true">${String.fromCharCode(65+index)}</span><b>${escapeHtml(choice)}</b></button>`;
  }).join('');
  const feedback=state.locked?`<div class="bq-game-explanation" data-same-room-feedback><strong>${state.correct?'Correct':'Review this one'}</strong><p>${escapeHtml(q.why)}</p><span>📖 ${escapeHtml(q.ref)}</span></div><button type="button" class="bq-primary-button" data-same-room-next>${state.index+1===state.total?'See final scoreboard':'Pass to next player'}</button>`:'';
  return `<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-game-launcher>All games</button><div class="bq-game-score" data-same-room-turn>Turn: <b>${escapeHtml(state.currentPlayer.name)}</b></div></section><section class="bq-panel bq-question-card" data-same-room-question="${escapeHtml(q.id)}"><p class="bq-eyebrow">PLAY TOGETHER · QUESTION ${state.index+1} OF ${state.total}</p><div class="bq-game-progress" aria-hidden="true"><i style="width:${progressPct}%"></i></div><div class="bq-game-stats" data-same-room-scoreboard>${scoreboard}</div><h1>${escapeHtml(q.q)}</h1><div class="bq-game-choices">${choices}</div>${feedback}<div class="bq-game-footer"><button type="button" class="bq-secondary-button" data-same-room-finish>Finish game</button></div>${gameSource}</section>`;
}

export function renderSameRoomCompleteView({state,escapeHtml}){
  const top=Math.max(...state.players.map(player=>player.score));
  const winners=state.players.filter(player=>player.score===top).map(player=>player.name);
  const result=winners.length===1?`Winner: ${winners[0]}`:`Tie: ${winners.join(' & ')}`;
  const scoreboard=state.players.map(player=>`<div data-same-room-player="${escapeHtml(player.id)}"><b>${player.score}</b><span>${escapeHtml(player.name)}</span></div>`).join('');
  return `<section class="bq-panel bq-game-result" data-same-room-complete><p class="bq-eyebrow">PLAY TOGETHER COMPLETE</p><h1>${escapeHtml(result)}</h1><div class="bq-game-stats" data-same-room-scoreboard>${scoreboard}</div><div class="bq-game-actions"><button type="button" class="bq-primary-button" data-same-room-open>Play again</button><button type="button" class="bq-secondary-button" data-game-launcher>All games</button></div></section>`;
}
