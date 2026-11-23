import { describe, expect, it } from "vitest";

import { createToolFingerprint } from "./tool-fingerprint.js";

const toolDefinition = {
  name: "get_branch",
  description: "Consulta uma agência fictícia.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        pattern: "^AG-\\d{3}$",
      },
    },
    required: ["id"],
  },
};

describe("Fingerprint de ferramentas MCP", () => {
  it("gera um hash SHA-256 hexadecimal", () => {
    const hash = createToolFingerprint(toolDefinition);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("ignora diferenças na ordem das propriedades", () => {
    const reordered = {
      inputSchema: {
        required: ["id"],
        properties: {
          id: {
            pattern: "^AG-\\d{3}$",
            type: "string",
          },
        },
        type: "object",
      },
      description: "Consulta uma agência fictícia.",
      name: "get_branch",
    };

    expect(createToolFingerprint(reordered)).toBe(
      createToolFingerprint(toolDefinition),
    );
  });

  it("detecta alteração na descrição", () => {
    const changed = {
      ...toolDefinition,
      description: "Consulta informações atualizadas.",
    };

    expect(createToolFingerprint(changed)).not.toBe(
      createToolFingerprint(toolDefinition),
    );
  });

  it("detecta alteração no inputSchema", () => {
    const changed = {
      ...toolDefinition,
      inputSchema: {
        ...toolDefinition.inputSchema,
        properties: {
          id: {
            ...toolDefinition.inputSchema.properties.id,
            minLength: 6,
          },
        },
      },
    };

    expect(createToolFingerprint(changed)).not.toBe(
      createToolFingerprint(toolDefinition),
    );
  });
});
