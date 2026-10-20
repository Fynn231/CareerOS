import { expect, it } from 'vitest';
import { swipeDirection } from './interaction';
it('requires a deliberate horizontal swipe, rejecting taps and vertical intent', () => {
  expect(swipeDirection(-80, 10)).toBe(1);
  expect(swipeDirection(80, -10)).toBe(-1);
  expect(swipeDirection(-59, 0)).toBe(0);
  expect(swipeDirection(0, 0)).toBe(0);
  expect(swipeDirection(-80, 75)).toBe(0);
  expect(swipeDirection(-80, 120)).toBe(0);
});
