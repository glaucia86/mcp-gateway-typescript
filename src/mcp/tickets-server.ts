
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  getTicket,
  listTickets,
  ticketStatuses,
} from "../domain/tickets.js";
import { jsonToolResult, toolError } from "./tool-result.js";

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
        status: z.enum(ticketStatuses).optional(),
      }),
    },
    ({ status }) => jsonToolResult(listTickets(status)),
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
    ({ id }) => {
      const ticket = getTicket(id);

      if (!ticket) {
        return toolError(`Chamado ${id} não encontrado.`);
      }

      return jsonToolResult(ticket);
    },
  );

  return server;
}
