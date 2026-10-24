'use client';

import { useState, type ReactNode } from 'react';
import type { UIMessage } from 'ai';
import { useAnnouncer } from '@/lib/a11y/announcer';
import { useSpokenStream } from '@/lib/a11y/useSpokenStream';
import type { Slot } from '@/lib/a11y/describe';
import { MoveStatus, type ToolPart } from './MoveStatus';
import { SlotTable } from './SlotTable';

const textOf = (m: UIMessage) =>
  m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');

export function Message({ message, done }: { message: UIMessage; done: boolean }) {
  if (message.role === 'user') {
    return (
      <article className="msg user">
        <h3 className="sr-only">You</h3>
        <p>{textOf(message)}</p>
      </article>
    );
  }
  return <AssistantMessage message={message} done={done} />;
}

function AssistantMessage({ message, done }: { message: UIMessage; done: boolean }) {
  const text = textOf(message);
  const announce = useAnnouncer();
  useSpokenStream(text, done);

  const [plain, setPlain] = useState(false);
  const [simple, setSimple] = useState<string | null>(null);

  async function togglePlain() {
    if (plain) return setPlain(false);
    let s = simple;
    if (s === null) {
      const res = await fetch('/api/simplify', { method: 'POST', body: JSON.stringify({ text }) });
      const data: { simple: string; factsKept: boolean } = await res.json();
      if (!data.factsKept) {
        announce('Could not simplify without losing details.');
        return;
      }
      s = data.simple;
      setSimple(s);
    }
    setPlain(true);
    announce(s);
  }

  const body: ReactNode[] = message.parts.map((part, i) => {
    if (part.type === 'text') {
      return plain ? null : <p key={i}>{part.text}</p>;
    }
    if (part.type === 'tool-listSlots' && 'state' in part && part.state === 'output-available') {
      const out = part.output as { result: Slot[] };
      return <SlotTable key={i} rows={out.result} />;
    }
    if (part.type === 'tool-move') {
      return <MoveStatus key={i} part={part as ToolPart} />;
    }
    return null;
  });

  return (
    <article className="msg assistant">
      {/* Lets screen reader users jump from reply to reply with H. */}
      <h3 className="sr-only">Assistant</h3>
      {plain && simple ? <p>{simple}</p> : null}
      {body}
      {done && text ? (
        <div className="msg-actions">
          <button type="button" onClick={() => announce(plain && simple ? simple : text)}>
            Read again
          </button>
          <button type="button" aria-pressed={plain} onClick={togglePlain}>
            Plain language
          </button>
        </div>
      ) : null}
    </article>
  );
}
