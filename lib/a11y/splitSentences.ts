const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });

/**
 * Splits text into sentences using the browser's built-in segmenter.
 * Segments keep their trailing whitespace, so their lengths add up to the
 * length of the input. That lets callers track how much they've consumed.
 */
export function splitSentences(text: string): string[] {
  return [...segmenter.segment(text)].map((s) => s.segment);
}
