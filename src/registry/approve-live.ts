import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

import { connectLocalServer } from "../client/connect-local-server.js";
import { RegistrySchema } from "./registry-schema.js";
import { createToolFingerprint } from "./tool-fingerprint.js";
import { approveTool } from "./approve-tool.js";

const SERVER_ID = "branches";
const TOOL_NAME = "get_branch";
const REVIEWER = "team-branches";

// Consulta a definição anunciada pelo MCP Server.
async function discoverTool() {
  const client = await connectLocalServer(
    "src/mcp/branches-stdio.ts",
    "registry-approval-client",
  );

  try {
    const { tools } = await client.listTools();

    const tool = tools.find(
      (item) => item.name === TOOL_NAME,
    );

    if (!tool) {
      throw new Error(`Tool não encontrada: ${TOOL_NAME}`);
    }

    return tool;
  } finally {
    await client.close();
  }
}

async function main(): Promise<void> {
  const registryPath = resolve("registry.json");

  // 1. Carregar e validar o Registry atual.
  const originalContent = await readFile(
    registryPath,
    "utf8",
  );

  const rawData: unknown = JSON.parse(
    originalContent.replace(/^\uFEFF/, ""),
  );

  const registry = RegistrySchema.parse(rawData);

  // 2. Consultar a definição real.
  const liveTool = await discoverTool();
  const fingerprint = createToolFingerprint(liveTool);

  // 3. Apresentar a definição para revisão.
  console.log("\nDefinição descoberta:");
  console.log(JSON.stringify(liveTool, null, 2));

  console.log(`\nSHA-256 atual: ${fingerprint}`);

  const previousHash = registry.servers
    .find((server) => server.id === SERVER_ID)
    ?.tools.find((tool) => tool.name === TOOL_NAME)
    ?.approvedHash;

  console.log(
    `SHA-256 anteriormente aprovado: ${previousHash ?? "nenhum"}`,
  );

  // 4. Exigir confirmação explícita.
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let confirmation: string;

  try {
    confirmation = await rl.question(
      "\nDigite APROVAR para confirmar a revisão: ",
    );
  } finally {
    rl.close();
  }

  if (confirmation !== "APROVAR") {
    console.log("Operação cancelada. Registry inalterado.");
    return;
  }

  // 5. Registrar aprovação usando nossa função anterior.
  const updated = approveTool(
    registry,
    SERVER_ID,
    liveTool,
    REVIEWER,
  );

  // 6. Evitar sobrescrever uma alteração feita durante a revisão.
  const currentContent = await readFile(
    registryPath,
    "utf8",
  );

  if (currentContent !== originalContent) {
    throw new Error(
      "Registry alterado durante a revisão. Reinicie a aprovação.",
    );
  }

  // 7. Persistir em arquivo temporário e substituir o original.
  const tempPath = `${registryPath}.${process.pid}.tmp`;

  await writeFile(
    tempPath,
    `${JSON.stringify(updated, null, 2)}\n`,
    "utf8",
  );

  await rename(tempPath, registryPath);

  console.log(
    `\nAprovação registrada: ${SERVER_ID}:${TOOL_NAME}`,
  );
  console.log("Servidor permanece desabilitado.");
}

try {
  await main();
} catch (error: unknown) {
  console.error(
    "Erro na aprovação:",
    error instanceof Error ? error.message : error,
  );

  process.exitCode = 1;
}
