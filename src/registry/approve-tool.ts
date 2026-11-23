import {
  RegistrySchema,
  type Registry,
} from "./registry-schema.js";

import { createToolFingerprint } from "./tool-fingerprint.js";

// Contrato mínimo de uma definição descoberta via MCP.
type DiscoveredTool = {
  name: string;
  inputSchema: object;
};

export function approveTool(
  registry: Registry,
  serverId: string,
  discoveredTool: DiscoveredTool,
  reviewer: string,
): Registry {
  // 1. Criar uma cópia para não modificar o original
  const updated = structuredClone(registry);

  // 2. Localizar o servidor cadastrado
  const server = updated.servers.find(
    (item) => item.id === serverId,
  );

  if (!server) {
    throw new Error(`Servidor não cadastrado: ${serverId}`);
  }

  // 3. Localizar a ferramenta cadastrada
  const tool = server.tools.find(
    (item) => item.name === discoveredTool.name,
  );

  if (!tool) {
    throw new Error(
      `Ferramenta não cadastrada: ${discoveredTool.name}`,
    );
  }

  // 4. Conferir o identificador do responsável
  const reviewerId = reviewer.trim();

  if (reviewerId !== tool.owner) {
    throw new Error(
      `Responsável incompatível com o owner: ${tool.owner}`,
    );
  }

  // 5. Preservar a definição completa descoberta
  const definition: Record<string, unknown> = {
    ...structuredClone(discoveredTool),
  };

  // 6. Registrar os metadados da aprovação
  tool.approvedDefinition = definition;
  tool.approvedHash = createToolFingerprint(definition);
  tool.approvedBy = reviewerId;
  tool.approvedAt = new Date().toISOString();

  // 7. Habilitar explicitamente a ferramenta
  tool.enabled = true;

  // 8. Validar as invariantes antes de retornar
  return RegistrySchema.parse(updated);
}
