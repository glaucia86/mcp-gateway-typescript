
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { RegistrySchema } from "./registry-schema.js";

async function main(): Promise<void> {
  // Caminho padrão: registry.json na raiz
  const filePath = resolve(
    process.argv[2] ?? "registry.json",
  );

  // 1. Ler o arquivo como texto
  const content = await readFile(filePath, "utf8");

  // 2. Converter JSON para um valor ainda não confiável
  const rawData: unknown = JSON.parse(
    content.replace(/^\uFEFF/, ""),
  );

  // 3. Validar usando o schema
  const result = RegistrySchema.safeParse(rawData);

  if (!result.success) {
    console.error("Registry inválido:");

    for (const issue of result.error.issues) {
      const location =
        issue.path.length > 0
          ? issue.path.join(".")
          : "(raiz)";

      console.error(`- ${location}: ${issue.message}`);
    }

    process.exitCode = 1;
    return;
  }

  // 4. A partir daqui, os dados têm tipos validados
  const registry = result.data;

  const totalTools = registry.servers.reduce(
    (total, server) => total + server.tools.length,
    0,
  );

  const enabledTools = registry.servers.reduce(
    (total, server) =>
      total +
      server.tools.filter((tool) => tool.enabled).length,
    0,
  );

  console.log(`Registry v${registry.version} válido.`);
  console.log(`Servidores: ${registry.servers.length}`);
  console.log(`Ferramentas: ${totalTools}`);
  console.log(`Tools com enabled=true: ${enabledTools}`);
}

try {
  await main();
} catch (error: unknown) {
  console.error(
    "Erro ao ler ou interpretar o Registry:",
    error instanceof Error ? error.message : error,
  );

  process.exitCode = 1;
}
