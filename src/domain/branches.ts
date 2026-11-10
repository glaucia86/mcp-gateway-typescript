
export interface Branch {
  id: string;
  name: string;
  city: string;
  hours: string;
}

const branches: readonly Branch[] = [
  {
    id: "AG-001",
    name: "Agência Centro (fictícia)",
    city: "Rio de Janeiro",
    hours: "Seg–Sex, 10h–16h (simulado)",
  },
  {
    id: "AG-002",
    name: "Agência Barra (fictícia)",
    city: "Rio de Janeiro",
    hours: "Seg–Sex, 10h–16h (simulado)",
  },
  {
    id: "AG-003",
    name: "Agência Paulista (fictícia)",
    city: "São Paulo",
    hours: "Seg–Sex, 10h–16h (simulado)",
  },
];

export function listBranches(city?: string): Branch[] {
  if (!city) return branches.map((branch) => ({ ...branch }));

  const normalized = city.trim().toLocaleLowerCase("pt-BR");

  return branches
    .filter(
      (branch) =>
        branch.city.toLocaleLowerCase("pt-BR") === normalized,
    )
    .map((branch) => ({ ...branch }));
}

export function getBranch(id: string): Branch | undefined {
  const branch = branches.find((branch) => branch.id === id);

  return branch ? { ...branch } : undefined;
}

export function listCities(): string[] {
  return [...new Set(branches.map((branch) => branch.city))];
}
