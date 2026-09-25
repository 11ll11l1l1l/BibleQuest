export function renderLauncherView({games,escapeHtml}){
  const memory=games.kidsMemory.mode;
  const cards=games.modes.map(mode=>{
    const last=mode.id==='per-book-recall'?null:games.lastResult(mode.id);
    const result=last?`<p class="bq-game-score" data-game-last="${escapeHtml(mode.id)}">Last result: <b>${last.score}/${last.total}</b> · +${last.gained} XP</p>`:'';
    const label=mode.id==='per-book-recall'?'Open recall library':`Play ${escapeHtml(mode.title)}`;
    return `<article class="bq-panel bq-game-card"><span>${escapeHtml(mode.kicker)}</span><h2>${escapeHtml(mode.title)}</h2><p>${escapeHtml(mode.description)}</p>${result}<button type="button" class="bq-primary-button" data-game-launch="${escapeHtml(mode.id)}">${label}</button></article>`;
  }).join('');
  return `<section class="bq-panel bq-games-head"><p class="bq-eyebrow">PLAY</p><h1>Bible games for every kind of practice</h1><p>Choose a game to review Scripture, strengthen recall, or play together. Your progress stays consistent across supported modes.</p></section><section class="bq-game-launcher" aria-label="BibleQuest games">${cards}<article class="bq-panel bq-game-card" data-memory-launch-card><span>${escapeHtml(memory.kicker)}</span><h2>${escapeHtml(memory.title)}</h2><p>${escapeHtml(memory.description)}</p><button type="button" class="bq-primary-button" data-memory-open>Play ${escapeHtml(memory.title)}</button></article><article class="bq-panel bq-game-card" data-same-room-card><span>PASS-AND-PLAY</span><h2>Play Together</h2><p>Share one device with 2–6 players, rotate turns, and keep a local scoreboard.</p><button type="button" class="bq-primary-button" data-same-room-open>Play Together</button></article></section><div class="bq-game-footer"><button type="button" class="bq-secondary-button" data-game-home>Back home</button></div>`;
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
  return `<section class="bq-panel bq-game-result" data-memory-complete><p class="bq-eyebrow">MEMORY MEADOW COMPLETE</p><div class="bq-game-medal" aria-hidden="true"><img src="assets/v4/games/game-memory-meadow.png" alt=""></div><h1>All friends matched!</h1><p>You matched every pair in ${state.moves} moves.</p><div class="bq-game-stats"><div><b>${state.stars} ⭐</b><span>stars earned</span></div><div><b>${state.coins} 🪙</b><span>coins earned</span></div><div><b>0</b><span>XP — not awarded</span></div></div><p class="bq-memory-wallet">Total: ${state.totalStars} ⭐ · ${state.totalCoins} 🪙</p><div class="bq-game-actions"><button type="button" class="bq-primary-button" data-memory-replay>Play again</button><button type="button" class="bq-secondary-button" data-game-launcher>Choose another game</button><button type="button" class="bq-secondary-button" data-game-home>Back home</button></div></section>`;
}