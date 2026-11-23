import { resolve } from "node:path";

import { connectLocalServer } from "../../client/connect-local-server.js";
import { checkToolDefinition } from "../check-tool-definition.js";
import { readRegistry } from "../registry-file.js";
import { ToolDefinitionSchema } from "../registry-schema.js";
import { createToolFingerprint } from "../tool-fingerprint.js";

async function main(): Promise<void> {
  const { registry } = await readRegistry(resolve("registry.json"));

  const client = await connectLocalServer(
    "src/mcp/branches-stdio.ts",
    "registry-verification-client",
  );

  try {
    const { tools } = await client.listTools();

    const discoveredTool = tools.find(
      (tool) => tool.name === "get_branch",
    );

    if (!discoveredTool) {
      throw new Error(
        "A ferramenta get_branch não foi encontrada.",
      );
    }

    const currentTool = ToolDefinitionSchema.parse(discoveredTool);

    const approvedTool = registry.servers
      .find((server) => server.id === "branches")
      ?.tools.find((tool) => tool.name === "get_branch");

    const status = checkToolDefinition(
      registry,
      "branches",
      currentTool,
    );

    console.log("\nFerramenta: branches:get_branch");
    console.log(`Status: ${status}`);

    console.log(
      `Hash atual: ${createToolFingerprint(currentTool)}`,
    );

    console.log(
      `Hash aprovado: ${approvedTool?.approvedHash ?? "nenhum"}`,
    );

    const eligible = status === "definition_unchanged";

    console.log(
      `Elegível para exposição: ${eligible ? "SIM" : "NÃO"}`,
    );

    if (!eligible) {
      process.exitCode = 1;
    }
  } finally {
    await client.close();
  }
}

try {
  await main();
} catch (error: unknown) {
  console.error(
    "Erro durante a verificação:",
    error instanceof Error ? error.message : error,
  );

  process.exitCode = 1;
}
