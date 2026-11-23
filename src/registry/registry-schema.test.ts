
import { describe, expect, it } from "vitest";

import { RegistrySchema } from "./registry-schema.js";

// Criamos um Registry pequeno para os testes.
function createTestRegistry(enabled: boolean) {
  return {
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
            enabled,
            approvedBy: null,
            approvedAt: null,
            approvedHash: null,
            approvedDefinition: null,
          },
        ],
      },
    ],
  };
}

describe("Registry - regras de aprovação", () => {
  it("aceita uma ferramenta desabilitada sem aprovação", () => {
    const registry = createTestRegistry(false);

    const result = RegistrySchema.safeParse(registry);

    expect(result.success).toBe(true);
  });

  it("rejeita uma ferramenta habilitada sem aprovação", () => {
    const registry = createTestRegistry(true);

    const result = RegistrySchema.safeParse(registry);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: [
              "servers",
              0,
              "tools",
              0,
              "enabled",
            ],
          }),
        ]),
      );
    }
  });
});
