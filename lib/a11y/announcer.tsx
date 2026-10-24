'use client';

import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

type Announce = (text: string) => void;

const AnnounceContext = createContext<Announce>(() => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('announce() called outside <Announcer>. Wrap your app in <Announcer>.');
  }
});

/**
 * Speaks queued lines one at a time, at least `gap` ms apart.
 * Safari drops live-region updates that arrive too close together
 * (React Aria's LiveAnnouncer notes about 100 ms), so we leave a margin.
 */
export function useQueue(setLine: (text: string) => void, { gap = 150 } = {}): Announce {
  const queue = useRef<string[]>([]);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const next = useCallback(() => {
    const line = queue.current.shift();
    busy.current = line !== undefined;
    if (line !== undefined) {
      setLine(line);
      timer.current = setTimeout(next, gap);
    }
  }, [gap, setLine]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (text: string) => {
      const line = text.trim();
      if (!line) return;
      queue.current.push(line);
      if (!busy.current) next();
    },
    [next],
  );
}

/**
 * The one status region for the whole app. Mount it once, in the root layout,
 * so the region exists (empty) before anything is announced.
 */
export function Announcer({ children }: { children: ReactNode }) {
  // A counter as the key makes the same sentence twice ("Done.", "Done.")
  // still count as a change.
  const [line, setLine] = useState({ text: '', id: 0 });
  const set = useCallback((text: string) => setLine((l) => ({ text, id: l.id + 1 })), []);
  const announce = useQueue(set, { gap: 150 });

  return (
    <AnnounceContext value={announce}>
      {children}
      <div role="status" className="sr-only">
        <span key={line.id}>{line.text}</span>
      </div>
    </AnnounceContext>
  );
}

export const useAnnouncer = () => use(AnnounceContext);

/** Announces `text` once when a component mounts (safe under StrictMode). */
export function useAnnounceOnMount(text: string | undefined) {
  const announce = useAnnouncer();
  const said = useRef(false);
  useEffect(() => {
    if (text && !said.current) {
      said.current = true;
      announce(text);
    }
  }, [announce, text]);
}
