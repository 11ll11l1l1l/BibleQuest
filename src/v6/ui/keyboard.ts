export type KeyboardActivationKey = 'Enter' | ' ';

export type RovingOrientation = 'horizontal' | 'vertical' | 'both';
export type TextDirection = 'ltr' | 'rtl';

export interface RovingFocusOptions {
  readonly key: string;
  readonly currentIndex: number;
  readonly itemCount: number;
  readonly orientation: RovingOrientation;
  readonly direction?: TextDirection;
  readonly disabledIndices?: readonly number[];
  readonly wrap?: boolean;
}

export interface RovingFocusResult {
  readonly handled: boolean;
  readonly index: number;
}

export function isKeyboardActivationKey(key: string): key is KeyboardActivationKey {
  return key === 'Enter' || key === ' ';
}

function validItemCount(itemCount: number): boolean {
  return Number.isInteger(itemCount) && itemCount > 0;
}

function enabledIndices(itemCount: number, disabledIndices: readonly number[]): number[] {
  const disabled = new Set(
    disabledIndices.filter((index) => Number.isInteger(index) && index >= 0 && index < itemCount),
  );

  return Array.from({ length: itemCount }, (_, index) => index).filter((index) => !disabled.has(index));
}

function directionalStep(
  key: string,
  orientation: RovingOrientation,
  direction: TextDirection,
): -1 | 0 | 1 {
  if (orientation === 'vertical' || orientation === 'both') {
    if (key === 'ArrowUp') return -1;
    if (key === 'ArrowDown') return 1;
  }

  if (orientation === 'horizontal' || orientation === 'both') {
    if (key === 'ArrowLeft') return direction === 'rtl' ? 1 : -1;
    if (key === 'ArrowRight') return direction === 'rtl' ? -1 : 1;
  }

  return 0;
}

export function resolveRovingFocus(options: RovingFocusOptions): RovingFocusResult {
  if (!validItemCount(options.itemCount)) {
    return Object.freeze({ handled: false, index: options.currentIndex });
  }

  const enabled = enabledIndices(options.itemCount, options.disabledIndices ?? []);
  if (enabled.length === 0) {
    return Object.freeze({ handled: false, index: options.currentIndex });
  }

  if (options.key === 'Home') {
    return Object.freeze({ handled: true, index: enabled[0] });
  }

  if (options.key === 'End') {
    return Object.freeze({ handled: true, index: enabled[enabled.length - 1] });
  }

  const step = directionalStep(options.key, options.orientation, options.direction ?? 'ltr');
  if (step === 0 || !Number.isInteger(options.currentIndex)) {
    return Object.freeze({ handled: false, index: options.currentIndex });
  }

  const currentEnabledPosition = enabled.indexOf(options.currentIndex);
  if (currentEnabledPosition < 0) {
    return Object.freeze({ handled: false, index: options.currentIndex });
  }

  const candidatePosition = currentEnabledPosition + step;
  if (candidatePosition >= 0 && candidatePosition < enabled.length) {
    return Object.freeze({ handled: true, index: enabled[candidatePosition] });
  }

  if (options.wrap === false) {
    return Object.freeze({ handled: true, index: options.currentIndex });
  }

  return Object.freeze({
    handled: true,
    index: step > 0 ? enabled[0] : enabled[enabled.length - 1],
  });
}
