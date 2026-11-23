import type { Registry } from "./registry-schema.js";

import { createToolFingerprint } from "./tool-fingerprint.js";

// Possíveis resultados da verificação
export type DefinitionStatus =
  | "server_not_registered"
  | "server_disabled"
  | "tool_not_registered"
  | "tool_disabled"
  | "approval_missing"
  | "approval_record_inconsistent"
  | "definition_changed"
  | "definition_unchanged";

// Dados mínimos necessários de uma ferramenta MCP.
// Propriedades adicionais serão preservadas no cálculo do hash.
type CurrentTool = {
  name: string;
  inputSchema: object;
};

export function checkToolDefinition(
  registry: Registry,
  serverId: string,
  currentTool: CurrentTool,
): DefinitionStatus {
  // 1. Localizar o servidor
  const server = registry.servers.find(
    (entry) => entry.id === serverId,
  );

  if (!server) {
    return "server_not_registered";
  }

  if (!server.enabled) {
    return "server_disabled";
  }

  // 2. Localizar a ferramenta
  const tool = server.tools.find(
    (entry) => entry.name === currentTool.name,
  );

  if (!tool) {
    return "tool_not_registered";
  }

  if (!tool.enabled) {
    return "tool_disabled";
  }

  // 3. Verificar metadados de aprovação
  if (
    !tool.approvedBy ||
    !tool.approvedAt ||
    !tool.approvedHash ||
    !tool.approvedDefinition
  ) {
    return "approval_missing";
  }

  // 4. Conferir o snapshot armazenado
  const snapshotHash = createToolFingerprint(
    tool.approvedDefinition,
  );

  if (snapshotHash !== tool.approvedHash) {
    return "approval_record_inconsistent";
  }

  // 5. Comparar a definição atual com a aprovada
  const currentHash = createToolFingerprint(currentTool);

  if (currentHash !== tool.approvedHash) {
    return "definition_changed";
  }

  return "definition_unchanged";
}
