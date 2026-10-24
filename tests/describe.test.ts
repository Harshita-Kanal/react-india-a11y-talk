import { describe as suite, expect, it } from 'vitest';
import { describe, fallback, sameSet, timesIn, type Slot } from '@/lib/a11y/describe';

const rows: Slot[] = [
  { day: 'Wed', time: '10:00', free: false },
  { day: 'Thu', time: '11:00', free: true },
  { day: 'Thu', time: '14:00', free: false },
  { day: 'Thu', time: '15:00', free: true },
];
const table = { kind: 'table' as const, rows };
const model = (text: string) => ({ summarise: async () => text });

suite('describe(table)', () => {
  it('uses the summary when its times match the free slots', async () => {
    const d = await describe(table, model('Two free slots on Thursday, 11:00 and 15:00.'));
    expect(d).toEqual({ text: 'Two free slots on Thursday, 11:00 and 15:00.', verified: true });
  });

  it('falls back when the model invents a time', async () => {
    const d = await describe(table, model('Free on Thursday at 11:30 and 15:00.'));
    expect(d).toEqual({ text: 'Table: 4 rows, 2 free.', verified: false });
  });

  it('falls back when the model misses a slot', async () => {
    const d = await describe(table, model('Thursday 11:00 is free.'));
    expect(d.verified).toBe(false);
  });

  it('falls back when the model fails', async () => {
    const d = await describe(table, { summarise: async () => { throw new Error('refused'); } });
    expect(d.text).toBe(fallback(table));
  });
});

suite('describe(image)', () => {
  const image = { kind: 'image' as const, imageUrl: 'https://example.com/cal.png', knownFreeTimes: ['11:00', '15:00'] };

  it('labels a checked description as possibly wrong', async () => {
    const d = await describe(image, model('A week view with Thursday 11:00 free.'));
    expect(d.text).toBe('Description generated, may be wrong: A week view with Thursday 11:00 free.');
  });

  it('says there is no reliable description when the check fails', async () => {
    const d = await describe(image, model('A week view, mostly empty.'));
    expect(d.text).toBe('Screenshot of a calendar. No reliable description.');
  });
});

suite('helpers', () => {
  it('finds times and pads them', () => expect(timesIn('at 9:00 and 15:00')).toEqual(['09:00', '15:00']));
  it('compares sets', () => {
    expect(sameSet(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameSet(['a'], ['a', 'b'])).toBe(false);
  });
});
