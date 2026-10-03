export function renderLauncherView({games,escapeHtml}){
  const memory=games.kidsMemory.mode;
  const art={
    'quick-recall':'assets/v4/games/game-quick-recall.png',
    'character-detective':'assets/v4/games/game-character-detective.png',
    'timeline-challenge':'assets/v4/games/game-timeline.png',
    'context-challenge':'assets/v4/games/game-context-challenge.png',
    'mixed-quest':'assets/v4/games/game-mixed-quest.png',
    'per-book-recall':'assets/v4/games/game-per-book-recall.png'
  };
  const gameCard=(mode,featured=false)=>{
    const last=mode.id==='per-book-recall'?null:games.lastResult(mode.id);
    const result=last?`<p class="bq-game-score" data-game-last="${escapeHtml(mode.id)}">Last result: <b>${last.score}/${last.total}</b> · +${last.gained} XP</p>`:'';
    const label=mode.id==='per-book-recall'?'Open recall library':`Play ${escapeHtml(mode.title)}`;
    return `<article class="bq-game-tile${featured?' is-featured':''}"><img src="${art[mode.id]||art['quick-recall']}" alt="" loading="lazy"><div><span>${escapeHtml(mode.kicker)}</span><h2>${escapeHtml(mode.title)}</h2>${featured?`<p>${escapeHtml(mode.description)}</p>`:''}${result}<button type="button" class="bq-primary-button" data-game-launch="${escapeHtml(mode.id)}">${label}</button></div></article>`;
  };
  const byId=new Map(games.modes.map(mode=>[mode.id,mode]));
  const quick=['character-detective','timeline-challenge'].map(id=>byId.get(id)).filter(Boolean).map(mode=>gameCard(mode)).join('');
  const deeper=['context-challenge','mixed-quest'].map(id=>byId.get(id)).filter(Boolean).map(mode=>gameCard(mode)).join('');
  const library=byId.get('per-book-recall');
  return `<header class="bq-v6-page-header"><p class="bq-eyebrow">PLAY</p><h1>Play</h1></header><section class="bq-game-featured">${gameCard(byId.get('quick-recall')||games.modes[0],true)}</section><section class="bq-game-section"><h2>Quick games</h2><div class="bq-game-tile-grid">${quick}<article class="bq-game-tile" data-memory-launch-card><img src="assets/v4/games/game-memory-meadow.png" alt="" loading="lazy"><div><span>${escapeHtml(memory.kicker)}</span><h2>${escapeHtml(memory.title)}</h2><button type="button" class="bq-primary-button" data-memory-open>Play</button></div></article></div></section><section class="bq-game-section"><h2>Think deeper</h2><div class="bq-game-tile-grid">${deeper}</div></section><section class="bq-game-together"><div><span>PLAY TOGETHER</span><h2>Pass, play, and learn together</h2><p>2–6 players · one device</p></div><button type="button" class="bq-primary-button" data-same-room-open>Start</button></section>${library?`<section class="bq-game-section"><h2>Bible library games</h2>${gameCard(library)}</section>`:''}<div class="bq-game-footer"><button type="button" class="bq-secondary-button" data-game-home>Back home</button></div>`;
}

export function renderMemoryView({state,escapeHtml}){
  const cards=state.cards.map((card,index)=>{
    const face=card.open||card.done,className=card.done?' is-matched':card.open?' is-open':'';
    const label=face?`Card ${index+1}: ${escapeHtml(card.icon)}${card.done?', matched':''}`:`Card ${index+1}: hidden`;
    return `<button type="button" class="bq-memory-card${className}" data-memory-index="${index}" aria-label="${label}" ${state.locked||card.open||card.done?'disabled':''}><span aria-hidden="true">${face?escapeHtml(card.icon):'?'}</span></button>`;
  }).join('');
  return `<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-game-launcher>All games</button><div class="bq-game-score" data-memory-moves>Moves <b>${state.moves}</b></div></section><section class="bq-panel bq-memory-meadow" data-memory-meadow><p class="bq-eyebrow">KIDS · MEMORY</p><div class="bq-memory-mark" aria-hidden="true"><img src="assets/v4/games/game-memory-meadow.png" alt=""></div><h1>Memory Meadow</h1><p>Find all ${state.pairs} pairs. Pick two cards at a time.</p><div class="bq-memory-grid" data-memory-grid style="--memory-columns:${state.columns}" aria-label="Memory Meadow cards">${cards}</div><p class="bq-memory-status" aria-live="polite">${state.locked?'Checking this pair…':'Choose a card.'}</p></section>`;
}

export function renderMemoryCompleteView(state){
  return `<section class="bq-panel bq-game-result" data-memory-complete><p class="bq-eyebrow">MEMORY MEADOW COMPLETE</p><div class="bq-game-medal" aria-hidden="true"><img src="assets/v4/memory-meadow/memory-complete-medal.png" alt=""></div><h1>All friends matched!</h1><p>You matched every pair in ${state.moves} moves.</p><div class="bq-game-stats"><div><b>${state.stars} ⭐</b><span>stars earned</span></div><div><b>${state.coins} 🪙</b><span>coins earned</span></div><div><b>0</b><span>XP — not awarded</span></div></div><p class="bq-memory-wallet">Total: ${state.totalStars} ⭐ · ${state.totalCoins} 🪙</p><div class="bq-game-actions"><button type="button" class="bq-primary-button" data-memory-replay>Play again</button><button type="button" class="bq-secondary-button" data-game-launcher>Choose another game</button><button type="button" class="bq-secondary-button" data-game-home>Back home</button></div></section>`;
}
