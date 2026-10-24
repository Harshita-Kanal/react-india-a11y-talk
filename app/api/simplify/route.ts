import { factsKept } from '@/lib/a11y/simplify';
import { simplifyText } from '@/lib/model';

export async function POST(req: Request) {
  const { text }: { text: string } = await req.json();
  const simple = await simplifyText(text);
  return Response.json({ simple, factsKept: factsKept(text, simple) });
}
