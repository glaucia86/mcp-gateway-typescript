import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

import { connectLocalServer } from "../../client/connect-local-server.js";
import { approveTool } from "../approve-tool.js";
import { readRegistry, writeRegistry } from "../registry-file.js";
import { ToolDefinitionSchema } from "../registry-schema.js";
import { createToolFingerprint } from "../tool-fingerprint.js";

const SERVER_ID = "branches";
const TOOL_NAME = "get_branch";
const DEFAULT_REVIEWER = "team-branches";

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

    return ToolDefinitionSchema.parse(tool);
  } finally {
    await client.close();
  }
}

async function main(): Promise<void> {
  const registryPath = resolve("registry.json");
  const reviewer = process.argv[2] ?? DEFAULT_REVIEWER;

  const { content, registry } = await readRegistry(registryPath);
  const server = registry.servers.find(({ id }) => id === SERVER_ID);

  if (!server) {
    throw new Error(`Servidor não cadastrado: ${SERVER_ID}`);
  }

  const liveTool = await discoverTool();
  const fingerprint = createToolFingerprint(liveTool);

  console.log("\nDefinição descoberta:");
  console.log(JSON.stringify(liveTool, null, 2));

  console.log(`\nSHA-256 atual: ${fingerprint}`);

  const previousHash = server.tools
    .find((tool) => tool.name === TOOL_NAME)
    ?.approvedHash;

  console.log(
    `SHA-256 anteriormente aprovado: ${previousHash ?? "nenhum"}`,
  );
  console.log(`Responsável pela aprovação: ${reviewer.trim()}`);

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

  const updated = approveTool(
    registry,
    SERVER_ID,
    liveTool,
    reviewer,
  );

  await writeRegistry(registryPath, content, updated);

  console.log(
    `\nAprovação registrada: ${SERVER_ID}:${TOOL_NAME}`,
  );
  console.log(`Servidor permanece ${server.enabled ? "habilitado" : "desabilitado"}.`);
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
