import { count, eq } from 'drizzle-orm';
import { db } from '../db';
import { categories, type Category } from '../schema';
import { newId } from '../../utils/ids';

type Seed = Pick<Category, 'name' | 'icon' | 'kind'>;

const DEFAULTS: Seed[] = [
  { name: 'Mercado', icon: 'cart', kind: 'expense' },
  { name: 'Comida', icon: 'food', kind: 'expense' },
  { name: 'Pasaje', icon: 'bus', kind: 'expense' },
  { name: 'Salud', icon: 'heart', kind: 'expense' },
  { name: 'Hogar', icon: 'home', kind: 'expense' },
  { name: 'Teléfono', icon: 'phone', kind: 'expense' },
  { name: 'Ocio', icon: 'coffee', kind: 'expense' },
  { name: 'Freelance', icon: 'briefcase', kind: 'income' },
  { name: 'Otros ingresos', icon: 'cash', kind: 'income' },
];

export function defaultCategoryRows(now: Date) {
  return DEFAULTS.map((c) => ({ ...c, id: newId(), color: null, parentId: null, excludeFromReports: false, updatedAt: now }));
}

/** Crea las categorías iniciales solo si la tabla está vacía (idempotente). */
export async function seedDefaultCategories(): Promise<void> {
  const [row] = await db.select({ n: count() }).from(categories);
  if ((row?.n ?? 0) > 0) return;
  const now = new Date();
  await db.insert(categories).values(defaultCategoryRows(now));
}

export interface CategoryFields {
  name: string;
  icon: string;
  kind: 'income' | 'expense';
  parentId: string | null;
  excludeFromReports: boolean;
}

export async function insertCategory(fields: CategoryFields): Promise<string> {
  const id = newId();
  await db.insert(categories).values({ ...fields, id, color: null, archivedAt: null, updatedAt: new Date() });
  return id;
}

export async function updateCategory(id: string, fields: CategoryFields): Promise<void> {
  await db.update(categories).set({ ...fields, updatedAt: new Date() }).where(eq(categories.id, id));
}

/** Archiva la categoría y sus subcategorías; los movimientos viejos conservan la referencia. */
export async function archiveCategory(id: string, now: Date): Promise<void> {
  db.transaction((tx) => {
    tx.update(categories).set({ archivedAt: now, updatedAt: now }).where(eq(categories.parentId, id)).run();
    tx.update(categories).set({ archivedAt: now, updatedAt: now }).where(eq(categories.id, id)).run();
  });
}
