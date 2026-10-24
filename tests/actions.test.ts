import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, expect, it } from 'vitest';

process.env.CALENDAR_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cal-')), 'calendar.json');

const { reset, activitySince } = await import('@/lib/calendar/store');
const { moveMeeting, listSlots } = await import('@/lib/calendar/actions');
const { hintsFor, toMcpServer } = await import('@/lib/a11y/toMcpServer');

beforeEach(() => reset());

it('moves a meeting and says exactly what changed', async () => {
  const r = await moveMeeting.run({ id: 'm_482', day: 'Thu', time: '11:00' });
  expect(moveMeeting.say(r)).toBe('Moved 1:1 with Priya from Tue 14:00 to Thu 11:00.');
});

it('refuses a slot that is taken, whichever way it is called', async () => {
  await expect(moveMeeting.run({ id: 'm_482', day: 'Wed', time: '10:00' })).rejects.toThrow('Wednesday 10:00 is taken.');
  const t = moveMeeting.asTool() as unknown as { execute: (i: unknown, o: unknown) => Promise<unknown> };
  await expect(t.execute({ id: 'm_482', day: 'Wed', time: '10:00' }, {})).rejects.toThrow('is taken');
});

it('validates input with the same schema for every caller', async () => {
  await expect(moveMeeting.run({ id: 'm_482', day: 'Sun', time: '11:00' })).rejects.toThrow();
});

it('records who made the change', async () => {
  await moveMeeting.run({ id: 'm_482', day: 'Thu', time: '15:00' }, { source: 'agent' });
  expect(activitySince(0, 'agent')[0].message).toBe('moved 1:1 with Priya from Tuesday 14:00 to Thursday 15:00');
});

it('lists the two free Thursday slots', async () => {
  expect(listSlots.say(await listSlots.run({ day: 'Thu' }))).toBe('Free: Thursday 11:00, Thursday 15:00.');
});

it('maps reversibility to MCP hints', () => {
  expect(hintsFor('read')).toEqual({ readOnlyHint: true });
  expect(hintsFor('none')).toEqual({ destructiveHint: true });
});

it('builds an MCP server from the actions', () => {
  expect(() => toMcpServer([moveMeeting, listSlots] as never)).not.toThrow();
});
