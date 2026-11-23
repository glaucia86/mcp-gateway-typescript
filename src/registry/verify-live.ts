import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { connectLocalServer } from "../client/connect-local-server.js";

import { RegistrySchema } from "./registry-schema.js";
import { createToolFingerprint } from "./tool-fingerprint.js";
import { checkToolDefinition } from "./check-tool-definition.js";

async function main(): Promise<void> {
  // 1. Carregar o Registry salvo em disco
  const content = await readFile(
    resolve("registry.json"),
    "utf8",
  );

  const rawData: unknown = JSON.parse(
    content.replace(/^\uFEFF/, ""),
  );

  const registry = RegistrySchema.parse(rawData);

  // 2. Conectar ao MCP Server real
  const client = await connectLocalServer(
    "src/mcp/branches-stdio.ts",
    "registry-verification-client",
  );

  try {
    // 3. Descobrir a definição atual
    const { tools } = await client.listTools();

    const currentTool = tools.find(
      (tool) => tool.name === "get_branch",
    );

    if (!currentTool) {
      throw new Error(
        "A ferramenta get_branch não foi encontrada.",
      );
    }

    // 4. Recuperar a aprovação armazenada
    const approvedTool = registry.servers
      .find((server) => server.id === "branches")
      ?.tools.find((tool) => tool.name === "get_branch");

    // 5. Verificar a elegibilidade
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
    // 6. Encerrar a conexão MCP
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
