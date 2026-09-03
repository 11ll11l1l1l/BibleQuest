(() => {
  const KEY = 'biblequest_sequence_v1';
  const jsonCache = new Map();
  let manifest = null;
  let round = null;

  const esc = (s = '') => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function stats() { try { return JSON.parse(localStorage.getItem(KEY) || '{"played":0,"solved":0,"streak":0,"best":0}'); } catch { return { played: 0, solved: 0, streak: 0, best: 0 }; } }
  function saveStats(next) { localStorage.setItem(KEY, JSON.stringify(next)); }

  async function fetchJson(path) {
    if (jsonCache.has(path)) return jsonCache.get(path);
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${path} returned ${r.status}`);
    const data = await r.json();
    jsonCache.set(path, data);
    return data;
  }

  function injectButton() {
    const grid = document.querySelector('.mode-grid');
    if (!grid || document.querySelector('[data-sequence-open]')) return;
    const b = document.createElement('button');
    b.className = 'mode-card sequence-mode';
    b.setAttribute('data-sequence-open', '1');
    b.innerHTML = '<span>🧩</span><b>Verse Order</b><small>Rebuild a real passage</small>';
    grid.appendChild(b);
  }

  function layer() {
    let el = document.getElementById('bqSequenceLayer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bqSequenceLayer';
      el.className = 'sequence-layer hidden';
      document.body.appendChild(el);
    }
    return el;
  }

  function show(html) {
    const el = layer();
    el.innerHTML = `<main class="sequence-app">${html}</main>`;
    el.classList.remove('hidden');
    document.body.classList.add('sequence-open');
    bind();
    el.scrollTop = 0;
  }
  function close() { layer().classList.add('hidden'); document.body.classList.remove('sequence-open'); round = null; }

  function loading(text) {
    show(`<section class="sequence-loading"><div class="sequence-icon">🧩</div><div class="eyebrow">Verse Order</div><h1>${esc(text)}</h1><p>Loading only the book used by this round.</p><div class="sequence-load"><i></i></div><button class="sequence-text" data-sequence-close>Cancel</button></section>`);
  }

  async function openLibrary() {
    try {
      loading('Opening the Bible shelf…');
      manifest = manifest || await fetchJson('data/packs/manifest.json');
      renderBooks();
    } catch (e) { error('Verse Order is not ready yet', e.message); }
  }

  function renderBooks(filter = '') {
    const books = manifest?.bible_books || [];
    const q = filter.toLowerCase().trim();
    const shown = books.filter(b => b.name.toLowerCase().includes(q));
    const s = stats();
    let recent = null;
    try { recent = JSON.parse(localStorage.getItem('biblequest_reader_v1') || 'null'); } catch {}
    show(`<header class="sequence-top"><button data-sequence-close>← BibleQuest</button><b>Verse Order</b><span>🧩</span></header><section class="sequence-panel">
      <div class="eyebrow">Close-reading game</div><h1>Can you rebuild the passage?</h1><p class="sequence-intro">BibleQuest takes four consecutive verses from a real BSB chapter, hides the verse numbers, and shuffles them. Put the passage back in order.</p>
      <div class="sequence-stats"><div><b>${s.solved}</b><small>solved</small></div><div><b>${s.best}</b><small>best streak</small></div></div>
      ${recent?.code && books.some(b => b.code === recent.code) ? `<button class="sequence-recent" data-sequence-book="${esc(recent.code)}"><span>↗</span><div><small>USE LAST READ BOOK</small><b>${esc(recent.name || recent.code)}</b></div></button>` : ''}
      <input class="answer-input" id="sequenceSearch" value="${esc(filter)}" placeholder="Choose a Bible book…" autocomplete="off">
      <div class="sequence-books">${shown.map(b => `<button data-sequence-book="${esc(b.code)}"><span>📖</span><div><b>${esc(b.name)}</b><small>${Number(b.verses).toLocaleString()} verses</small></div><i>›</i></button>`).join('')}</div>
      <div class="sequence-note"><b>Why this is safe:</b> the game answer is the original order of the selected public-domain Bible text. No AI interpretation is used to decide correctness.</div>
    </section>`);
  }

  async function startBook(code) {
    const meta = manifest?.bible_books?.find(b => b.code === code);
    if (!meta) return;
    try {
      loading(`Preparing ${meta.name}…`);
      const rows = await fetchJson(meta.path);
      newRound(meta, rows);
    } catch (e) { error(`Could not load ${meta.name}`, e.message, true); }
  }

  function newRound(meta, rows) {
    const byChapter = new Map();
    rows.forEach(v => {
      const c = Number(v.c), n = Number(v.v);
      if (!Number.isFinite(c) || !Number.isFinite(n) || !v.t) return;
      if (!byChapter.has(c)) byChapter.set(c, []);
      byChapter.get(c).push({ c, v: n, t: v.t });
    });
    const windows = [];
    for (const [chapter, verses] of byChapter.entries()) {
      verses.sort((a, b) => a.v - b.v);
      for (let i = 0; i <= verses.length - 4; i++) {
        const w = verses.slice(i, i + 4);
        if (w.every((x, j) => j === 0 || x.v === w[j - 1].v + 1)) windows.push({ chapter, verses: w });
      }
    }
    if (!windows.length) return error(`${meta.name} has no usable four-verse window`, 'Try another Bible book.', true);
    const chosen = windows[Math.floor(Math.random() * windows.length)];
    const original = chosen.verses.map(x => ({ ...x }));
    let current = shuffle(original.map(x => ({ ...x })));
    if (current.every((x, i) => x.v === original[i].v)) current = [...current.slice(1), current[0]];
    round = { meta, rows, chapter: chosen.chapter, original, current, checked: false, solved: false };
    renderRound();
  }

  function renderRound(message = '') {
    const s = stats();
    show(`<header class="sequence-top"><button data-sequence-books>← Books</button><b>${esc(round.meta.name)}</b><button data-sequence-close>×</button></header><section class="sequence-panel">
      <div class="sequence-round-head"><div><div class="eyebrow">Verse Order</div><h1>${esc(round.meta.name)} ${round.chapter}</h1></div><span class="sequence-streak">🔥 ${s.streak}</span></div>
      <p class="sequence-instruction">Arrange the four verse texts from first to last. Verse numbers stay hidden until you solve it.</p>
      <div class="sequence-list">${round.current.map((v, i) => `<div class="sequence-card ${round.solved ? 'solved' : ''}"><span class="sequence-pos">${i + 1}</span><p>${esc(v.t)}</p>${round.solved ? `<sup>v.${v.v}</sup>` : `<span class="sequence-moves"><button data-sequence-move="${i},-1" ${i === 0 ? 'disabled' : ''}>↑</button><button data-sequence-move="${i},1" ${i === round.current.length - 1 ? 'disabled' : ''}>↓</button></span>`}</div>`).join('')}</div>
      ${message ? `<div class="sequence-message ${round.solved ? 'good' : ''}">${message}</div>` : ''}
      <div class="sequence-actions">${round.solved ? `<button class="sequence-primary" data-sequence-next>Next ${esc(round.meta.name)} passage</button><button class="sequence-secondary" data-sequence-books>Change book</button>` : `<button class="sequence-primary" data-sequence-check>Check order</button>`}</div>
      <div class="sequence-note"><b>Source:</b> Berean Standard Bible public-domain/CC0 data · actual ${esc(round.meta.name)} ${round.chapter} verse sequence.</div>
    </section>`);
  }

  function move(index, delta) {
    if (!round || round.solved) return;
    const to = index + delta;
    if (to < 0 || to >= round.current.length) return;
    [round.current[index], round.current[to]] = [round.current[to], round.current[index]];
    renderRound();
  }

  function check() {
    if (!round || round.solved) return;
    const ok = round.current.every((v, i) => v.v === round.original[i].v);
    const s = stats();
    s.played++;
    if (ok) {
      s.solved++;
      s.streak++;
      s.best = Math.max(s.best || 0, s.streak);
      round.solved = true;
      saveStats(s);
      renderRound(`✓ Correct. The sequence is ${round.original.map(v => `${round.meta.name} ${round.chapter}:${v.v}`).join(' → ')}.`);
    } else {
      s.streak = 0;
      saveStats(s);
      renderRound('Not yet. Re-read how each sentence connects to the next, then rearrange and try again.');
    }
  }

  function error(title, detail = '', back = false) {
    show(`<section class="sequence-loading"><div class="sequence-icon">📚</div><div class="eyebrow">Verse Order</div><h1>${esc(title)}</h1><p>${esc(detail)}</p><div class="sequence-actions">${back ? '<button class="sequence-primary" data-sequence-books>Back to books</button>' : '<button class="sequence-primary" data-sequence-close>Back to BibleQuest</button>'}</div></section>`);
  }

  function bind() {
    const el = layer();
    el.querySelectorAll('[data-sequence-close]').forEach(b => b.onclick = close);
    el.querySelectorAll('[data-sequence-books]').forEach(b => b.onclick = () => renderBooks());
    el.querySelectorAll('[data-sequence-book]').forEach(b => b.onclick = () => startBook(b.dataset.sequenceBook));
    el.querySelectorAll('[data-sequence-move]').forEach(b => b.onclick = () => { const [i, d] = b.dataset.sequenceMove.split(',').map(Number); move(i, d); });
    const checkButton = el.querySelector('[data-sequence-check]'); if (checkButton) checkButton.onclick = check;
    const next = el.querySelector('[data-sequence-next]'); if (next) next.onclick = () => newRound(round.meta, round.rows);
    const search = el.querySelector('#sequenceSearch');
    if (search) search.oninput = e => {
      const value = e.target.value;
      renderBooks(value);
      const n = layer().querySelector('#sequenceSearch');
      if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
    };
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-sequence-open]');
    if (b) { e.preventDefault(); openLibrary(); }
  });
  const observer = new MutationObserver(injectButton);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  injectButton();
})();
