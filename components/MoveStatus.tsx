'use client';

import { useEffect, useRef, useState } from 'react';
import { runAction } from '@/app/actions';
import { useAnnounceOnMount, useAnnouncer } from '@/lib/a11y/announcer';

type Moved = { id: string; title: string; from: { day: string; time: string }; to: { day: string; time: string } };

export type ToolPart = {
  type: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error' | string;
  output?: { result: Moved; message: string };
  errorText?: string;
};

/** Every tool state has something to say, through the one Announcer. */
export function MoveStatus({ part }: { part: ToolPart }) {
  switch (part.state) {
    case 'input-available':  return <Pending />;
    case 'output-available': return <MovedNotice output={part.output!} />;
    case 'output-error':     return <Failed error={part.errorText ?? 'Something went wrong.'} />;
    default:                 return null; // input-streaming: say nothing yet
  }
}

function Pending() {
  useAnnounceOnMount('Moving your meeting.');
  return <p className="tool pending">Moving your meeting…</p>;
}

function Failed({ error }: { error: string }) {
  useAnnounceOnMount(`Couldn’t move the meeting. ${error}`);
  return <p className="tool error">Couldn’t move the meeting. {error}</p>;
}

function MovedNotice({ output }: { output: { result: Moved; message: string } }) {
  useAnnounceOnMount(output.message);
  const announce = useAnnouncer();
  const undo = useRef<HTMLButtonElement>(null);
  const [undone, setUndone] = useState(false);

  // Move focus to Undo once, so "Undo, button" is the next thing heard.
  useEffect(() => undo.current?.focus(), []);

  async function onUndo() {
    const { from } = output.result;
    const res = await runAction('moveMeeting', { id: output.result.id, day: from.day, time: from.time });
    announce(res.message);
    if (res.ok) setUndone(true);
  }

  return (
    <p className="tool done">
      {output.message}{' '}
      <button ref={undo} type="button" onClick={onUndo} disabled={undone}>
        {undone ? 'Undone' : 'Undo'}
      </button>
    </p>
  );
}
