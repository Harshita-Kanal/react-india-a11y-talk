'use client';

import { useEffect, useRef } from 'react';
import { useAnnouncer } from './announcer';
import { splitSentences } from './splitSentences';

/**
 * Speaks a streaming reply as whole sentences.
 *
 * The visible message can re-render on every token; this hook only hands
 * complete sentences to the Announcer, and says "Done." when the stream ends.
 * A message that is already finished when it mounts (history) is not spoken.
 */
export function useSpokenStream(text: string, done: boolean) {
  const announce = useAnnouncer();
  const spoken = useRef(done ? text.length : 0); // how much we've already said
  const finished = useRef(done);

  useEffect(() => {
    if (finished.current) return;

    const sentences = splitSentences(text.slice(spoken.current));
    if (!done) sentences.pop(); // the last one may still be growing

    for (const s of sentences) {
      announce(s);
      spoken.current += s.length;
    }
    if (done) {
      finished.current = true;
      announce('Done.');
    }
  }, [announce, text, done]);
}
