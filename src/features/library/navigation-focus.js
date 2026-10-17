const MAX_RETURN_FOCUS_ID_LENGTH = 160;

let pendingReturnFocusId = '';
let pendingReturnScrollY = null;

const normalizeId = value => String(value ?? '').trim().slice(0, MAX_RETURN_FOCUS_ID_LENGTH);

export function stageLibraryReturnFocus(itemId, scrollY) {
  pendingReturnFocusId = normalizeId(itemId);
  if (Number.isFinite(scrollY) && scrollY >= 0) pendingReturnScrollY = scrollY;
}

export function consumeLibraryReturnFocus() {
  const itemId = pendingReturnFocusId;
  pendingReturnFocusId = '';
  return itemId;
}

export function consumeLibraryReturnScroll() {
  const scrollY = pendingReturnScrollY;
  pendingReturnScrollY = null;
  return scrollY;
}

export function clearLibraryReturnFocus() {
  pendingReturnFocusId = '';
  pendingReturnScrollY = null;
}
