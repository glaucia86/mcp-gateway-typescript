
import { describe, expect, it } from "vitest";
import { getStatus } from "./status.js";

describe("Bootstrap do MCP Gateway", () => {
  it("deve retornar o estado inicial", () => {
    expect(getStatus()).toEqual({
      service: "mcp-gateway-typescript-v2",
      stage: "bootstrap",
    });
  });
});
