/**
 * El saldo es derivado: apertura + suma de movimientos. Para que el saldo actual sea `targetMinor`
 * se ajusta la apertura (los movimientos no se tocan).
 */
export function openingForTargetBalance(targetMinor: number, currentBalanceMinor: number, currentOpeningMinor: number): number {
  const movementsSum = currentBalanceMinor - currentOpeningMinor;
  return targetMinor - movementsSum;
}

const KIND_BY_ICON: Record<string, string> = {
  cash: 'Efectivo',
  bank: 'Banco',
  wallet: 'Billetera',
  dollar: 'Divisas',
  phone: 'Pago móvil',
  briefcase: 'Trabajo',
};

/** Tipo legible de la cuenta, derivado de su ícono ("USD · Efectivo"); null si el ícono no lo dice. */
export function accountKindLabel(icon: string): string | null {
  return KIND_BY_ICON[icon] ?? null;
}
