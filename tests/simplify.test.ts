import { expect, it } from 'vitest';
import { factsKept, factsOf } from '@/lib/a11y/simplify';

const original = 'Rescheduling within 24 hours of the start time requires organiser approval per the scheduling policy effective 1 Oct.';

it('pulls out durations and dates', () => {
  expect(factsOf(original)).toEqual(expect.arrayContaining(['24 hours', '1 Oct']));
});

it('accepts a rewrite that keeps the facts', () => {
  expect(factsKept(original, 'Moving a meeting less than 24 hours before it starts needs the organiser’s OK. This rule started on 1 Oct.')).toBe(true);
});

it('rejects a rewrite that drops a fact', () => {
  expect(factsKept(original, 'Moving a meeting at short notice needs the organiser’s OK.')).toBe(false);
});
