import {
  RegistrySchema,
  type Registry,
  type ToolDefinition,
} from "./registry-schema.js";

import { createToolFingerprint } from "./tool-fingerprint.js";

export function approveTool(
  registry: Registry,
  serverId: string,
  discoveredTool: ToolDefinition,
  reviewer: string,
): Registry {
  const updated = structuredClone(registry);

  const server = updated.servers.find(
    (item) => item.id === serverId,
  );

  if (!server) {
    throw new Error(`Servidor não cadastrado: ${serverId}`);
  }

  const tool = server.tools.find(
    (item) => item.name === discoveredTool.name,
  );

  if (!tool) {
    throw new Error(
      `Ferramenta não cadastrada: ${discoveredTool.name}`,
    );
  }

  const reviewerId = reviewer.trim();

  if (reviewerId !== tool.owner) {
    throw new Error(
      `Responsável incompatível com o owner: ${tool.owner}`,
    );
  }

  const definition = structuredClone(discoveredTool);

  tool.approvedDefinition = definition;
  tool.approvedHash = createToolFingerprint(definition);
  tool.approvedBy = reviewerId;
  tool.approvedAt = new Date().toISOString();

  tool.enabled = true;

  return RegistrySchema.parse(updated);
}
