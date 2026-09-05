(() => {
  let scheduled = false;

  function openGuide() {
    window.BQTutorial?.open?.({ force: true });
  }

  function makeButton(className = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.modernGuide = '1';
    button.className = className;
    button.setAttribute('aria-label', 'Show BibleQuest tutorial');
    button.innerHTML = '<span aria-hidden="true">❔</span><span><b>Show tutorial</b><small>Learn where everything is and how to use it</small></span><i aria-hidden="true">›</i>';
    button.addEventListener('click', openGuide);
    return button;
  }

  function injectPrimary() {
    const home = document.querySelector('.modern-home');
    const focus = home?.querySelector('.modern-focus');
    if (!home || !focus || home.querySelector('.bq-show-tutorial')) return;

    const button = makeButton('bq-show-tutorial');
    button.style.cssText = 'width:100%;margin:10px 0 2px;padding:11px 13px;border:1px solid rgba(63,127,88,.16);border-radius:16px;background:rgba(255,255,255,.82);color:#355746;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;text-align:left;font:inherit;box-shadow:0 6px 18px rgba(42,57,47,.05);cursor:pointer';
    const icon = button.children[0];
    const copy = button.children[1];
    const arrow = button.children[2];
    icon.style.cssText = 'width:32px;height:32px;border-radius:10px;background:#edf5ee;display:grid;place-items:center;font-size:17px';
    copy.style.cssText = 'display:block;min-width:0';
    copy.querySelector('b').style.cssText = 'display:block;font-size:12px';
    copy.querySelector('small').style.cssText = 'display:block;margin-top:1px;color:#718078;font-size:9px;line-height:1.25';
    arrow.style.cssText = 'font-style:normal;font-size:21px;color:#87968b';
    focus.after(button);
  }

  function injectFooterFallback() {
    const row = document.querySelector('.modern-footer-row');
    if (!row || row.querySelector('[data-modern-guide]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.modernGuide = '1';
    button.textContent = '❔ Show tutorial';
    button.addEventListener('click', openGuide);
    row.prepend(button);
  }

  function inject() {
    injectPrimary();
    injectFooterFallback();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      inject();
    });
  }

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('bq-modern-home-rendered', schedule);
  setTimeout(schedule, 250);
})();
