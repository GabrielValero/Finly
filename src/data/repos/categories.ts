import { count } from 'drizzle-orm';
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

/** Crea las categorías iniciales solo si la tabla está vacía (idempotente). */
export async function seedDefaultCategories(): Promise<void> {
  const [row] = await db.select({ n: count() }).from(categories);
  if ((row?.n ?? 0) > 0) return;
  const now = new Date();
  await db.insert(categories).values(
    DEFAULTS.map((c) => ({ ...c, id: newId(), color: null, parentId: null, excludeFromReports: false, updatedAt: now })),
  );
}
