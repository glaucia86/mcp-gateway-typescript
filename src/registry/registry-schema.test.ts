
import { describe, expect, it } from "vitest";

import { RegistrySchema } from "./registry-schema.js";

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

describe("Registry - regras de consistência", () => {
  it("aceita ferramenta desabilitada sem aprovação", () => {
    const registry = createTestRegistry(false);

    const result = RegistrySchema.safeParse(registry);

    expect(result.success).toBe(true);
  });

  it("rejeita ferramenta habilitada sem aprovação", () => {
    const registry = createTestRegistry(true);

    const result = RegistrySchema.safeParse(registry);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["servers", 0, "tools", 0, "enabled"],
          }),
        ]),
      );
    }
  });

  it.each([
    { label: "sem nome", definition: { inputSchema: {} }, path: ["name"] },
    {
      label: "sem schema de entrada",
      definition: { name: "get_branch" },
      path: ["inputSchema"],
    },
    {
      label: "com schema de entrada em lista",
      definition: { name: "get_branch", inputSchema: [] },
      path: ["inputSchema"],
    },
    {
      label: "com nome de outra ferramenta",
      definition: { name: "list_branches", inputSchema: {} },
      path: ["name"],
    },
  ])("rejeita aprovação $label", ({ definition, path }) => {
    const registry = createTestRegistry(true);
    const server = registry.servers[0]!;
    const record = {
      ...server.tools[0]!,
      approvedBy: "team-branches",
      approvedAt: "2026-11-23T12:00:00Z",
      approvedHash: "a".repeat(64),
      approvedDefinition: definition,
    };

    const result = RegistrySchema.safeParse({
      ...registry,
      servers: [{ ...server, tools: [record] }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["servers", 0, "tools", 0, "approvedDefinition", ...path],
        }),
      );
    }
  });

  it("rejeita IDs duplicados de servidores", () => {
    const registry = createTestRegistry(false);

    const firstServer = registry.servers[0]!;

    registry.servers.push({
      ...firstServer,
      tools: firstServer.tools.map((tool) => ({ ...tool })),
    });

    const result = RegistrySchema.safeParse(registry);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["servers", 1, "id"],
            message: "ID de servidor duplicado: branches",
          }),
        ]),
      );
    }
  });

  it("rejeita ferramentas duplicadas no mesmo servidor", () => {
    const registry = createTestRegistry(false);

    const server = registry.servers[0]!;

    server.tools.push({ ...server.tools[0]! });

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
              1,
              "name",
            ],
          }),
        ]),
      );
    }
  });

  it("permite nomes iguais em servidores diferentes", () => {
    const registry = createTestRegistry(false);

    const firstServer = registry.servers[0]!;

    registry.servers.push({
      ...firstServer,
      id: "tickets",
      owner: "team-tickets",
      tools: firstServer.tools.map((tool) => ({
        ...tool,
        owner: "team-tickets",
      })),
    });

    const result = RegistrySchema.safeParse(registry);

    expect(result.success).toBe(true);
  });
});
