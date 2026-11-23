
import * as z from "zod/v4";

// Identificação da equipe responsável
const OwnerSchema = z.string().trim().min(1);

// Contrato de uma ferramenta (tool) cadastrada
const ToolSchema = z.strictObject({
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
});

// Contrato de um servidor (MCP Server) cadastrado
const ServerSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  owner: OwnerSchema,
  enabled: z.boolean(),
  tools: z.array(ToolSchema).min(1),
});

// Contrato completo do Registry
export const RegistrySchema = z.strictObject({
  version: z.literal(1),
  servers: z.array(ServerSchema).min(1),
});

// Tipo TypeScript derivado automaticamente
export type Registry = z.infer<typeof RegistrySchema>;
