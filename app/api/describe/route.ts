import { describe, type Block } from '@/lib/a11y/describe';
import { summariser } from '@/lib/model';

export async function POST(req: Request) {
  const block: Block = await req.json();
  return Response.json(await describe(block, summariser));
}
