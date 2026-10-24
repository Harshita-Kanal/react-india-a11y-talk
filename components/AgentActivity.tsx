'use client';

import { useEffect, useRef, useState } from 'react';
import { agentActivitySince, runAction } from '@/app/actions';
import { useAnnouncer } from '@/lib/a11y/announcer';
import type { Activity } from '@/lib/calendar/store';

const KEY = 'lastSeenAgentActivity';

/**
 * When the user's own agent changed something over MCP, say so the next
 * time they open the app, with Undo.
 */
export function AgentActivity() {
  const announce = useAnnouncer();
  const [items, setItems] = useState<Activity[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    let since = 0;
    try {
      since = Number(localStorage.getItem(KEY) ?? 0);
    } catch {}
    agentActivitySince(since).then((list) => {
      setItems(list);
      list.forEach((a) => announce(`Your assistant ${a.message}.`));
      const last = list.at(-1);
      if (last) {
        try {
          localStorage.setItem(KEY, String(last.id));
        } catch {}
      }
    });
  }, [announce]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="agent-heading" className="card">
      <h2 id="agent-heading">Changes made by your assistant</h2>
      <ul>
        {items.map((a) => (
          <li key={a.id}>
            Your assistant {a.message}.{' '}
            {a.undo ? (
              <button
                type="button"
                onClick={async () => {
                  const res = await runAction('moveMeeting', a.undo);
                  announce(res.message);
                }}
              >
                Undo
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
