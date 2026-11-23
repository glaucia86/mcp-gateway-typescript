import { describe, expect, it } from "vitest";

import { connectLocalServer } from "../client/connect-local-server.js";

import { createToolFingerprint } from "./tool-fingerprint.js";

describe("Descoberta de ferramentas MCP reais", () => {
  it("calcula um fingerprint estável para get_branch", async () => {
    const client = await connectLocalServer(
      "src/mcp/branches-stdio.ts",
      "registry-fingerprint-test",
    );

    try {
      // Primeira descoberta
      const firstResponse = await client.listTools();

      const firstTool = firstResponse.tools.find(
        (tool) => tool.name === "get_branch",
      );

      expect(firstTool).toBeDefined();

      if (!firstTool) {
        throw new Error("Ferramenta get_branch não encontrada");
      }

      const firstHash = createToolFingerprint(firstTool);

      expect(firstHash).toMatch(/^[a-f0-9]{64}$/);

      // Segunda descoberta
      const secondResponse = await client.listTools();

      const secondTool = secondResponse.tools.find(
        (tool) => tool.name === "get_branch",
      );

      expect(secondTool).toBeDefined();

      if (!secondTool) {
        throw new Error("Ferramenta get_branch não encontrada");
      }

      const secondHash = createToolFingerprint(secondTool);

      // Definição inalterada deve produzir o mesmo hash
      expect(secondHash).toBe(firstHash);
    } finally {
      await client.close();
    }
  }, 20_000);
});
