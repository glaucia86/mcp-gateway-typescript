
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createBranchesServer } from "./branches-server.js";

serveStdio(createBranchesServer);

console.error(
  "[branches] MCP Server aguardando cliente via stdio...",
);
