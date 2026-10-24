/**
 * describe(): generate a text alternative for content the model produced,
 * check it against data we already have, and fall back to something true.
 */

export type Slot = { day: string; time: string; free: boolean };

export type Block =
  | { kind: 'table'; rows: Slot[] }
  | { kind: 'image'; imageUrl: string; knownFreeTimes: string[] };

export type Described = { text: string; verified: boolean };

export interface Summariser {
  summarise(block: Block): Promise<string>;
}

export async function describe(block: Block, model: Summariser): Promise<Described> {
  let summary = '';
  try {
    summary = await model.summarise(block);
  } catch {
    // The model refused or failed: fall through to the template.
  }

  if (summary && check(block, summary)) return { text: label(block, summary), verified: true };
  return { text: fallback(block), verified: false };
}

export function check(block: Block, summary: string): boolean {
  const saidTimes = timesIn(summary);
  if (block.kind === 'table') {
    const freeTimes = block.rows.filter((r) => r.free).map((r) => r.time);
    return sameSet(saidTimes, freeTimes);
  }
  // For an image we can only check the times it mentions against the calendar.
  return saidTimes.length > 0 && saidTimes.every((t) => block.knownFreeTimes.includes(t));
}

export function fallback(block: Block): string {
  if (block.kind === 'table') {
    const free = block.rows.filter((r) => r.free).length;
    return `Table: ${block.rows.length} rows, ${free} free.`;
  }
  return 'Screenshot of a calendar. No reliable description.';
}

/** Generated image descriptions say in words that they may be wrong. */
function label(block: Block, summary: string): string {
  return block.kind === 'image' ? `Description generated, may be wrong: ${summary}` : summary;
}

export function timesIn(text: string): string[] {
  return (text.match(/\b\d{1,2}:\d{2}\b/g) ?? []).map((t) => t.padStart(5, '0'));
}

export function sameSet(a: string[], b: string[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  return sa.size === sb.size && [...sa].every((x) => sb.has(x));
}
