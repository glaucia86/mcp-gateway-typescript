import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readRegistry, writeRegistry } from "./registry-file.js";

vi.mock("node:fs/promises", async (importOriginal) => {
  const original = await importOriginal<typeof fs>();
  return { ...original, rename: vi.fn(original.rename) };
});

const initialRegistry = {
  version: 1,
  servers: [{
    id: "branches",
    owner: "team-branches",
    enabled: true,
    tools: [{
      name: "get_branch",
      owner: "team-branches",
      riskLevel: 0,
      enabled: false,
      approvedBy: null,
      approvedAt: null,
      approvedHash: null,
      approvedDefinition: null,
    }],
  }],
};
const initialContent = `\uFEFF${JSON.stringify(initialRegistry)}`;

describe("Arquivo do Registry", () => {
  let directory: string;
  let path: string;

  beforeEach(async () => {
    directory = await fs.mkdtemp(join(tmpdir(), "mcp-registry-"));
    path = join(directory, "registry.json");
    await fs.writeFile(path, initialContent, "utf8");
  });

  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  it("recusa a gravação enquanto outra execução detém o lock", async () => {
    const { content, registry } = await readRegistry(path);
    const lockPath = `${path}.lock`;
    await fs.writeFile(lockPath, "outra execução", "utf8");

    await expect(writeRegistry(path, content, registry)).rejects.toThrow(
      "Registry ocupado",
    );

    expect(await fs.readFile(path, "utf8")).toBe(initialContent);
    expect(await fs.readFile(lockPath, "utf8")).toBe("outra execução");
  });

  it("persiste apenas uma das duas gravações baseadas na mesma revisão", async () => {
    const { content, registry } = await readRegistry(path);
    const anotherRegistry = structuredClone(registry);
    anotherRegistry.servers[0]!.owner = "team-operations";

    const results = await Promise.allSettled([
      writeRegistry(path, content, registry),
      writeRegistry(path, content, anotherRegistry),
    ]);

    expect(results.filter((result) => result.status === "fulfilled"))
      .toHaveLength(1);
    const winner = results[0]?.status === "fulfilled" ? registry : anotherRegistry;
    expect((await readRegistry(path)).registry).toEqual(winner);
    expect(await fs.readdir(directory)).toEqual(["registry.json"]);
  });

  it("preserva a revisão mais recente quando o conteúdo revisado mudou", async () => {
    const { content, registry } = await readRegistry(path);
    const latestContent = `${initialContent}\n`;
    await fs.writeFile(path, latestContent, "utf8");

    await expect(writeRegistry(path, content, registry)).rejects.toThrow(
      "Registry alterado durante a revisão",
    );

    expect(await fs.readFile(path, "utf8")).toBe(latestContent);
    expect(await fs.readdir(directory)).toEqual(["registry.json"]);
  });

  it("detecta mudanças nos bytes mesmo quando o texto decodificado é igual", async () => {
    const reviewedText = initialContent.replace("team-branches", "team-\uFFFD");
    await fs.writeFile(path, reviewedText, "utf8");
    const { content, registry } = await readRegistry(path);

    const changedCharacter = reviewedText.indexOf("\uFFFD");
    const latestBytes = Buffer.concat([
      Buffer.from(reviewedText.slice(0, changedCharacter)),
      Buffer.of(0xff),
      Buffer.from(reviewedText.slice(changedCharacter + 1)),
    ]);
    await fs.writeFile(path, latestBytes);

    await expect(writeRegistry(path, content, registry)).rejects.toThrow(
      "Registry alterado durante a revisão",
    );

    expect(await fs.readFile(path)).toEqual(latestBytes);
  });

  it("preserva o original e limpa os auxiliares se a substituição falhar", async () => {
    const { content, registry } = await readRegistry(path);
    const rename = vi.mocked(fs.rename);
    rename.mockRejectedValueOnce(new Error("Falha na substituição"));

    try {
      await expect(writeRegistry(path, content, registry)).rejects.toThrow(
        "Falha na substituição",
      );
    } finally {
      rename.mockReset();
    }

    expect(await fs.readFile(path, "utf8")).toBe(initialContent);
    expect(await fs.readdir(directory)).toEqual(["registry.json"]);
  });
});
