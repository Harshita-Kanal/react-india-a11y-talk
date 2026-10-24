'use client';

import { useState } from 'react';

export function Composer({ busy, onSend, onStop }: { busy: boolean; onSend: (text: string) => void; onStop: () => void }) {
  const [text, setText] = useState('');

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim() || busy) return;
        onSend(text);
        setText('');
      }}
    >
      <label htmlFor="message">Message</label>
      <input id="message" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
      <button type="submit">Send</button>
      {/* Always rendered, so focus stays on it after stopping. */}
      <button type="button" aria-disabled={!busy} onClick={() => busy && onStop()}>
        Stop
      </button>
    </form>
  );
}
