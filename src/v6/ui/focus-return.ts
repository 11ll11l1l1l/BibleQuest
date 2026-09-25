export interface FocusReturnTarget {
  readonly isConnected?: boolean;
  readonly disabled?: boolean;
  readonly hidden?: boolean;
  getAttribute?(name: string): string | null;
  focus(options?: FocusOptions): void;
}

export interface FocusReturnOptions {
  readonly preventScroll?: boolean;
}

function hasBlockingAttribute(target: FocusReturnTarget, name: string): boolean {
  const value = target.getAttribute?.(name);
  return value === '' || value === 'true';
}

export function canRestoreFocus(target: FocusReturnTarget | null | undefined): target is FocusReturnTarget {
  if (!target) return false;
  if (target.isConnected === false || target.disabled === true || target.hidden === true) return false;
  if (hasBlockingAttribute(target, 'aria-hidden') || hasBlockingAttribute(target, 'inert')) return false;
  return typeof target.focus === 'function';
}

export function restoreFocus(
  target: FocusReturnTarget | null | undefined,
  options: FocusReturnOptions = {},
): boolean {
  if (!canRestoreFocus(target)) return false;

  try {
    target.focus({ preventScroll: options.preventScroll ?? true });
    return true;
  } catch {
    return false;
  }
}

export function createFocusReturn(
  target: FocusReturnTarget | null | undefined,
  options: FocusReturnOptions = {},
): () => boolean {
  let consumed = false;

  return () => {
    if (consumed) return false;
    consumed = true;
    return restoreFocus(target, options);
  };
}
