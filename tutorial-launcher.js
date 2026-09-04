(() => {
  let scheduled = false;

  function openGuide() {
    window.BQTutorial?.open?.();
  }

  function inject() {
    const row = document.querySelector('.modern-footer-row');
    if (!row || row.querySelector('[data-modern-guide]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.modernGuide = '1';
    button.innerHTML = '❔ How to use BibleQuest';
    button.addEventListener('click', openGuide);
    row.prepend(button);
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
