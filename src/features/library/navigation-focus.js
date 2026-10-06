const MAX_RETURN_FOCUS_ID_LENGTH = 160;

let pendingReturnFocusId = '';

const normalizeId = value => String(value ?? '').trim().slice(0, MAX_RETURN_FOCUS_ID_LENGTH);

export function stageLibraryReturnFocus(itemId) {
  pendingReturnFocusId = normalizeId(itemId);
}

export function consumeLibraryReturnFocus() {
  const itemId = pendingReturnFocusId;
  pendingReturnFocusId = '';
  return itemId;
}

export function clearLibraryReturnFocus() {
  pendingReturnFocusId = '';
}
