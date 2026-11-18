
export type TicketStatus = "open" | "in_progress" | "resolved";

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
}

const tickets: readonly Ticket[] = [
  {
    id: "CH-001",
    subject: "Consulta de horário de agência (simulado)",
    status: "open",
  },
  {
    id: "CH-002",
    subject: "Atualização de contato de demonstração",
    status: "in_progress",
  },
  {
    id: "CH-003",
    subject: "Orientação sobre aplicativo fictício",
    status: "resolved",
  },
];

export function listTickets(status?: TicketStatus): Ticket[] {
  return tickets.filter(
    (ticket) => !status || ticket.status === status,
  );
}

export function getTicket(id: string): Ticket | undefined {
  return tickets.find((ticket) => ticket.id === id);
}
