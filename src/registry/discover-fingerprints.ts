import {
  connectLocalServer,
  type LocalServerScript,
} from "../client/connect-local-server.js";

import { createToolFingerprint } from "./tool-fingerprint.js";

// Servidores MCP que vamos consultar.
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

    for (const tool of response.tools) {
      const fingerprint = createToolFingerprint(tool);
      console.log(`${server.id}:${tool.name}`);
      console.log(`  SHA-256: ${fingerprint}`);
    }
  } finally {
    await client.close();
  }
}

function main(): Promise<void> {
  return servers.reduce(async (previous, server) => {
    await previous;
    await discoverServerFingerprints(server);
  }, Promise.resolve());
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
