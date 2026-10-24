import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Action, Reversible } from './defineAction';

/** reversible → MCP tool annotations. */
export function hintsFor(reversible: Reversible) {
  if (reversible === 'read') return { readOnlyHint: true };
  if (reversible === 'none') return { destructiveHint: true };
  return { readOnlyHint: false, destructiveHint: false };
}

/**
 * Registers the same actions the button and the chat use as MCP tools.
 * The agent gets the same checks, and the same read-back sentence
 * the screen reader user hears.
 */
export function toMcpServer(actions: Action[], { name = 'calendar', version = '1.0.0' } = {}) {
  const server = new McpServer({ name, version });

  for (const a of actions) {
    server.registerTool(
      a.name,
      {
        description: a.description,
        inputSchema: a.input.shape,
        annotations: hintsFor(a.reversible),
      },
      async (args: unknown) => {
        try {
          const result = await a.run(args, { source: 'agent' });
          return { content: [{ type: 'text' as const, text: a.say(result) }] };
        } catch (error) {
          // Same error the button would show, returned as a tool error.
          return { isError: true, content: [{ type: 'text' as const, text: String((error as Error).message) }] };
        }
      },
    );
  }
  return server;
}
