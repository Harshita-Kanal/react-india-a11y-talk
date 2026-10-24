import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { chatActions } from '@/lib/calendar/actions';
import { model } from '@/lib/model';

const tools = {
  findMeeting: chatActions[0].asTool(),
  listSlots: chatActions[1].asTool(),
  move: chatActions[2].asTool(),
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model,
    system: [
      'You are a calendar assistant. Days are Mon to Thu, times are 10:00, 11:00, 14:00, 15:00.',
      'Use findMeeting to get a meeting id before using move.',
      'Answer in short, complete sentences. Never repeat a table in prose; the app shows tables itself.',
    ].join(' '),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
