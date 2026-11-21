import { resolveCategoryColor } from './categoryColor';
import { daysBetween, formatDayShort } from './dates';
import { formatMoney, formatRate, usdToVes, vesToUsd, type Currency } from './money';

export interface ChipCategory {
  id: string;
  name: string;
  kind: 'income' | 'expense' | 'transfer' | string;
  parentId: string | null;
  color: string | null;
}

export interface CategoryChip {
  id: string;
  label: string;
  color: string | null;
  selected: boolean;
}

/**
 * Chips de categoría de la captura: las categorías padre del tipo dado, ordenadas por uso
 * (las hijas suman a su padre; desempate por nombre). Si la elegida no entra en el top, se antepone.
 * `categories` ya debe venir sin archivadas.
 */
export function frequentCategoryChips(
  categories: readonly ChipCategory[],
  usage: ReadonlyMap<string, number>,
  kind: string,
  selectedId: string | null,
  limit: number,
): CategoryChip[] {
  const parents = categories.filter((c) => c.kind === kind && !c.parentId);
  const uses = new Map<string, number>(parents.map((p) => [p.id, usage.get(p.id) ?? 0]));
  for (const c of categories) {
    if (c.parentId && uses.has(c.parentId)) uses.set(c.parentId, (uses.get(c.parentId) ?? 0) + (usage.get(c.id) ?? 0));
  }
  const ranked = [...parents].sort((a, b) => (uses.get(b.id) ?? 0) - (uses.get(a.id) ?? 0) || a.name.localeCompare(b.name, 'es'));
  const top = ranked.slice(0, limit);

  const selected = categories.find((c) => c.id === selectedId && c.kind === kind) ?? null;
  const selectedParentId = selected ? (selected.parentId ?? selected.id) : null;
  const selectedParent = parents.find((p) => p.id === selectedParentId) ?? null;
  const list = selectedParent && !top.some((p) => p.id === selectedParent.id) ? [selectedParent, ...top] : top;

  return list.map((p) => {
    const isSelected = p.id === selectedParentId;
    const label = isSelected && selected?.parentId ? `${p.name} › ${selected.name}` : p.name;
    return { id: p.id, label, color: resolveCategoryColor(p.color, p.id), selected: isSelected };
  });
}

/** «Hoy», «Ayer», «12 nov» (con año si no es el actual). */
export function dateChipLabel(day: string, today: string): string {
  const diff = daysBetween(day, today);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  const short = formatDayShort(day);
  return day.slice(0, 4) === today.slice(0, 4) ? short.replace(/ \d{4}$/, '') : short;
}

export type DateChoice = 'today' | 'yesterday' | 'other';

export function dateChoice(day: string, today: string): DateChoice {
  const diff = daysBetween(day, today);
  return diff === 0 ? 'today' : diff === 1 ? 'yesterday' : 'other';
}

/** «Tasa 36,54». */
export function rateChipLabel(rateScaled: number): string {
  return `Tasa ${formatRate(rateScaled)}`;
}

/** «Etiquetas», «#viaje» o «#viaje +2». */
export function tagsChipLabel(names: readonly string[]): string {
  if (names.length === 0) return 'Etiquetas';
  const first = `#${names[0]}`;
  return names.length === 1 ? first : `${first} +${names.length - 1}`;
}

/** «Total ≈ $24,50 · Tasa 36,54»: el monto tecleado en la otra moneda, con la tasa usada. */
export function conversionSummary(input: { amountMinor: number; currency: Currency; rateScaled: number | null }): string | null {
  if (input.amountMinor <= 0 || !input.rateScaled || input.rateScaled <= 0) return null;
  try {
    const other: Currency = input.currency === 'USD' ? 'VES' : 'USD';
    const converted = input.currency === 'USD' ? usdToVes(input.amountMinor, input.rateScaled) : vesToUsd(input.amountMinor, input.rateScaled);
    return `Total ≈ ${formatMoney(converted, other)} · ${rateChipLabel(input.rateScaled)}`;
  } catch {
    return null;
  }
}

export function captureTitle(isEdit: boolean): string {
  return isEdit ? 'Editar movimiento' : 'Nuevo movimiento';
}

export function captureSaveLabel(kind: 'expense' | 'income', isEdit: boolean): string {
  if (isEdit) return 'Guardar cambios';
  return kind === 'expense' ? 'Guardar gasto' : 'Guardar ingreso';
}
