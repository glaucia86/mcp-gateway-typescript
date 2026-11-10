
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  getBranch,
  listBranches,
  listCities,
} from "../domain/branches.js";

export function createBranchesServer(): McpServer {
  const server = new McpServer({
    name: "aurora-bank-branches",
    version: "0.1.0",
  });

  // Tool 1: listar agências
  server.registerTool(
    "list_branches",
    {
      description:
        "Lista agências bancárias fictícias, com filtro opcional por cidade.",
      inputSchema: z.strictObject({
        city: z
          .string()
          .trim()
          .min(2)
          .optional()
          .describe("Ex.: Rio de Janeiro"),
      }),
    },
    async ({ city }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(listBranches(city), null, 2),
        },
      ],
    }),
  );

  // Tool 2: consultar agência
  server.registerTool(
    "get_branch",
    {
      description:
        "Consulta uma agência fictícia pelo identificador AG-000.",
      inputSchema: z.strictObject({
        id: z
          .string()
          .regex(/^AG-\d{3}$/)
          .describe("Ex.: AG-001"),
      }),
    },
    async ({ id }) => {
      const branch = getBranch(id);

      if (!branch) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Agência ${id} não encontrada.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(branch, null, 2),
          },
        ],
      };
    },
  );

  // Tool 3: listar cidades
  server.registerTool(
    "list_cities",
    {
      description:
        "Lista cidades fictícias com agências cadastradas.",
      inputSchema: z.strictObject({}),
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(listCities(), null, 2),
        },
      ],
    }),
  );

  return server;
}
