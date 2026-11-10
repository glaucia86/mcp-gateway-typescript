
import { describe, expect, it } from "vitest";

import {
  getBranch,
  listBranches,
  listCities,
} from "./branches.js";

describe("Catálogo fictício de agências", () => {
  it("lista as três agências", () => {
    expect(listBranches()).toHaveLength(3);
  });

  it("preserva o catálogo quando o consumidor altera uma agência da listagem", () => {
    const branch = listBranches().find((item) => item.id === "AG-002");

    if (!branch) {
      throw new Error("A agência AG-002 deve existir na listagem.");
    }

    const originalName = branch.name;

    try {
      branch.name = "Nome alterado pelo consumidor";

      expect(getBranch("AG-002")?.name).toBe("Agência Barra (fictícia)");
    } finally {
      branch.name = originalName;
    }
  });

  it("filtra agências por cidade", () => {
    expect(
      listBranches("  RIO DE JANEIRO  "),
    ).toHaveLength(2);
  });

  it("preserva o catálogo quando o consumidor altera uma agência da listagem filtrada", () => {
    const branch = listBranches("Rio de Janeiro").find(
      (item) => item.id === "AG-002",
    );

    if (!branch) {
      throw new Error("A agência AG-002 deve existir na listagem filtrada.");
    }

    const originalName = branch.name;

    try {
      branch.name = "Nome alterado pelo consumidor";

      expect(getBranch("AG-002")?.name).toBe("Agência Barra (fictícia)");
    } finally {
      branch.name = originalName;
    }
  });

  it("consulta uma agência pelo identificador", () => {
    expect(getBranch("AG-002")?.name).toBe(
      "Agência Barra (fictícia)",
    );
  });

  it("não inventa uma agência inexistente", () => {
    expect(getBranch("AG-999")).toBeUndefined();
  });

  it("preserva o catálogo quando o consumidor altera uma agência consultada", () => {
    const branch = getBranch("AG-002");

    if (!branch) {
      throw new Error("A agência AG-002 deve existir para esta consulta.");
    }

    const originalName = branch.name;

    try {
      branch.name = "Nome alterado pelo consumidor";

      expect(getBranch("AG-002")?.name).toBe("Agência Barra (fictícia)");
    } finally {
      branch.name = originalName;
    }
  });

  it("lista cidades sem duplicações", () => {
    expect(listCities()).toEqual([
      "Rio de Janeiro",
      "São Paulo",
    ]);
  });
});
