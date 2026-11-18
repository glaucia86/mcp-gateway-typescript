
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

export type LocalServerScript =
  | "src/mcp/branches-stdio.ts"
  | "src/mcp/tickets-stdio.ts";

export async function connectLocalServer(
  serverScript: LocalServerScript,
  clientName: string,
): Promise<Client> {
  const client = new Client({
    name: clientName,
    version: "0.1.0",
  });

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", resolve(serverScript)],
    cwd: process.cwd(),
  });

  try {
    await client.connect(transport);
    return client;
  } catch (error) {
    await client.close();
    throw error;
  }
}
