(() => {
  const APP_SELECTOR = '#app .app';
  const DECLARATION_ID = 'bq-faith-declaration';
  const STYLE_ID = 'bq-faith-declaration-style';
  const TEXT = 'I confess Jesus is Lord and the authority of my life.';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .faith-declaration {
        margin: 0 2px 2px;
        padding: 7px 10px 5px;
        text-align: center;
        color: var(--muted, #728078);
        font-size: 11px;
        font-weight: 750;
        font-style: italic;
        line-height: 1.35;
        letter-spacing: .01em;
      }
      @media (max-width: 380px) {
        .faith-declaration {
          font-size: 10px;
          padding-inline: 6px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureDeclaration() {
    ensureStyles();
    const app = document.querySelector(APP_SELECTOR);
    if (!app) return;

    let declaration = document.getElementById(DECLARATION_ID);
    if (declaration && declaration.parentElement === app && app.firstElementChild === declaration) return;
    if (declaration) declaration.remove();

    declaration = document.createElement('div');
    declaration.id = DECLARATION_ID;
    declaration.className = 'faith-declaration';
    declaration.setAttribute('role', 'note');
    declaration.textContent = TEXT;
    app.prepend(declaration);
  }

  const root = document.getElementById('app');
  if (root) {
    new MutationObserver(ensureDeclaration).observe(root, { childList: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureDeclaration, { once: true });
  } else {
    ensureDeclaration();
  }
  requestAnimationFrame(ensureDeclaration);
})();
