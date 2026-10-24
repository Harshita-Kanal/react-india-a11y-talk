/**
 * Plain-language rewrites are only shown if the facts survive.
 * factsOf() pulls out the things a rewrite must not lose: times, dates,
 * durations and capitalised names.
 */
const PATTERNS = [
  /\b\d{1,2}:\d{2}\b/g, // 11:00
  /\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/g, // 1 Oct
  /\b\d+ (?:minutes?|hours?|days?|weeks?)\b/g, // 24 hours
  /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\b/g, // Thursday
  /(?<=\s)[A-Z][a-z]+(?: [A-Z][a-z]+)*/g, // Priya Shah (not sentence starts)
];

export function factsOf(text: string): string[] {
  return [...new Set(PATTERNS.flatMap((p) => text.match(p) ?? []))];
}

export function factsKept(original: string, simple: string): boolean {
  return factsOf(original).every((f) => simple.includes(f));
}
