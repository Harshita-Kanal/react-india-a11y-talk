import { z } from 'zod';
import { defineAction, type Action } from '../a11y/defineAction';
import * as calendar from './store';

const Day = z.enum(calendar.DAYS).describe('Day of the week, e.g. "Thu"');
const Time = z.enum(calendar.TIMES).describe('Start time, 24-hour, e.g. "11:00"');
const fullDay = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday' } as Record<string, string>;

export const findMeeting = defineAction({
  name: 'find_meeting',
  description: 'Find meetings by the name of the person they are with',
  input: z.object({ with: z.string().describe('Name of the other person') }),
  reversible: 'read',
  run: async (input) => calendar.findMeetings(input.with),
  say: (ms) =>
    ms.length === 0
      ? 'No meetings found.'
      : ms.map((m) => `${m.title}, ${fullDay[m.day]} ${m.time} (id ${m.id})`).join('; '),
});

export const listSlots = defineAction({
  name: 'list_slots',
  description: 'List calendar slots for the week, or for one day, with whether each is free',
  input: z.object({ day: Day.optional() }),
  reversible: 'read',
  run: async (input) => calendar.slots(input.day),
  say: (rows) => {
    const free = rows.filter((r) => r.free);
    return free.length === 0
      ? 'No free slots.'
      : `Free: ${free.map((r) => `${fullDay[r.day]} ${r.time}`).join(', ')}.`;
  },
});

export const moveMeeting = defineAction({
  name: 'move_meeting',
  description: 'Move a meeting to a new day and start time',
  input: z.object({ id: z.string(), day: Day, time: Time }),
  reversible: 'undo',
  run: async ({ id, day, time }, ctx) => {
    if (calendar.hasConflict(id, day, time)) throw new Error(`${fullDay[day]} ${time} is taken.`);
    const moved = calendar.moveMeeting(id, day, time);
    calendar.logActivity({
      source: ctx.source,
      message: `moved ${moved.title} from ${fullDay[moved.from.day]} ${moved.from.time} to ${fullDay[day]} ${time}`,
      undo: { id, day: moved.from.day, time: moved.from.time },
    });
    return moved;
  },
  say: (m) => `Moved ${m.title} from ${m.from.day} ${m.from.time} to ${m.to.day} ${m.to.time}.`,
});

export const cancelMeeting = defineAction({
  name: 'cancel_meeting',
  description: 'Cancel a meeting and email all attendees. Cannot be undone.',
  input: z.object({ id: z.string() }),
  reversible: 'none',
  run: async ({ id }, ctx) => {
    const c = calendar.cancelMeeting(id);
    calendar.logActivity({ source: ctx.source, message: `cancelled ${c.title} and emailed ${c.emailed} attendees` });
    return c;
  },
  say: (c) => `Cancelled ${c.title} on ${c.day} ${c.time} and emailed ${c.emailed} attendees.`,
});

/** Every action, for the button path. */
export const allActions = { findMeeting, listSlots, moveMeeting, cancelMeeting };

/**
 * What the chat and outside agents get by default. Irreversible actions stay
 * out: other people's text (event descriptions) could trigger them.
 */
export const chatActions = [findMeeting, listSlots, moveMeeting] as Action[];
