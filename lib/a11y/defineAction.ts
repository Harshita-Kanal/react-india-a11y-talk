import { tool, type Tool } from 'ai';
import type { z } from 'zod';

/**
 * How much an action changes:
 *  - 'read'  only reads; run it straight away
 *  - 'undo'  changes something we can put back; run it, say what changed, offer Undo
 *  - 'none'  can't be undone; ask first
 */
export type Reversible = 'read' | 'undo' | 'none';

/** Who triggered the action, so the UI can tell the user what an agent did. */
export type RunContext = { source: 'app' | 'chat' | 'agent' };

export type ActionDef<S extends z.ZodObject, R> = {
  name: string;
  description: string;
  input: S;
  reversible: Reversible;
  run: (input: z.infer<S>, ctx: RunContext) => Promise<R>;
  /** The sentence that says what happened. Used by the Announcer, the chat and MCP. */
  say: (result: R) => string;
};

export type Action<S extends z.ZodObject = z.ZodObject, R = unknown> = ActionDef<S, R> & {
  run: (input: unknown, ctx?: RunContext) => Promise<R>;
  asTool: () => Tool;
};

/**
 * One definition behind every way into the app: the button, our chat,
 * and (via toMcpServer) someone else's agent. Same validation, same checks,
 * same read-back.
 */
export function defineAction<S extends z.ZodObject, R>(def: ActionDef<S, R>): Action<S, R> {
  const run = async (input: unknown, ctx: RunContext = { source: 'app' }) => def.run(def.input.parse(input), ctx);

  return {
    ...def,
    run,
    asTool: () =>
      tool({
        description: def.description,
        inputSchema: def.input as z.ZodType<unknown>,
        // Irreversible actions wait for the user, using the AI SDK's tool approval.
        needsApproval: def.reversible === 'none',
        execute: async (input: unknown) => {
          const result = await run(input, { source: 'chat' });
          return { result, message: def.say(result) };
        },
      }) as Tool,
  };
}
