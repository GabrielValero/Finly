import { percentChange, type Slice } from './reports';

/**
 * "Voz humana" (propuesta G): frases cortas con el dato clave en negrita.
 * Se devuelven como segmentos para que la UI las pinte sin parsear texto.
 */
export type SegmentTone = 'income' | 'expense';

export interface Segment {
  text: string;
  bold?: boolean;
  /** Color semántico del trozo (p. ej. "12% menos" en color de ingreso). */
  tone?: SegmentTone;
}

const t = (text: string): Segment => ({ text });
const b = (text: string): Segment => ({ text, bold: true });

/** Frase del patrimonio según cuántos de cada 100 dólares están en USD; null si no hay dato. */
export function portfolioSegments(usdPer100: number | null): Segment[] | null {
  if (usdPer100 === null) return null;
  const ves = 100 - usdPer100;
  if (usdPer100 >= 90) return [t(`Casi todo está en dólares: ${usdPer100} de cada 100.`)];
  if (usdPer100 <= 10) return [t(`Casi todo está en bolívares: ${ves} de cada 100.`)];
  return [t(`${usdPer100} de cada 100 están en dólares y ${ves} en bolívares.`)];
}

/** "En noviembre entraron $X y salieron $Y." (montos ya formateados). */
export function accountMonthSegments(monthName: string, inLabel: string, outLabel: string): Segment[] {
  return [t(`En ${monthName} entraron `), b(inLabel), t(' y salieron '), b(outLabel), t('.')];
}

/** "Llevas $X de $Y planificados." */
export function budgetPlanSegments(spentLabel: string, plannedLabel: string): Segment[] {
  return [t('Llevas '), b(spentLabel), t(` de ${plannedLabel} planificados.`)];
}

export interface ScopeRemainingInput {
  category: string;
  monthName: string;
  kind: 'income' | 'expense';
  isFixed: boolean;
  /** Valor absoluto de lo que queda (o de lo que se pasó), ya formateado. */
  remaining: string;
  /** Cuota diaria, ya formateada. */
  perDay: string;
  over: boolean;
  /** El mes ya terminó: la frase va en pasado. */
  past: boolean;
  daysLeft: number;
}

/** Frase de una partida: cuánto queda para terminar el mes (y por día en los gastos variables). */
export function scopeRemainingSegments(i: ScopeRemainingInput): Segment[] {
  if (i.kind === 'income') {
    return i.over ? [t('Recibiste '), b(i.remaining), t(` de más en ${i.category}.`)] : [t('Faltan '), b(i.remaining), t(` por recibir de ${i.category}.`)];
  }
  if (i.isFixed) {
    return i.over ? [t('Pagaste '), b(i.remaining), t(` de más en ${i.category}.`)] : [t('Faltan '), b(i.remaining), t(` para completar ${i.category}.`)];
  }
  if (i.past) {
    return i.over ? [t(`En ${i.monthName} te pasaste `), b(i.remaining), t(` en ${i.category}.`)] : [t(`En ${i.monthName} te sobraron `), b(i.remaining), t(` de ${i.category}.`)];
  }
  if (i.over) return [t('Te pasaste '), b(i.remaining), t(` en ${i.category}.`)];
  const head: Segment[] = [t('Te quedan '), b(i.remaining), t(` para ${i.category} hasta fin de mes.`)];
  return i.daysLeft > 1 ? [...head, t(` Unos ${i.perDay} por día.`)] : head;
}

export interface ReportHeadlineInput {
  monthName: string;
  prevMonthName: string;
  expense: string;
  expenseMinor: number;
  prevExpenseMinor: number;
}

/** "En noviembre gastaste $X, un 12% menos que en octubre." Sin mes anterior omite la comparación. */
export function reportHeadlineSegments(i: ReportHeadlineInput): Segment[] {
  const lead: Segment[] = [t(`En ${i.monthName} gastaste `), b(i.expense)];
  const change = percentChange(i.prevExpenseMinor, i.expenseMinor);
  if (change === null) return [...lead, t('.')];
  if (change === 0) return [...lead, t(`, lo mismo que en ${i.prevMonthName}.`)];
  const less = change < 0;
  return [...lead, t(', un '), { text: `${Math.abs(change)}% ${less ? 'menos' : 'más'}`, bold: true, tone: less ? 'income' : 'expense' }, t(` que en ${i.prevMonthName}.`)];
}

export interface CategoryInsight {
  title: string;
  detail: string;
}

/** La categoría que más pesa y cuántos de cada 100 dólares se fueron ahí; null si no hay una categoría real. */
export function topCategoryInsight(slices: readonly Slice[]): CategoryInsight | null {
  const top = slices[0];
  if (!top || top.key === 'none' || top.share <= 0) return null;
  return {
    title: `${top.label} sigue siendo lo que más pesa.`,
    detail: `${Math.round(top.share * 100)} de cada 100 dólares se fueron ahí.`,
  };
}
