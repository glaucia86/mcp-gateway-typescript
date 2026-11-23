import { describe, expect, it } from "vitest";

import { approveTool } from "./approve-tool.js";
import { RegistrySchema } from "./registry-schema.js";
import { createToolFingerprint } from "./tool-fingerprint.js";
import { checkToolDefinition } from "./check-tool-definition.js";

const currentTool = {
  name: "get_branch",
  description: "Consulta uma agência fictícia.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string" },
    },
    required: ["id"],
  },
};

// Cria um registro aprovado apenas para nossos testes.
function createApprovedRegistry() {
  return RegistrySchema.parse({
    version: 1,
    servers: [
      {
        id: "branches",
        owner: "team-branches",
        enabled: true,
        tools: [
          {
            name: "get_branch",
            owner: "team-branches",
            riskLevel: 0,
            enabled: true,
            approvedBy: "team-branches",
            approvedAt: "2026-11-23T12:00:00Z",
            approvedHash: createToolFingerprint(currentTool),
            approvedDefinition: structuredClone(currentTool),
          },
        ],
      },
    ],
  });
}

describe("Verificação de definições MCP", () => {
  it("aceita a definição aprovada e inalterada", () => {
    const registry = createApprovedRegistry();

    expect(
      checkToolDefinition(registry, "branches", currentTool),
    ).toBe("definition_unchanged");
  });

  it("exige nova aprovação quando o responsável pela ferramenta muda", () => {
    const registry = createApprovedRegistry();
    registry.servers[0]!.tools[0]!.owner = "team-operations";

    expect(
      checkToolDefinition(registry, "branches", currentTool),
    ).toBe("approval_record_inconsistent");

    const reapproved = approveTool(
      registry,
      "branches",
      currentTool,
      "team-operations",
    );
    expect(
      checkToolDefinition(reapproved, "branches", currentTool),
    ).toBe("definition_unchanged");
  });

  it("detecta alteração na descrição", () => {
    const registry = createApprovedRegistry();

    const changedTool = {
      ...currentTool,
      description: "Consulta dados atualizados.",
    };

    expect(
      checkToolDefinition(registry, "branches", changedTool),
    ).toBe("definition_changed");
  });

  it("detecta inconsistência no hash aprovado", () => {
    const registry = createApprovedRegistry();

    registry.servers[0]!.tools[0]!.approvedHash =
      "0".repeat(64);

    expect(
      checkToolDefinition(registry, "branches", currentTool),
    ).toBe("approval_record_inconsistent");
  });

  it("não considera elegível uma ferramenta desabilitada", () => {
    const registry = createApprovedRegistry();

    registry.servers[0]!.tools[0]!.enabled = false;

    expect(
      checkToolDefinition(registry, "branches", currentTool),
    ).toBe("tool_disabled");
  });

  it("não considera elegível um servidor desabilitado", () => {
    const registry = createApprovedRegistry();

    registry.servers[0]!.enabled = false;

    expect(
      checkToolDefinition(registry, "branches", currentTool),
    ).toBe("server_disabled");
  });
});
