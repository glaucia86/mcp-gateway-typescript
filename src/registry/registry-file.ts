import { open, readFile, rename, rm } from "node:fs/promises";

import { RegistrySchema, type Registry } from "./registry-schema.js";

export async function readRegistry(path: string) {
  const content = await readFile(path);
  const data: unknown = JSON.parse(content.toString("utf8").replace(/^\uFEFF/, ""));
  return { content, registry: RegistrySchema.parse(data) };
}

export async function writeRegistry(
  path: string,
  expectedContent: Buffer,
  registry: Registry,
): Promise<void> {
  const lockPath = `${path}.lock`;
  const lock = await open(lockPath, "wx").catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      throw new Error("Registry ocupado por outra aprovação.", { cause: error });
    }
    throw error;
  });

  try {
    try {
      const currentContent = await readFile(path);
      if (!currentContent.equals(expectedContent)) {
        throw new Error("Registry alterado durante a revisão. Reinicie a aprovação.");
      }

      await lock.writeFile(`${JSON.stringify(registry, null, 2)}\n`, "utf8");
    } finally {
      await lock.close();
    }

    // Publishing the temporary file also releases the lock.
    await rename(lockPath, path);
  } catch (error) {
    await rm(lockPath, { force: true });
    throw error;
  }
}
