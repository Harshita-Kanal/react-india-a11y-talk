/**
 * The same actions the app uses, served over MCP (stdio).
 *
 *   npm run mcp
 *
 * Add to an MCP client (e.g. Claude Desktop) with:
 *   { "command": "npx", "args": ["tsx", "/absolute/path/to/mcp/server.ts"],
 *     "env": { "CALENDAR_FILE": "/absolute/path/to/.data/calendar.json" } }
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { toMcpServer } from '../lib/a11y/toMcpServer';
import { chatActions } from '../lib/calendar/actions';

const server = toMcpServer(chatActions);
await server.connect(new StdioServerTransport());
