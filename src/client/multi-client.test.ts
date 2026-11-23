
import { describe, expect, it } from "vitest";

import { connectLocalServer } from "./connect-local-server.js";

describe("Conexões MCP por stdio", () => {
  it("descobre e executa ferramentas em servidores separados", async () => {
    const branches = await connectLocalServer(
      "src/mcp/branches-stdio.ts",
      "integration-branches-client",
    );

    try {
      const tickets = await connectLocalServer(
        "src/mcp/tickets-stdio.ts",
        "integration-tickets-client",
      );

      try {
        const branchNames = (
          await branches.listTools()
        ).tools.map((tool) => tool.name);

        const ticketNames = (
          await tickets.listTools()
        ).tools.map((tool) => tool.name);

        expect(branchNames).toContain("get_branch");
        expect(ticketNames).toContain("get_ticket");

        expect(branchNames).not.toContain("get_ticket");
        expect(ticketNames).not.toContain("get_branch");

        const branchResult = await branches.callTool({
          name: "get_branch",
          arguments: { id: "AG-001" },
        });

        const ticketResult = await tickets.callTool({
          name: "get_ticket",
          arguments: { id: "CH-001" },
        });

        expect(branchResult.isError).not.toBe(true);
        expect(ticketResult.isError).not.toBe(true);

        const [branchContent] = branchResult.content;
        const [ticketContent] = ticketResult.content;
        if (branchContent?.type !== "text" || ticketContent?.type !== "text") {
          throw new Error("As ferramentas devem retornar um bloco de texto JSON.");
        }

        expect(JSON.parse(branchContent.text)).toEqual({
          id: "AG-001",
          name: "Agência Centro (fictícia)",
          city: "Rio de Janeiro",
          hours: "Seg–Sex, 10h–16h (simulado)",
        });
        expect(JSON.parse(ticketContent.text)).toEqual({
          id: "CH-001",
          subject: "Consulta de horário de agência (simulado)",
          status: "open",
        });
      } finally {
        await tickets.close();
      }
    } finally {
      await branches.close();
    }
  }, 20_000);

  it("distingue entradas inválidas de um chamado inexistente", async () => {
    const tickets = await connectLocalServer(
      "src/mcp/tickets-stdio.ts",
      "integration-tickets-errors-client",
    );

    try {
      const invalidStatus = await tickets.callTool({
        name: "list_tickets",
        arguments: { status: "invalid" },
      });
      expect(invalidStatus).toMatchObject({
        isError: true,
        content: [{
          type: "text",
          text: expect.stringMatching(/Invalid arguments.*\bstatus\b/),
        }],
      });

      const invalidId = await tickets.callTool({
        name: "get_ticket",
        arguments: { id: "invalid" },
      });
      expect(invalidId).toMatchObject({
        isError: true,
        content: [{
          type: "text",
          text: expect.stringMatching(/Invalid arguments.*\bid\b/),
        }],
      });

      const missingTicket = await tickets.callTool({
        name: "get_ticket",
        arguments: { id: "CH-999" },
      });
      expect(missingTicket).toMatchObject({
        isError: true,
        content: [{ type: "text", text: "Chamado CH-999 não encontrado." }],
      });
    } finally {
      await tickets.close();
    }
  }, 20_000);
});
