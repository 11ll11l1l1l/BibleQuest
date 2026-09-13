const ACTION_SELECTOR = '[data-bq-action]';

function assertRoot(root) {
  if (!root || typeof root.addEventListener !== 'function' || typeof root.removeEventListener !== 'function') {
    throw new TypeError('A DOM-like root with addEventListener/removeEventListener is required');
  }
  return root;
}

function assertHandler(onAction) {
  if (typeof onAction !== 'function') throw new TypeError('onAction must be a function');
  return onAction;
}

function actionElementFor(target, root) {
  if (!target || typeof target.closest !== 'function') return null;
  const element = target.closest(ACTION_SELECTOR);
  if (!element) return null;
  if (typeof root.contains === 'function' && !root.contains(element)) return null;
  return element;
}

function actionName(element) {
  const value = element?.dataset?.bqAction;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function isDisabled(element) {
  if (element?.disabled === true) return true;
  return typeof element?.getAttribute === 'function' && element.getAttribute('aria-disabled') === 'true';
}

export function createViewMount({ root, onAction }) {
  const mountRoot = assertRoot(root);
  const dispatch = assertHandler(onAction);
  let disposed = false;

  const handleClick = event => {
    if (disposed) return;
    const source = actionElementFor(event?.target, mountRoot);
    if (!source || isDisabled(source)) return;
    const action = actionName(source);
    if (!action) return;
    dispatch(Object.freeze({ action, source, event }));
  };

  mountRoot.addEventListener('click', handleClick);

  return Object.freeze({
    render(html) {
      if (disposed) throw new Error('Cannot render through a disposed view mount');
      mountRoot.innerHTML = String(html ?? '');
      return mountRoot;
    },
    clear() {
      if (disposed) return;
      mountRoot.innerHTML = '';
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      mountRoot.removeEventListener('click', handleClick);
    },
    get disposed() {
      return disposed;
    },
  });
}
