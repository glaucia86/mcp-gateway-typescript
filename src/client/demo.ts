
import type { CallToolResult, Client } from "@modelcontextprotocol/client";

import { connectLocalServer } from "./connect-local-server.js";

const openedClients: Client[] = [];

try {
  const branchesClient = await connectLocalServer(
    "src/mcp/branches-stdio.ts",
    "aurora-demo-branches-client",
  );

  openedClients.push(branchesClient);

  const ticketsClient = await connectLocalServer(
    "src/mcp/tickets-stdio.ts",
    "aurora-demo-tickets-client",
  );

  openedClients.push(ticketsClient);

  const { tools: branchTools } = await branchesClient.listTools();
  const { tools: ticketTools } = await ticketsClient.listTools();

  console.log(
    "Tools de agências:",
    branchTools.map((tool) => tool.name),
  );

  console.log(
    "Tools de chamados:",
    ticketTools.map((tool) => tool.name),
  );

  const branchResult = await branchesClient.callTool({
    name: "get_branch",
    arguments: { id: "AG-001" },
  });

  const ticketResult = await ticketsClient.callTool({
    name: "get_ticket",
    arguments: { id: "CH-001" },
  });

  if (branchResult.isError || ticketResult.isError) {
    throw new Error(
      "Uma ferramenta retornou erro de execução.",
    );
  }

  printToolResult("get_branch", branchResult);
  printToolResult("get_ticket", ticketResult);
} catch (error) {
  console.error("Erro na demonstração:", error);
  process.exitCode = 1;
} finally {
  const closeResults = await Promise.allSettled(
    openedClients.map((client) => client.close()),
  );

  for (const closeResult of closeResults) {
    if (closeResult.status === "rejected") {
      console.error("Erro ao encerrar uma conexão:", closeResult.reason);
      process.exitCode = 1;
    }
  }
}

function printToolResult(toolName: string, { content }: CallToolResult): void {
  console.log(`\nResultado de ${toolName}:`);

  for (const block of content) {
    if (block.type === "text") {
      console.log(block.text);
    }
  }
}
