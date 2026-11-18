
import { describe, expect, it } from "vitest";

import {
  getTicket,
  listTickets,
} from "./tickets.js";

describe("Catálogo fictício de chamados", () => {
  it("lista três chamados", () => {
    expect(listTickets()).toHaveLength(3);
  });

  it("filtra por status", () => {
    expect(
      listTickets("open").map((ticket) => ticket.id),
    ).toEqual(["CH-001"]);
  });

  it("retorna undefined para chamado inexistente", () => {
    expect(getTicket("CH-999")).toBeUndefined();
  });

  it.each([
    { origem: "na listagem", consultar: () => listTickets("open")[0] },
    { origem: "na consulta por ID", consultar: () => getTicket("CH-001") },
  ])(
    "preserva o catálogo ao alterar um chamado retornado $origem",
    ({ consultar }) => {
      const ticket = consultar();
      if (!ticket) {
        throw new Error("O chamado CH-001 deve existir.");
      }

      const originalSubject = ticket.subject;
      try {
        ticket.subject = "Assunto alterado pelo consumidor";
        expect(getTicket("CH-001")?.subject).toBe(
          "Consulta de horário de agência (simulado)",
        );
      } finally {
        ticket.subject = originalSubject;
      }
    },
  );
});
