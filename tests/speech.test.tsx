import { act, cleanup, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Announcer, useAnnouncer } from '@/lib/a11y/announcer';
import { splitSentences } from '@/lib/a11y/splitSentences';
import { useSpokenStream } from '@/lib/a11y/useSpokenStream';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('splits sentences and keeps their lengths', () => {
  const text = 'Thursday has two open slots. 11:00 and 15:00. Which';
  const parts = splitSentences(text);
  expect(parts.join('')).toBe(text);
  expect(parts.at(-1)).toBe('Which');
});

/** Captures everything the status region says, in order. */
function spoken() {
  const region = screen.getByRole('status');
  const lines: string[] = [];
  const obs = new MutationObserver(() => region.textContent && lines.push(region.textContent));
  obs.observe(region, { childList: true, subtree: true, characterData: true });
  return lines;
}

function Reply({ text, done }: { text: string; done: boolean }) {
  useSpokenStream(text, done);
  return <p>{text}</p>;
}

it('speaks whole sentences only, then Done', async () => {
  const chunks = ['Thurs', 'Thursday has two', 'Thursday has two open slots. The times a', 'Thursday has two open slots. The times are 11:00 and 15:00.'];
  const { rerender } = render(<Announcer><Reply text="" done={false} /></Announcer>);
  const lines = spoken();

  for (const c of chunks) {
    rerender(<Announcer><Reply text={c} done={false} /></Announcer>);
    await act(async () => vi.advanceTimersByTime(200));
  }
  rerender(<Announcer><Reply text={chunks.at(-1)!} done /></Announcer>);
  await act(async () => vi.advanceTimersByTime(1000));

  expect(lines).toEqual(['Thursday has two open slots.', 'The times are 11:00 and 15:00.', 'Done.']);
});

it('does not re-read a reply that was already finished when it mounted', async () => {
  render(<Announcer><Reply text="Old reply." done /></Announcer>);
  const lines = spoken();
  await act(async () => vi.advanceTimersByTime(1000));
  expect(lines).toEqual([]);
});

it('says the same line twice when asked twice', async () => {
  function Twice() {
    const announce = useAnnouncer();
    useEffect(() => {
      announce('Done.');
      announce('Done.');
    }, [announce]);
    return null;
  }
  render(<Announcer><Twice /></Announcer>);
  const lines = spoken();
  await act(async () => vi.advanceTimersByTime(1000));
  // The first line is set during render, before the observer is attached;
  // the second identical line must still change the region.
  expect(lines).toEqual(['Done.']);
});
