'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import { useAnnouncer } from '@/lib/a11y/announcer';
import { AgentActivity } from './AgentActivity';
import { Composer } from './Composer';
import { MeetingCard } from './MeetingCard';
import { Message } from './Message';

export function Assistant() {
  const { messages, sendMessage, status, stop } = useChat();
  const announce = useAnnouncer();
  const busy = status === 'submitted' || status === 'streaming';

  // Refresh the meeting card whenever the chat finishes (it may have moved something).
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    if (status === 'ready') setRefreshKey((k) => k + 1);
  }, [status]);

  return (
    <main>
      <h1>Calendar assistant</h1>
      <AgentActivity />
      <MeetingCard id="m_482" refreshKey={refreshKey} />

      <section aria-labelledby="chat-heading">
        <h2 id="chat-heading">Chat</h2>
        {/* A log is live by default; the Announcer does the speaking instead. */}
        <div role="log" aria-live="off" className="transcript">
          {messages.map((m, i) => (
            <Message key={m.id} message={m} done={!(busy && i === messages.length - 1)} />
          ))}
        </div>
        <Composer
          busy={busy}
          onSend={(text) => sendMessage({ text })}
          onStop={() => {
            stop();
            announce('Stopped.');
          }}
        />
      </section>
    </main>
  );
}
