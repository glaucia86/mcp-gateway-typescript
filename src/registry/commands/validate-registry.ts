
import { resolve } from "node:path";
import { ZodError } from "zod/v4";

import { readRegistry } from "../registry-file.js";

async function main(): Promise<void> {
  const filePath = resolve(process.argv[2] ?? "registry.json");
  const { registry } = await readRegistry(filePath);

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
  if (error instanceof ZodError) {
    console.error("Registry inválido:");

    for (const issue of error.issues) {
      const location = issue.path.length > 0 ? issue.path.join(".") : "(raiz)";
      console.error(`- ${location}: ${issue.message}`);
    }
  } else {
    console.error(
      "Erro ao ler ou interpretar o Registry:",
      error instanceof Error ? error.message : error,
    );
  }

  process.exitCode = 1;
}
