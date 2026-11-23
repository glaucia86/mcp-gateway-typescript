
import * as z from "zod/v4";

const OwnerSchema = z.string().trim().min(1);

const ToolSchema = z
  .strictObject({
    name: z.string().regex(/^[a-z][a-z0-9_]*$/),
    owner: OwnerSchema,
    riskLevel: z.number().int().min(0).max(3),
    enabled: z.boolean(),
    approvedBy: OwnerSchema.nullable(),
    approvedAt: z.iso.datetime({
      offset: true,
    }).nullable(),

    approvedHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),

    approvedDefinition: z
      .record(z.string(), z.unknown())
      .nullable(),
  })
  .refine(
    (tool) => {
      if (!tool.enabled) {
        return true;
      }

      return (
        tool.approvedBy !== null &&
        tool.approvedAt !== null &&
        tool.approvedHash !== null &&
        tool.approvedDefinition !== null
      );
    },
    {
      error:
        "Ferramenta habilitada exige metadados de aprovação completos.",
      path: ["enabled"],
    },
  );

const ServerSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  owner: OwnerSchema,
  enabled: z.boolean(),
  tools: z.array(ToolSchema).min(1),
});

export const RegistrySchema = z
  .strictObject({
    version: z.literal(1),
    servers: z.array(ServerSchema).min(1),
  })
  .superRefine((registry, ctx) => {
    // IDs dos servidores já encontrados
    const serverIds = new Set<string>();

    registry.servers.forEach((server, serverIndex) => {
      // Regra 1: não permitir IDs duplicados
      if (serverIds.has(server.id)) {
        ctx.addIssue({
          code: "custom",
          message: `ID de servidor duplicado: ${server.id}`,
          path: ["servers", serverIndex, "id"],
        });
      } else {
        serverIds.add(server.id);
      }

      // Cada servidor possui seu próprio conjunto de nomes
      const toolNames = new Set<string>();

      server.tools.forEach((tool, toolIndex) => {
        // Regra 2: nomes únicos dentro de um servidor
        if (toolNames.has(tool.name)) {
          ctx.addIssue({
            code: "custom",
            message:
              `Ferramenta duplicada no servidor ${server.id}: ${tool.name}`,
            path: [
              "servers",
              serverIndex,
              "tools",
              toolIndex,
              "name",
            ],
          });
        } else {
          toolNames.add(tool.name);
        }
      });
    });
  });

export type Registry = z.infer<typeof RegistrySchema>;
