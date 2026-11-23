import { describe, expect, it } from "vitest";

import { RegistrySchema } from "./registry-schema.js";
import { createToolFingerprint } from "./tool-fingerprint.js";
import { approveTool } from "./approve-tool.js";

const discoveredTool = {
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

function createRegistry() {
  return RegistrySchema.parse({
    version: 1,
    servers: [
      {
        id: "branches",
        owner: "team-branches",
        enabled: false,
        tools: [
          {
            name: "get_branch",
            owner: "team-branches",
            riskLevel: 0,
            enabled: false,
            approvedBy: null,
            approvedAt: null,
            approvedHash: null,
            approvedDefinition: null,
          },
        ],
      },
    ],
  });
}

describe("Aprovação de ferramentas MCP", () => {
  it("registra uma aprovação válida", () => {
    const original = createRegistry();

    const approved = approveTool(
      original,
      "branches",
      discoveredTool,
      "team-branches",
    );

    const tool = approved.servers[0]!.tools[0]!;

    expect(tool.enabled).toBe(true);
    expect(tool.approvedBy).toBe("team-branches");
    expect(tool.approvedAt).toBeTruthy();

    expect(tool.approvedHash).toBe(
      createToolFingerprint(discoveredTool),
    );

    expect(tool.approvedDefinition).toEqual(discoveredTool);

    // Aprovar a ferramenta não habilita o servidor.
    expect(approved.servers[0]!.enabled).toBe(false);

    // A função não modifica o Registry original.
    expect(original.servers[0]!.tools[0]!.enabled).toBe(false);
  });

  it("rejeita um responsável diferente do owner", () => {
    expect(() =>
      approveTool(
        createRegistry(),
        "branches",
        discoveredTool,
        "team-other",
      ),
    ).toThrow("Responsável incompatível");
  });

  it("rejeita uma ferramenta não cadastrada", () => {
    expect(() =>
      approveTool(
        createRegistry(),
        "branches",
        {
          ...discoveredTool,
          name: "unknown_tool",
        },
        "team-branches",
      ),
    ).toThrow("Ferramenta não cadastrada");
  });
});
