
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  getBranch,
  listBranches,
  listCities,
} from "../domain/branches.js";
import { jsonToolResult, toolError } from "./tool-result.js";

export function createBranchesServer(): McpServer {
  const server = new McpServer({
    name: "aurora-bank-branches",
    version: "0.1.0",
  });

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
    ({ city }) => jsonToolResult(listBranches(city)),
  );

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
    ({ id }) => {
      const branch = getBranch(id);

      if (!branch) {
        return toolError(`Agência ${id} não encontrada.`);
      }

      return jsonToolResult(branch);
    },
  );

  server.registerTool(
    "list_cities",
    {
      description:
        "Lista cidades fictícias com agências cadastradas.",
      inputSchema: z.strictObject({}),
    },
    () => jsonToolResult(listCities()),
  );

  return server;
}
