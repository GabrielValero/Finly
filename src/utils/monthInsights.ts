import { monthOf } from './dates';
import { safeUsd } from './movementRows';
import type { SummaryTx } from './summary';

export type TrendTx = SummaryTx;

/**
 * Balance neto acumulado (USD centavos) al cierre de cada día del mes: `points` valores, del día 1 al `points`.
 * Las transferencias y las categorías excluidas no cuentan (mismo criterio que los totales del mes).
 */
export function balanceTrend(rows: readonly TrendTx[], month: string, points: number, excluded: ReadonlySet<string> = new Set()): number[] {
  const perDay = new Array<number>(points).fill(0);
  for (const r of rows) {
    if (r.deletedAt || r.kind === 'transfer') continue;
    if (monthOf(r.occurredAt) !== month) continue;
    if (r.categoryId && excluded.has(r.categoryId)) continue;
    const day = Number(r.occurredAt.slice(8, 10));
    if (day < 1 || day > points) continue;
    perDay[day - 1]! += safeUsd(r) ?? 0;
  }
  let sum = 0;
  return perDay.map((d) => (sum += d));
}

export interface BudgetPulse {
  remainingMinor: number;
  perDayMinor: number;
  daysLeft: number;
  /** 0..n del plan gastado. */
  pct: number;
  over: boolean;
  /** El mes ya terminó: la frase va en pasado. */
  past: boolean;
}

/** Datos de la frase "Te quedan $X para terminar el mes". null si no hay gasto planificado. */
export function budgetPulse(args: { plannedMinor: number; spentMinor: number; today: string; month: string }): BudgetPulse | null {
  const { plannedMinor, spentMinor, today, month } = args;
  if (plannedMinor <= 0) return null;
  const [y, m] = month.split('-').map(Number) as [number, number];
  const monthDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const todayMonth = today.slice(0, 7);
  const daysLeft = todayMonth < month ? monthDays : todayMonth > month ? 0 : monthDays - Number(today.slice(8, 10)) + 1;
  const remainingMinor = plannedMinor - spentMinor;
  const over = remainingMinor < 0;
  return {
    remainingMinor,
    perDayMinor: over || daysLeft === 0 ? 0 : Math.floor(remainingMinor / daysLeft),
    daysLeft,
    pct: spentMinor / plannedMinor,
    over,
    past: todayMonth > month,
  };
}
