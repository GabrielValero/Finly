/**
 * El saldo es derivado: apertura + suma de movimientos. Para que el saldo actual sea `targetMinor`
 * se ajusta la apertura (los movimientos no se tocan).
 */
export function openingForTargetBalance(targetMinor: number, currentBalanceMinor: number, currentOpeningMinor: number): number {
  const movementsSum = currentBalanceMinor - currentOpeningMinor;
  return targetMinor - movementsSum;
}
