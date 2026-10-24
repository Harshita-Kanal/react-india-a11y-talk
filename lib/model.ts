import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { Block, Summariser } from './a11y/describe';

/** Any AI SDK provider works; swap this line to use another one. */
export const model = openai(process.env.OPENAI_MODEL ?? 'gpt-4.1-mini');

export const summariser: Summariser = {
  async summarise(block: Block) {
    if (block.kind === 'table') {
      const { text } = await generateText({
        model,
        system:
          'Summarise this calendar table in one short sentence for someone using a screen reader. Mention every free slot with its day and 24-hour time (e.g. 11:00). No other times.',
        prompt: JSON.stringify(block.rows),
      });
      return text.trim();
    }
    const { text } = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this calendar screenshot in one sentence. Name each free slot with its day and 24-hour time. If you cannot read it, reply with an empty string.' },
            { type: 'image', image: new URL(block.imageUrl) },
          ],
        },
      ],
    });
    return text.trim();
  },
};

export async function simplifyText(text: string) {
  const { text: simple } = await generateText({
    model,
    system:
      'Rewrite in plain language: short sentences, common words. Keep every time, date, duration and name exactly as written.',
    prompt: text,
  });
  return simple.trim();
}
