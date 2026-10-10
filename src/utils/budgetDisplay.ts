import type { ItemStatus } from './budget';
import { formatMoney } from './money';

/** Cómo se rotula y colorea el estado de una partida (lo comparten la lista y el detalle). */
export const STATUS_STYLE: Record<ItemStatus, { statusColor: 'income' | 'accent' | 'expense' | 'textMuted'; barColor: 'income' | 'accent' | 'expense' | 'surface2' }> = {
  paid: { statusColor: 'income', barColor: 'income' },
  partial: { statusColor: 'accent', barColor: 'accent' },
  pending: { statusColor: 'textMuted', barColor: 'surface2' },
  ok: { statusColor: 'textMuted', barColor: 'accent' },
  near: { statusColor: 'accent', barColor: 'accent' },
  over: { statusColor: 'expense', barColor: 'expense' },
};

export function statusLabel(kind: 'income' | 'expense', isFixed: boolean, status: ItemStatus, remainingMinor: number): string {
  if (kind === 'income') return status === 'paid' ? 'RECIBIDO' : status === 'partial' ? 'PARCIAL' : 'PENDIENTE';
  if (isFixed) return status === 'paid' ? 'PAGADO' : status === 'partial' ? 'PARCIAL' : 'PENDIENTE';
  if (status === 'over') return 'TE PASASTE';
  if (status === 'near') return 'CERCA DEL LÍMITE';
  return `QUEDAN ${formatMoney(remainingMinor, 'USD')}`;
}
