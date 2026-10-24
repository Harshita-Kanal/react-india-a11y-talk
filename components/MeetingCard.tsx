'use client';

import { useEffect, useRef, useState } from 'react';
import { getMeeting, runAction } from '@/app/actions';
import { useAnnouncer } from '@/lib/a11y/announcer';
import type { Meeting } from '@/lib/calendar/store';

/**
 * The button path: the same moveMeeting and cancelMeeting actions the chat
 * and the MCP server use.
 */
export function MeetingCard({ id, refreshKey }: { id: string; refreshKey: number }) {
  const announce = useAnnouncer();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [gone, setGone] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    getMeeting(id).then(setMeeting, () => setGone(true));
  }, [id, refreshKey]);

  if (gone) return <p>No upcoming meetings.</p>;
  if (!meeting) return null;

  async function move() {
    const res = await runAction('moveMeeting', { id, day: 'Thu', time: '11:00' });
    announce(res.message);
    if (res.ok) setMeeting(await getMeeting(id));
  }

  async function cancel() {
    dialog.current?.close();
    const res = await runAction('cancelMeeting', { id });
    announce(res.message);
    if (res.ok) setGone(true);
  }

  return (
    <section aria-labelledby="meeting-heading" className="card">
      <h2 id="meeting-heading">{meeting.title}</h2>
      <p>
        {meeting.day} {meeting.time} · {meeting.attendees.length} attendees
      </p>
      <button type="button" onClick={move}>Move to Thu 11:00</button>{' '}
      <button type="button" onClick={() => dialog.current?.showModal()}>Cancel meeting…</button>

      <dialog ref={dialog} aria-labelledby="confirm-text">
        {/* Name the change; let the buttons say what they do. */}
        <p id="confirm-text">
          Cancel {meeting.title} on {meeting.day} {meeting.time} and email {meeting.attendees.length} attendees?
        </p>
        <button type="button" onClick={cancel}>Cancel and email</button>{' '}
        <button type="button" autoFocus onClick={() => dialog.current?.close()}>Keep meeting</button>
      </dialog>
    </section>
  );
}
