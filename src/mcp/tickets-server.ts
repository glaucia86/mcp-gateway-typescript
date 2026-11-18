
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  getTicket,
  listTickets,
} from "../domain/tickets.js";

export function createTicketsServer(): McpServer {
  const server = new McpServer({
    name: "aurora-bank-tickets",
    version: "0.1.0",
  });

  server.registerTool(
    "list_tickets",
    {
      description:
        "Lista chamados fictícios, com filtro opcional por status.",
      inputSchema: z.strictObject({
        status: z
          .enum(["open", "in_progress", "resolved"])
          .optional(),
      }),
    },
    async ({ status }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(listTickets(status), null, 2),
        },
      ],
    }),
  );

  server.registerTool(
    "get_ticket",
    {
      description:
        "Consulta um chamado fictício pelo identificador CH-000.",
      inputSchema: z.strictObject({
        id: z.string().regex(/^CH-\d{3}$/),
      }),
    },
    async ({ id }) => {
      const ticket = getTicket(id);

      if (!ticket) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Chamado ${id} não encontrado.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(ticket, null, 2),
          },
        ],
      };
    },
  );

  return server;
}
