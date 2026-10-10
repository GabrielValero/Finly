import { and, eq, lt } from 'drizzle-orm';
import { db } from '../db';
import { budgetItems, budgets } from '../schema';
import { newId } from '../../utils/ids';
import { previousBudgetMonth } from '../../utils/budget';

export interface BudgetItemFields {
  month: string;
  categoryId: string;
  kind: 'income' | 'expense';
  plannedMinor: number;
  isFixed: boolean;
}

/** Devuelve el presupuesto del mes (lo crea si no existe). Debe llamarse dentro de una transacción. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
function budgetIdFor(tx: Tx, month: string, now: Date): string {
  const found = tx.select({ id: budgets.id }).from(budgets).where(eq(budgets.month, month)).get();
  if (found) return found.id;
  const id = newId();
  tx.insert(budgets).values({ id, month, baseCurrency: 'USD', updatedAt: now }).run();
  return id;
}

/** Crea o actualiza la partida de una categoría en un mes (una por categoría). */
export async function saveBudgetItem(f: BudgetItemFields, now: Date): Promise<void> {
  db.transaction((tx) => {
    const budgetId = budgetIdFor(tx, f.month, now);
    const existing = tx.select({ id: budgetItems.id }).from(budgetItems).where(and(eq(budgetItems.budgetId, budgetId), eq(budgetItems.categoryId, f.categoryId))).get();
    const values = { kind: f.kind, plannedMinor: f.plannedMinor, isFixed: f.kind === 'expense' && f.isFixed, updatedAt: now };
    if (existing) tx.update(budgetItems).set(values).where(eq(budgetItems.id, existing.id)).run();
    else tx.insert(budgetItems).values({ id: newId(), budgetId, categoryId: f.categoryId, ...values }).run();
  });
}

export async function deleteBudgetItem(id: string): Promise<void> {
  db.delete(budgetItems).where(eq(budgetItems.id, id)).run();
}

/**
 * Copia al mes las partidas del mes anterior más cercano que tenga (solo las categorías que aún no están).
 * Devuelve cuántas partidas se copiaron.
 */
export async function copyBudgetFromPrevious(month: string, now: Date): Promise<number> {
  return db.transaction((tx) => {
    const months = tx
      .selectDistinct({ month: budgets.month })
      .from(budgets)
      .innerJoin(budgetItems, eq(budgetItems.budgetId, budgets.id))
      .where(lt(budgets.month, month))
      .all()
      .map((r) => r.month);
    const source = previousBudgetMonth(month, months);
    if (!source) return 0;
    const sourceBudget = tx.select({ id: budgets.id }).from(budgets).where(eq(budgets.month, source)).get();
    if (!sourceBudget) return 0;
    const items = tx.select().from(budgetItems).where(eq(budgetItems.budgetId, sourceBudget.id)).all();
    const targetId = budgetIdFor(tx, month, now);
    const have = new Set(tx.select({ c: budgetItems.categoryId }).from(budgetItems).where(eq(budgetItems.budgetId, targetId)).all().map((r) => r.c));
    const fresh = items.filter((i) => !have.has(i.categoryId));
    if (fresh.length > 0) {
      tx.insert(budgetItems).values(fresh.map((i) => ({ id: newId(), budgetId: targetId, categoryId: i.categoryId, kind: i.kind, plannedMinor: i.plannedMinor, isFixed: i.isFixed, updatedAt: now }))).run();
    }
    return fresh.length;
  });
}

