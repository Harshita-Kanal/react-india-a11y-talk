'use server';

import { allActions } from '@/lib/calendar/actions';
import * as calendar from '@/lib/calendar/store';

/**
 * The button path. Buttons call the same action objects the chat tools
 * and the MCP server use, so they all share one set of checks.
 */
export async function runAction(name: keyof typeof allActions, input: unknown) {
  const action = allActions[name];
  try {
    const result = await action.run(input, { source: 'app' });
    return { ok: true as const, message: action.say(result as never) };
  } catch (error) {
    return { ok: false as const, message: (error as Error).message };
  }
}

/** Changes an outside agent made since the user last looked. */
export async function agentActivitySince(id: number) {
  return calendar.activitySince(id, 'agent');
}

export async function getMeeting(id: string) {
  return calendar.getMeeting(id);
}
