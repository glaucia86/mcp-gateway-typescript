import type { Registry, ToolDefinition } from "./registry-schema.js";

import { createToolFingerprint } from "./tool-fingerprint.js";

export type DefinitionStatus =
  | "server_not_registered"
  | "server_disabled"
  | "tool_not_registered"
  | "tool_disabled"
  | "approval_missing"
  | "approval_record_inconsistent"
  | "definition_changed"
  | "definition_unchanged";

export function checkToolDefinition(
  registry: Registry,
  serverId: string,
  currentTool: ToolDefinition,
): DefinitionStatus {
  const server = registry.servers.find(
    (entry) => entry.id === serverId,
  );

  if (!server) {
    return "server_not_registered";
  }

  if (!server.enabled) {
    return "server_disabled";
  }

  const tool = server.tools.find(
    (entry) => entry.name === currentTool.name,
  );

  if (!tool) {
    return "tool_not_registered";
  }

  if (!tool.enabled) {
    return "tool_disabled";
  }

  if (
    !tool.approvedBy ||
    !tool.approvedAt ||
    !tool.approvedHash ||
    !tool.approvedDefinition
  ) {
    return "approval_missing";
  }

  const snapshotHash = createToolFingerprint(
    tool.approvedDefinition,
  );

  if (
    tool.approvedBy !== tool.owner ||
    snapshotHash !== tool.approvedHash
  ) {
    return "approval_record_inconsistent";
  }

  const currentHash = createToolFingerprint(currentTool);

  if (currentHash !== tool.approvedHash) {
    return "definition_changed";
  }

  return "definition_unchanged";
}
