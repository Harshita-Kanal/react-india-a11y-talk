import fs from 'node:fs';
import path from 'node:path';
import type { Slot } from '../a11y/describe';

/**
 * A tiny file-backed calendar so the Next.js app and the MCP server
 * (a separate process) see the same data. Not for production.
 */

export type Meeting = { id: string; title: string; with: string; day: string; time: string; attendees: string[] };
export type Activity = { id: number; at: string; source: 'app' | 'chat' | 'agent'; message: string; undo?: { id: string; day: string; time: string } };

type Data = { meetings: Meeting[]; busy: { day: string; time: string }[]; activity: Activity[] };

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu'] as const;
export const TIMES = ['10:00', '11:00', '14:00', '15:00'] as const;

const FILE = process.env.CALENDAR_FILE ?? path.join(process.cwd(), '.data', 'calendar.json');

function seed(): Data {
  return {
    meetings: [
      { id: 'm_482', title: '1:1 with Priya', with: 'Priya Shah', day: 'Tue', time: '14:00', attendees: ['priya@example.com', 'sam@example.com', 'lee@example.com'] },
    ],
    // Everything is busy except Thursday 11:00 and 15:00.
    busy: DAYS.flatMap((day) => TIMES.map((time) => ({ day, time }))).filter(
      (s) => !(s.day === 'Thu' && (s.time === '11:00' || s.time === '15:00')) && !(s.day === 'Tue' && s.time === '14:00'),
    ),
    activity: [],
  };
}

function load(): Data {
  try {
    return JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ FILE, 'utf8')) as Data;
  } catch {
    const data = seed();
    save(data);
    return data;
  }
}

function save(data: Data) {
  fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(FILE), { recursive: true });
  fs.writeFileSync(/*turbopackIgnore: true*/ FILE, JSON.stringify(data, null, 2));
}

export function reset() {
  save(seed());
}

export function slots(day?: string): Slot[] {
  const data = load();
  const taken = (d: string, t: string) =>
    data.busy.some((b) => b.day === d && b.time === t) || data.meetings.some((m) => m.day === d && m.time === t);
  return DAYS.filter((d) => !day || d === day).flatMap((d) => TIMES.map((t) => ({ day: d, time: t, free: !taken(d, t) })));
}

export function getMeeting(id: string): Meeting {
  const m = load().meetings.find((x) => x.id === id);
  if (!m) throw new Error(`No meeting with id ${id}.`);
  return m;
}

export function findMeetings(withName?: string): Meeting[] {
  const all = load().meetings;
  return withName ? all.filter((m) => m.with.toLowerCase().includes(withName.toLowerCase())) : all;
}

export function hasConflict(id: string, day: string, time: string): boolean {
  const data = load();
  return (
    data.busy.some((b) => b.day === day && b.time === time) ||
    data.meetings.some((m) => m.id !== id && m.day === day && m.time === time)
  );
}

export function moveMeeting(id: string, day: string, time: string) {
  const data = load();
  const m = data.meetings.find((x) => x.id === id);
  if (!m) throw new Error(`No meeting with id ${id}.`);
  const from = { day: m.day, time: m.time };
  m.day = day;
  m.time = time;
  save(data);
  return { id, title: m.title, from, to: { day, time } };
}

export function cancelMeeting(id: string) {
  const data = load();
  const m = data.meetings.find((x) => x.id === id);
  if (!m) throw new Error(`No meeting with id ${id}.`);
  data.meetings = data.meetings.filter((x) => x.id !== id);
  save(data);
  return { id, title: m.title, day: m.day, time: m.time, emailed: m.attendees.length };
}

export function logActivity(entry: Omit<Activity, 'id' | 'at'>) {
  const data = load();
  const id = (data.activity.at(-1)?.id ?? 0) + 1;
  data.activity.push({ ...entry, id, at: new Date().toISOString() });
  save(data);
}

export function activitySince(id: number, source?: Activity['source']): Activity[] {
  return load().activity.filter((a) => a.id > id && (!source || a.source === source));
}
