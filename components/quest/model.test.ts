import { expect, it } from 'vitest';
import { nextIndex } from './model';
it('moves through visible encounters and stops at both ends, including an empty deck', () => {
  expect(nextIndex(0, 1, 7)).toBe(1);
  expect(nextIndex(0, -1, 7)).toBe(0);
  expect(nextIndex(6, 1, 7)).toBe(6);
  expect(nextIndex(0, 1, 0)).toBe(0);
});
