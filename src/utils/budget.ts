import type { CategoryKind } from './categories';

export interface BudgetItemLite {
  id: string;
  categoryId: string;
  kind: CategoryKind;
  plannedMinor: number;
  isFixed: boolean;
}

/** Lo mínimo de un movimiento para saber si cuenta en el presupuesto y como qué. */
export interface BudgetableRow {
  kind: 'income' | 'expense' | 'transfer';
  /** Con signo, en la moneda de la cuenta. */
  amountMinor: number;
  categoryId: string | null;
}

/**
 * Cómo cuenta un movimiento en el presupuesto (null = no cuenta).
 * - Gasto/ingreso: tal cual.
 * - Transferencia: solo si tiene categoría, y una sola vez, por su pata de salida, como gasto.
 *   La pata de entrada nunca cuenta, para no duplicar el monto.
 */
export function budgetKind(row: BudgetableRow): CategoryKind | null {
  if (row.kind !== 'transfer') return row.kind;
  return row.categoryId !== null && row.amountMinor < 0 ? 'expense' : null;
}

export interface BudgetCategory {
  id: string;
  parentId: string | null;
}

export interface BudgetTx {
  kind: 'income' | 'expense' | 'transfer';
  /** Magnitud positiva en USD (centavos) con la tasa congelada del movimiento. */
  usdMinor: number;
  categoryId: string | null;
  /** Categoría marcada "no cuenta en reportes". */
  excluded: boolean;
}

export interface Allocation {
  /** Real por partida (id de partida → USD centavos). */
  byItem: Map<string, number>;
  /** Gasto/ingreso del mes que no cae en ninguna partida. */
  unplanned: { expense: number; income: number };
}

/**
 * Regla única de reparto: un movimiento va a la partida de su categoría o, si no hay, a la de su categoría padre.
 * La usan el total de cada partida y la lista de sus movimientos, para que nunca se contradigan.
 */
export function itemResolver(items: readonly BudgetItemLite[], categories: readonly BudgetCategory[]) {
  const itemOf = new Map<string, BudgetItemLite>();
  for (const it of items) itemOf.set(`${it.kind}:${it.categoryId}`, it);
  const parentOf = new Map(categories.map((c) => [c.id, c.parentId]));
  return (tx: Pick<BudgetTx, 'kind' | 'categoryId'>): BudgetItemLite | undefined => {
    if (tx.kind === 'transfer' || !tx.categoryId) return undefined;
    const own = itemOf.get(`${tx.kind}:${tx.categoryId}`);
    const parentId = parentOf.get(tx.categoryId);
    return own ?? (parentId ? itemOf.get(`${tx.kind}:${parentId}`) : undefined);
  };
}

/** Los movimientos que cuentan para una partida (mismo reparto que el total). */
export function txsOfItem<T extends BudgetableRow>(
  itemId: string,
  items: readonly BudgetItemLite[],
  categories: readonly BudgetCategory[],
  txs: readonly T[],
  isExcluded: (tx: T) => boolean,
): T[] {
  const find = itemResolver(items, categories);
  return txs.filter((tx) => {
    const kind = budgetKind(tx);
    return kind !== null && !isExcluded(tx) && find({ kind, categoryId: tx.categoryId })?.id === itemId;
  });
}

/**
 * Reparte los movimientos del mes entre las partidas del presupuesto.
 * Cada movimiento va a la partida más específica: la de su categoría, o si no hay, la de su categoría padre.
 * Las transferencias y las categorías excluidas no cuentan.
 */
export function allocateSpending(items: readonly BudgetItemLite[], txs: readonly BudgetTx[], categories: readonly BudgetCategory[]): Allocation {
  const find = itemResolver(items, categories);
  const byItem = new Map<string, number>(items.map((i) => [i.id, 0]));
  const unplanned = { expense: 0, income: 0 };

  for (const tx of txs) {
    if (tx.kind === 'transfer' || tx.excluded) continue;
    const item = find(tx);
    if (item) byItem.set(item.id, (byItem.get(item.id) ?? 0) + tx.usdMinor);
    else unplanned[tx.kind] += tx.usdMinor;
  }
  return { byItem, unplanned };
}

export type ItemStatus = 'paid' | 'partial' | 'pending' | 'ok' | 'near' | 'over';

/** Umbral de "cerca del límite" para gastos variables. */
export const NEAR_LIMIT = 0.8;

/**
 * Estado de una partida.
 * - Fija (o ingreso): pagado / parcial / pendiente según lo ejecutado.
 * - Variable: ok / cerca del límite (>= 80 %) / te pasaste (> 100 %).
 */
export function itemStatus(item: Pick<BudgetItemLite, 'kind' | 'isFixed' | 'plannedMinor'>, actualMinor: number): ItemStatus {
  if (item.kind === 'income' || item.isFixed) {
    if (item.plannedMinor > 0 && actualMinor >= item.plannedMinor) return 'paid';
    return actualMinor > 0 ? 'partial' : 'pending';
  }
  if (actualMinor > item.plannedMinor) return 'over';
  if (item.plannedMinor > 0 && actualMinor / item.plannedMinor >= NEAR_LIMIT) return 'near';
  return 'ok';
}

/** Progreso 0..1 para la barra. */
export function progressOf(plannedMinor: number, actualMinor: number): number {
  if (plannedMinor <= 0) return actualMinor > 0 ? 1 : 0;
  return Math.min(Math.max(actualMinor / plannedMinor, 0), 1);
}

export interface BudgetTotals {
  plannedExpense: number;
  plannedIncome: number;
  /** Gasto real SOLO de categorías planificadas (para que el % sea coherente). */
  spentPlanned: number;
  receivedPlanned: number;
  /** Ingresos planificados − gastos planificados (negativo = el plan no cuadra). */
  leftover: number;
  /** 0..n (puede superar 1). */
  percent: number;
}

export function budgetTotals(items: readonly BudgetItemLite[], byItem: ReadonlyMap<string, number>): BudgetTotals {
  let plannedExpense = 0;
  let plannedIncome = 0;
  let spentPlanned = 0;
  let receivedPlanned = 0;
  for (const it of items) {
    const actual = byItem.get(it.id) ?? 0;
    if (it.kind === 'expense') {
      plannedExpense += it.plannedMinor;
      spentPlanned += actual;
    } else {
      plannedIncome += it.plannedMinor;
      receivedPlanned += actual;
    }
  }
  return { plannedExpense, plannedIncome, spentPlanned, receivedPlanned, leftover: plannedIncome - plannedExpense, percent: plannedExpense > 0 ? spentPlanned / plannedExpense : 0 };
}

/** Mes anterior más cercano (estrictamente menor) que tenga partidas. */
export function previousBudgetMonth(month: string, monthsWithItems: readonly string[]): string | null {
  const earlier = monthsWithItems.filter((m) => m < month).sort();
  return earlier[earlier.length - 1] ?? null;
}

export interface BudgetItemDraft {
  categoryId: string | null;
  categoryKind: CategoryKind | null;
  kind: CategoryKind;
  plannedMinor: number;
  /** Categorías que ya tienen partida este mes (por tipo). */
  takenCategoryIds: readonly string[];
}

/** Primer problema al guardar una partida, o null. */
export function validateBudgetItem(d: BudgetItemDraft): string | null {
  if (!d.categoryId || !d.categoryKind) return 'Elige una categoría';
  if (d.categoryKind !== d.kind) return 'La categoría no es del tipo elegido';
  if (d.takenCategoryIds.includes(d.categoryId)) return 'Esa categoría ya está en el presupuesto';
  if (!Number.isSafeInteger(d.plannedMinor) || d.plannedMinor <= 0) return 'Escribe un monto mayor a 0';
  return null;
}
