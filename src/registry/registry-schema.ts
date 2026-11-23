
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

export const RegistrySchema = z.strictObject({
  version: z.literal(1),
  servers: z.array(ServerSchema).min(1),
});

export type Registry = z.infer<typeof RegistrySchema>;
