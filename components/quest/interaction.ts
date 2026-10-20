export const interactiveSelector = 'button, input, textarea, select, a, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="tab"]';
export function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(interactiveSelector);
}
export function swipeDirection(dx: number, dy: number): number { return Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5 ? (dx < 0 ? 1 : -1) : 0; }
