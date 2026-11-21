import { IVA_LABEL, type LimitState } from './shopping';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export interface ListCardSubtitleInput {
  kind: 'market' | 'wish';
  completed: boolean;
  archived: boolean;
  /** Productos sin comprar. */
  pending: number;
  /** Pendientes ya metidos al carrito. */
  checked: number;
  /** Todos los productos de la lista. */
  total: number;
}

/** Segunda línea de la tarjeta de una lista: "3 pendientes · 1 en el carrito". */
export function listCardSubtitle(i: ListCardSubtitleInput): string {
  if (i.completed) return `Completada · ${plural(i.total - i.pending, 'producto', 'productos')}`;
  if (i.archived) return `Archivada · ${plural(i.total, 'producto', 'productos')}`;
  if (i.pending === 0) return 'Sin productos';
  const pending = plural(i.pending, 'pendiente', 'pendientes');
  return i.kind === 'market' ? `${pending} · ${i.checked} en el carrito` : pending;
}

/** "Te quedan $X de $Y" / "Te pasas $X del límite de $Y"; null si la lista no tiene límite. */
export function limitCaption(state: LimitState, remaining: string, limit: string): string | null {
  if (state === 'none') return null;
  return state === 'over' ? `Te pasas ${remaining} del límite de ${limit}` : `Te quedan ${remaining} de ${limit}`;
}

interface CartRow {
  checked: boolean;
  purchased: boolean;
  /** Valor de la línea en USD (minor); null si no se puede valorar. */
  usdMinor: number | null;
}

export interface CartSection<T> {
  rows: T[];
  subtotalMinor: number;
}

/** Reparte los productos de una lista de mercado: en el carrito, pendientes y ya comprados. */
export function splitCartSections<T extends CartRow>(rows: readonly T[]): { cart: CartSection<T>; pending: CartSection<T>; purchased: T[] } {
  const cart: CartSection<T> = { rows: [], subtotalMinor: 0 };
  const pending: CartSection<T> = { rows: [], subtotalMinor: 0 };
  const purchased: T[] = [];
  for (const r of rows) {
    if (r.purchased) {
      purchased.push(r);
      continue;
    }
    const section = r.checked ? cart : pending;
    section.rows.push(r);
    section.subtotalMinor += r.usdMinor ?? 0;
  }
  return { cart, pending, purchased };
}

/** Aviso de la hoja de compra: lo que no va al carrito se queda en la lista. */
export function notInCartLine(count: number): string | null {
  if (count <= 0) return null;
  return count === 1
    ? 'El producto que no está en el carrito se queda pendiente en la lista.'
    : `Los ${count} productos que no están en el carrito se quedan pendientes en la lista.`;
}

interface WishLike {
  name: string;
  priority: 'low' | 'medium' | 'high' | null;
  purchasedAt: Date | null;
  sortOrder: number;
}

/** El deseo pendiente más importante; null si ninguno tiene prioridad. */
export function topWishName(items: readonly WishLike[]): string | null {
  const ranked = items
    .filter((i) => i.purchasedAt === null && i.priority !== null)
    .sort((a, b) => PRIORITY_RANK[a.priority!] - PRIORITY_RANK[b.priority!] || a.sortOrder - b.sortOrder);
  return ranked[0]?.name ?? null;
}

/** Nota bajo el total de la línea de un producto: "Con IVA 16 % · ≈ $ 2,50"; null si no hay nada que aclarar. */
export function lineTotalNote({ taxable, usdLabel }: { taxable: boolean; usdLabel: string | null }): string | null {
  const parts = [taxable ? `Con IVA ${IVA_LABEL}` : null, usdLabel ? `≈ ${usdLabel}` : null].filter((x): x is string => x !== null);
  return parts.length ? parts.join(' · ') : null;
}
