import { createHash } from "node:crypto";

/**
 * Organiza recursivamente as propriedades de objetos.
 *
 * A ordem dos elementos de arrays é preservada.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).sort(
      ([keyA], [keyB]) => {
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      },
    );

    return Object.fromEntries(
      entries.map(([key, child]) => [
        key,
        canonicalize(child),
      ]),
    );
  }

  return value;
}

/**
 * Calcula o fingerprint SHA-256 de uma definição MCP.
 *
 * A entrada deve ser um objeto JSON válido.
 */
export function createToolFingerprint(
  definition: unknown,
): string {
  if (
    definition === null ||
    typeof definition !== "object" ||
    Array.isArray(definition)
  ) {
    throw new TypeError(
      "A definição MCP deve ser um objeto JSON.",
    );
  }

  const canonicalJson = JSON.stringify(
    canonicalize(definition),
  );

  return createHash("sha256")
    .update(canonicalJson, "utf8")
    .digest("hex");
}
