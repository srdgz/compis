export function shareInCents(totalEuros: number, debtors: number): number {
  if (!Number.isFinite(totalEuros) || totalEuros <= 0 || debtors < 1) return 0;
  return Math.floor(Math.round(totalEuros * 100) / (debtors + 1));
}

export function parseAmount(raw: string): number {
  const normalised = raw.trim().replace(",", ".");
  const value = Number(normalised);
  return Number.isFinite(value) ? value : 0;
}
