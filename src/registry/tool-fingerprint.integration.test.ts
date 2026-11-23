import { describe, expect, it } from "vitest";

import { connectLocalServer } from "../client/connect-local-server.js";
import { readRegistry } from "./registry-file.js";
import { ToolDefinitionSchema } from "./registry-schema.js";
import { createToolFingerprint } from "./tool-fingerprint.js";

describe("Descoberta de ferramentas MCP reais", () => {
  it("mantém o fingerprint aprovado de get_branch na descoberta via stdio", async () => {
    const { registry } = await readRegistry("registry.json");
    const approvedHash = registry.servers
      .find(({ id }) => id === "branches")
      ?.tools.find(({ name }) => name === "get_branch")
      ?.approvedHash;
    expect(approvedHash).toMatch(/^[a-f0-9]{64}$/);

    const client = await connectLocalServer(
      "src/mcp/branches-stdio.ts",
      "registry-fingerprint-test",
    );

    try {
      const { tools } = await client.listTools();
      const tool = ToolDefinitionSchema.parse(
        tools.find(({ name }) => name === "get_branch"),
      );

      expect(createToolFingerprint(tool)).toBe(approvedHash);
    } finally {
      await client.close();
    }
  }, 20_000);
});
