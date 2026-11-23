import {
  connectLocalServer,
  type LocalServerScript,
} from "../../client/connect-local-server.js";

import { ToolDefinitionSchema } from "../registry-schema.js";
import { createToolFingerprint } from "../tool-fingerprint.js";

type DiscoveryServer = {
  id: string;
  script: LocalServerScript;
};

const servers: DiscoveryServer[] = [
  {
    id: "branches",
    script: "src/mcp/branches-stdio.ts",
  },
  {
    id: "tickets",
    script: "src/mcp/tickets-stdio.ts",
  },
];

async function discoverServerFingerprints(server: DiscoveryServer): Promise<void> {
  const client = await connectLocalServer(
    server.script,
    `registry-discovery-${server.id}`,
  );

  try {
    const response = await client.listTools();

    for (const definition of response.tools) {
      const tool = ToolDefinitionSchema.parse(definition);
      const fingerprint = createToolFingerprint(tool);
      console.log(`${server.id}:${tool.name}`);
      console.log(`  SHA-256: ${fingerprint}`);
    }
  } finally {
    await client.close();
  }
}

async function main(): Promise<void> {
  for (const server of servers) {
    await discoverServerFingerprints(server);
  }
}

try {
  await main();
} catch (error: unknown) {
  console.error(
    "Erro durante a descoberta:",
    error instanceof Error ? error.message : error,
  );

  process.exitCode = 1;
}
