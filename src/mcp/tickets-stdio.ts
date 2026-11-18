
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createTicketsServer } from "./tickets-server.js";

serveStdio(createTicketsServer);

console.error(
  "[tickets] MCP Server aguardando cliente via stdio...",
);
