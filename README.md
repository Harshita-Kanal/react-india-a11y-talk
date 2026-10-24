# Accessibility in an AI-first world

Example code for the React India 2026 talk *Accessibility in an AI-first world* (Beyond ARIA).

It's a small calendar assistant built with Next.js and the Vercel AI SDK. You can ask it to move a meeting. It's built so that the same request works for a screen reader user, a switch or voice user, and the user's own AI agent over MCP.

## The four helpers

| In an AI-first app, the interface… | Helper | File |
| --- | --- | --- |
| talks (streams replies) | `useSpokenStream` + `<Announcer>` | [`lib/a11y/useSpokenStream.ts`](lib/a11y/useSpokenStream.ts), [`lib/a11y/announcer.tsx`](lib/a11y/announcer.tsx) |
| writes its own content (tables, images, text) | `describe()`, `factsKept()` | [`lib/a11y/describe.ts`](lib/a11y/describe.ts), [`lib/a11y/simplify.ts`](lib/a11y/simplify.ts) |
| acts (changes data) | `defineAction()` | [`lib/a11y/defineAction.ts`](lib/a11y/defineAction.ts) |
| is used by other AI | `toMcpServer()` | [`lib/a11y/toMcpServer.ts`](lib/a11y/toMcpServer.ts) |

### `useSpokenStream` and `<Announcer>`

The message on screen re-renders on every token. The hook hands only complete sentences to a single `role="status"` region, then says "Done." The `<Announcer>` is mounted once in the root layout. It queues lines 150 ms apart, because Safari drops live-region updates that arrive closer together. The transcript is a `role="log"` with `aria-live="off"`, so only the Announcer speaks.

### `describe()`

A model writes a one-line summary of a generated table or image. Plain code then checks the summary against the data: the times it mentions must be exactly the free times. If the check fails, `describe()` falls back to a template that can't be wrong ("Table: 16 rows, 2 free."). Image descriptions start with "Description generated, may be wrong". The plain-language toggle uses `factsKept()` and only shows the rewrite if every time, date, duration and name survived.

### `defineAction()`

One definition per action: name, description, Zod input, how reversible it is, `run`, and `say` (the sentence that describes what happened). The button calls `action.run()`, and the chat gets `action.asTool()`. Both go through the same validation and conflict check, and give the same read-back. Actions marked `reversible: 'none'` use the AI SDK's tool approval. They're also left out of the chat's toolset by default, because other people's text (event descriptions) could trigger them.

### `toMcpServer()`

Registers the same actions as MCP tools. `hintsFor()` turns `reversible` into `readOnlyHint` and `destructiveHint`. The tool returns the `say()` sentence. Changes an agent makes are logged, and the app announces them with Undo the next time the user opens it.

## Run it

```bash
npm install
cp .env.example .env.local   # add OPENAI_API_KEY (or swap the provider in lib/model.ts)
npm run dev                   # http://localhost:3000
```

Try "Move my meeting with Priya to Thursday at 11." with NVDA or VoiceOver on.

## Use it from an agent (MCP)

```bash
npm run mcp
```

To add it to an MCP client such as Claude Desktop:

```json
{
  "mcpServers": {
    "calendar": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/repo/mcp/server.ts"],
      "env": { "CALENDAR_FILE": "/absolute/path/to/repo/.data/calendar.json" }
    }
  }
}
```

The app and the MCP server share `.data/calendar.json`, so a change made by the agent shows up in the app, announced, with Undo.

## Tests

```bash
npm test          # describe(), factsKept(), the actions, MCP hints, and what the status region says while streaming
npm run typecheck
```

## Two checks for your own app

- **Screen reader check:** turn on NVDA or VoiceOver and look away from the screen. Ask your chat something that returns a table and changes data. You should hear whole sentences, a summary of the table, a confirmation that names the change, and "Done".
- **Agent check:** connect your MCP server to any client and finish the task without opening your UI. Then open the UI with a screen reader on, and check you can find and undo what the agent did.

## Notes

- The calendar is a JSON file and is for demonstration only.
- Built against Next.js 16, React 19, AI SDK 7, `@modelcontextprotocol/sdk` 1.32 and Zod 4.
