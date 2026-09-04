(() => {
  const DONE = 'biblequest_tutorial_complete_v3';
  const LEGACY_DONE = 'biblequest_tutorial_complete_v2';
  const SPRITE = 'assets/tutorial-trainer-sprite.webp';
  let root = null, index = 0, recoveryCode = '', saved = false;

  const esc = (s = '') => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const cards = (items) => `<div class="bqt-mini-grid">${items.map(([icon,title,sub]) => `<div class="bqt-mini"><span>${icon}</span><div><b>${esc(title)}</b><small>${esc(sub)}</small></div></div>`).join('')}</div>`;

  function cloneActual(selector) {
    const app = document.getElementById('app');
    const source = app?.querySelector(selector);
    if (!source || root?.contains(source)) return '';
    const copy = source.cloneNode(true);
    copy.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    copy.querySelectorAll('input,textarea,select,button,a').forEach(el => {
      el.tabIndex = -1;
      el.setAttribute('aria-hidden', 'true');
    });
    return copy.outerHTML;
  }

  function screen(kind) {
    let actual = '';
    if (kind === 'home') actual = cloneActual('.modern-home') || cloneActual('.hero');
    if (kind === 'daily') actual = cloneActual('.modern-focus') || cloneActual('.quest-card.daily');
    if (kind === 'games') actual = cloneActual('.mode-grid');
    if (kind === 'nav') actual = cloneActual('.bottom');

    const fallback = {
      home: cards([
        ['🎮','Play','Games & challenges'],['📖','Read','Bible, context & notes'],
        ['🌱','Grow','Mission, rewards & journey'],['👥','Together','Tasks, live rooms & couples']
      ]),
      daily: `<div class="bqt-ui-daily"><span>⚡</span><div><small>TODAY · 2–3 MIN</small><b>Daily 5</b><p>One balanced session for steady Bible learning.</p></div><i>›</i></div><div class="bqt-ui-review">🧠 <b>Smart Review</b><small>Adaptive recall</small></div>`,
      games: cards([
        ['🎯','Quick Play','10 mixed questions'],['🧠','Smart Review','Weak & due questions'],
        ['🗣️','Who Said It?','Real BSB verse text'],['➡️','What Happens Next?','Open Bible Stories'],
        ['🧩','Verse Order','Put a verse in order'],['🕵️','Bible Detective','Guess from clues'],
        ['⏳','Timeline','Put events in order'],['🧠','Context Mode','Understand why, not just who']
      ]),
      together: cards([
        ['📮','Assignments & Tasks','Leader activities and due dates'],['🟢','Community Live','Who is online'],
        ['📡','Live BibleQuest Room','One code · many phones'],['🎮','Play Together','One phone · whole room'],
        ['🏁','Church Challenges','7-day, 30-day, Acts, family'],['💞','Couple Journey','Private linked journey'],
        ['❤️','Grow Together','Couples conversations & repair'],['🏆','Leaderboards & Awards','Today · week · all time']
      ]),
      group: cards([
        ['⚡','Team Bible Sprint','Pass-the-phone trivia'],['🕵️','Detective Hot Seat','Reveal clues'],
        ['🔎','Verse Hunt','Find the passage first'],['💬','Conversation Circle','Deep prompts + Scripture'],
        ['🧭','Wisdom Table','Discuss careful biblical wisdom'],['🤝','Pair & Share','Two-person listening'],
        ['💞','Couples Growth','Open Grow Together'],['🏆','Group Leaderboard','Today · week · all time']
      ]),
      live: `<div class="bqt-room"><div><small>FOR FACILITATORS / LEADERS</small><b>Start a room</b><span>Friday Bible Night</span><button>Start live room</button></div><div><small>FOR MEMBERS</small><b>Join a room</b><span>ABC234</span><button>Join with code</button></div></div><div class="bqt-live-modes">⚡ Quiz · 📊 Poll · 🔎 Verse Hunt · 💬 Discussion · 🧭 Wisdom</div>`,
      read: cards([
        ['📚','Bible Reader','BSB · Tagalog ULB · NLT'],['📘','Guided Study','Read → Observe → Understand → Apply'],
        ['אΩ','Hebrew & Greek Context','Lemma, morphology & careful context'],['🗂️','Bible Workspace','Highlights, bookmarks, notes & search'],
        ['🏕️','Story Journey','50 illustrated foundational stories'],['🗃️','Recall Decks','Open questions by Bible book']
      ]),
      grow: cards([
        ['🎯','My Mission','Focused ~6 minute next step'],['🗺️','Bible World','Travel Scripture with your avatar'],
        ['🎁','Avatar Vault','Unlock looks through milestones'],['🧭','Situations & Wisdom','Real-life decisions'],
        ['🧬','Transformation','Personality, bias & Growth Lab'],['🎖️','Achievements','Learning, wisdom, reading & consistency']
      ]),
      nav: `<div class="bqt-bottom-nav"><span>🏡<b>Home</b></span><span>🗺️<b>Journey</b></span><span>💭<b>Think</b></span><span>🌱<b>Me</b></span></div>`
    }[kind] || '';

    return `<figure class="bqt-shot"><div class="bqt-shot-top"><span></span><b>Actual BibleQuest interface</b><em></em></div><div class="bqt-shot-body">${actual || fallback}</div><figcaption>${actual ? 'Live capture of the interface on your screen.' : 'Same controls and labels used by the BibleQuest interface.'}</figcaption></figure>`;
  }

  function featureList() {
    return `<div class="bqt-feature-map">
      <details open><summary>🎮 Play <small>10+ ways to learn</small></summary><p>Daily 5 · Smart Review · Quick Play · Who Said It? · What Happens Next? · Verse Order · Bible Detective · Characters & Places · Timeline · Context Mode</p></details>
      <details><summary>📖 Read <small>Scripture + study tools</small></summary><p>Bible Reader · Guided Study · Hebrew & Greek Context · Bible Workspace · Story Journey · Recall Decks · Review Mistakes</p></details>
      <details><summary>🌱 Grow <small>progress + application</small></summary><p>My Mission · Bible World · Avatar Vault · Situations & Wisdom · Transformation · Think Deeper · Achievements</p></details>
      <details><summary>👥 Together <small>people + church</small></summary><p>Assignments · Community Live · Live Rooms · Play Together · Church Challenges · Couple Journey · Grow Together · Leaderboards · Badges · Congregation Roster</p></details>
    </div>`;
  }

  const steps = () => [
    recoveryCode ? {
      trainer: 'thoughtful', side: 'right', eyebrow: 'KEEP THIS SAFE', title: 'First: save your recovery code',
      body: `<p>BibleQuest does not require email confirmation. Your email is your sign-in ID, so this private recovery code proves control of the account if you forget your password.</p><div class="bqt-code" data-bqt-code>${esc(recoveryCode)}</div><button class="bqt-copy" data-bqt-copy>Copy recovery code</button><label class="bqt-check"><input type="checkbox" data-bqt-saved ${saved?'checked':''}> I saved this code somewhere outside BibleQuest.</label><p class="bqt-note">Keep it in a password manager, secure note, or printed copy. Never share it. Creating a new recovery code later invalidates the old one.</p>`
    } : null,
    {
      trainer: 'welcome', side: 'left', eyebrow: 'WELCOME TO BIBLEQUEST', title: 'There is much more here than a quiz app',
      body: `<p>I’ll show you where the strongest features live and when to use them. The four big areas are <b>Play, Read, Grow, and Together</b>.</p>${screen('home')}<p class="bqt-tip"><b>Trainer tip:</b> When you are unsure what to do, start with Daily 5. When you have a specific goal, open one of the four hubs.</p>`, action: ['home','Show Home']
    },
    {
      trainer: 'down', side: 'right', eyebrow: 'BEST DAILY START', title: 'Daily 5 + Smart Review keep the app simple',
      body: `<p><b>Daily 5</b> gives you a short balanced session instead of making you choose among dozens of activities. <b>Smart Review</b> uses weak and due material when you want targeted recall.</p>${screen('daily')}<ol><li>Open <b>Home</b>.</li><li>Tap <b>Daily 5</b>.</li><li>Read the explanation even when you answer correctly.</li><li>Use <b>Smart Review</b> when it shows material due for review.</li></ol>`, action: ['daily','Try Daily 5']
    },
    {
      trainer: 'right', side: 'left', eyebrow: 'GAME LIBRARY', title: 'Play is not one game—it is a learning toolbox',
      body: `<p>Use different games for different kinds of memory. Quick Play tests broad recall; Context Mode asks why; Timeline trains sequence; Who Said It? uses real verse text; What Happens Next? tests story flow.</p>${screen('games')}<div class="bqt-callout"><b>Useful pattern</b><p>Mix recall + context + story instead of repeating only trivia. Wrong answers feed review instead of being treated as failure.</p></div>`, action: ['play','Open Play games']
    },
    {
      trainer: 'left', side: 'right', eyebrow: 'ONE PHONE · WHOLE ROOM', title: 'Play Together turns BibleQuest into a group activity',
      body: `<p>This is one of BibleQuest’s easiest group features: put people in the roster, pass one phone around, and choose a mode.</p>${screen('group')}<ol><li>Open <b>Together → Play Together</b>.</li><li>Add at least two people to the congregation/group roster.</li><li>Pick a mode.</li><li>For trivia, pass the phone to the named player. For conversation modes, discuss together.</li></ol><p class="bqt-tip"><b>Important:</b> factual games can score answers. Conversation and wisdom modes reward participation—not “who sounds most spiritual.”</p>`, action: ['group','Open Play Together']
    },
    {
      trainer: 'surprise', side: 'left', eyebrow: 'ONE CODE · MANY PHONES', title: 'Live Rooms are for everyone joining on their own phone',
      body: `<p>Use <b>Live BibleQuest Room</b> when a group is large or everyone has a phone. A leader starts a room; members join with a short code.</p>${screen('live')}<ol><li>Everyone signs in and joins the same congregation.</li><li>A facilitator/leader/admin starts the room.</li><li>Share the room code.</li><li>Members join and respond live.</li><li>The host can switch between quiz, poll, verse hunt, discussion, and wisdom.</li></ol>`, action: ['live','Open Live Rooms']
    },
    {
      trainer: 'up', side: 'right', eyebrow: 'READ + UNDERSTAND', title: 'Use Read when you want Scripture itself, not another score',
      body: `<p>The Read hub holds the Bible Reader and the deeper study tools. This is where to slow down, inspect context, write notes, or follow a whole story.</p>${screen('read')}<p><b>Bible Workspace</b> keeps highlights, bookmarks, notes, and search together. <b>Hebrew & Greek Context</b> adds language data carefully; it is a context aid, not a replacement for reading the passage.</p>`, action: ['read','Open Read tools']
    },
    {
      trainer: 'thumbs', side: 'left', eyebrow: 'SEE YOUR JOURNEY', title: 'Grow makes progress visible and gives it somewhere to go',
      body: `<p><b>My Mission</b> gives a focused next step. <b>Bible World</b> turns progress into a journey through Scripture. <b>Avatar Vault</b> ties special looks to real milestones rather than random rewards.</p>${screen('grow')}<p>Use Situations & Wisdom and Transformation when you want to move from knowing an answer to examining choices, habits, motives, and application.</p>`, action: ['grow','Open Grow']
    },
    {
      trainer: 'thoughtful', side: 'right', eyebrow: 'DON’T MISS THESE', title: 'Here is the full feature map',
      body: `<p>You do not need to memorize this. The point is to know these tools exist so you can return when the need comes up.</p>${featureList()}${screen('nav')}<p class="bqt-tip"><b>Navigation rule:</b> Home is your default. Journey shows where you are. Think is for deeper questions. Me holds your profile, progress, account and private work.</p>`
    },
    {
      trainer: 'thumbs', side: 'left', eyebrow: 'YOU’RE READY', title: 'A simple BibleQuest routine',
      body: `<div class="bqt-routine"><div><span>1</span><b>Most days</b><p>Daily 5 → read every explanation.</p></div><div><span>2</span><b>When something is weak</b><p>Smart Review or Recall Decks.</p></div><div><span>3</span><b>When studying</b><p>Reader → Context/Workspace → notes.</p></div><div><span>4</span><b>With people</b><p>Play Together for one phone; Live Room for many phones.</p></div><div><span>5</span><b>When you have more time</b><p>Follow Bible World/Journey and unlock the next milestone.</p></div></div><p class="bqt-final-note">Your progress is evidence of learning, not a measure of faith. Scripture is never locked behind XP.</p>`, action: ['home','Start using BibleQuest']
    }
  ].filter(Boolean);

  function style() {}

  function close(markDone = true) {
    root?.remove();
    root = null;
    document.body.classList.remove('bqt-open');
    if (markDone) {
      localStorage.setItem(DONE, '1');
      localStorage.setItem(LEGACY_DONE, '1');
    }
    if (recoveryCode) sessionStorage.removeItem('bq_pending_recovery_code');
  }

  function goHome(after) {
    const home = document.querySelector('[data-route="home"]');
    if (home) home.click();
    setTimeout(after, 100);
  }

  function launch(target) {
    close(false);
    if (target === 'home') return goHome(() => document.querySelector('.modern-home')?.scrollIntoView?.({behavior:'smooth',block:'start'}));
    if (target === 'daily') return goHome(() => document.querySelector('[data-modern-daily], [data-action="daily"]')?.click());
    if (['play','read','grow','together'].includes(target)) return goHome(() => window.BQModernHome?.openHub?.(target));
    if (target === 'group') return window.BQGroupPlay?.open?.();
    if (target === 'live') return window.BQLiveRooms?.open?.();
  }

  function render() {
    if (!root) return;
    const list = steps();
    index = Math.max(0, Math.min(index, list.length - 1));
    const step = list[index];
    const hasAction = Array.isArray(step.action);
    root.innerHTML = `<main class="bqt-page" data-bq-english>
      <header class="bqt-top"><div class="bqt-brand"><span>✦</span>BibleQuest Guide</div><button class="bqt-close" data-bqt-skip>${recoveryCode && index === 0 ? 'Keep setup open' : 'Close guide'}</button></header>
      <section class="bqt-stage trainer-${step.side || 'right'}">
        <article class="bqt-card"><div class="bqt-eyebrow">${esc(step.eyebrow || 'BIBLEQUEST GUIDE')}</div><h1>${esc(step.title)}</h1><div class="bqt-body">${step.body}</div></article>
        <aside class="bqt-trainer-wrap" aria-label="BibleQuest trainer"><div class="bqt-trainer ${esc(step.trainer || 'welcome')}" aria-hidden="true"></div><span class="bqt-trainer-name">BibleQuest Trainer</span></aside>
      </section>
      <footer class="bqt-bottom-bar"><div class="bqt-progress-row">${list.map((_,i)=>`<i class="${i<=index?'on':''}"></i>`).join('')}</div><div class="bqt-actions"><button class="bqt-back" data-bqt-back ${index===0?'disabled':''}>Back</button>${hasAction?`<button class="bqt-try" data-bqt-try>${esc(step.action[1])}</button>`:'<span></span>'}<button class="bqt-next" data-bqt-next>${index===list.length-1?'Finish guide':'Next'}</button></div><div class="bqt-step-label">${index+1} of ${list.length}</div></footer>
    </main>`;

    const next = root.querySelector('[data-bqt-next]');
    if (recoveryCode && index === 0 && !saved) next.disabled = true;
    root.querySelector('[data-bqt-back]')?.addEventListener('click', () => { index--; render(); root.scrollTo(0,0); });
    next?.addEventListener('click', () => {
      if (index === list.length - 1) { close(true); goHome(() => document.querySelector('.modern-home')?.scrollIntoView?.({behavior:'smooth'})); }
      else { index++; render(); root.scrollTo(0,0); }
    });
    root.querySelector('[data-bqt-try]')?.addEventListener('click', () => launch(step.action[0]));
    root.querySelector('[data-bqt-skip]')?.addEventListener('click', () => {
      if (recoveryCode && index === 0 && !saved) return;
      close(false);
    });
    root.querySelector('[data-bqt-saved]')?.addEventListener('change', e => { saved = e.target.checked; render(); });
    root.querySelector('[data-bqt-copy]')?.addEventListener('click', async e => {
      try { await navigator.clipboard.writeText(recoveryCode); e.currentTarget.textContent = 'Copied'; }
      catch { e.currentTarget.textContent = 'Copy manually from the code above'; }
    });
  }

  function open(opts = {}) {
    style();
    recoveryCode = String(opts.recoveryCode || sessionStorage.getItem('bq_pending_recovery_code') || '');
    saved = false;
    index = Math.max(0, Number(opts.step || 0));
    if (root) root.remove();
    root = document.createElement('div');
    root.className = 'bqt-layer';
    root.dataset.bqEnglish = '1';
    document.body.appendChild(root);
    document.body.classList.add('bqt-open');
    render();
  }

  window.BQTutorial = {
    open,
    close: () => close(false),
    completed: () => localStorage.getItem(DONE) === '1' || localStorage.getItem(LEGACY_DONE) === '1'
  };
  window.addEventListener('bq-account-created', e => open({recoveryCode:e.detail?.recoveryCode || ''}));
  document.addEventListener('DOMContentLoaded', () => {
    const pending = sessionStorage.getItem('bq_pending_recovery_code');
    if (pending) setTimeout(() => open({recoveryCode:pending}), 250);
  });
})();
