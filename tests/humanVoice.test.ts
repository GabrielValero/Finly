import { describe, expect, it } from 'vitest';
import {
  accountMonthSegments,
  budgetPlanSegments,
  portfolioSegments,
  reportHeadlineSegments,
  scopeRemainingSegments,
  topCategoryInsight,
  type Segment,
} from '../src/utils/humanVoice';
import type { Slice } from '../src/utils/reports';

const plain = (s: readonly Segment[]) => s.map((x) => x.text).join('');
const bold = (s: readonly Segment[]) => s.filter((x) => x.bold).map((x) => x.text);

describe('portfolioSegments', () => {
  it('casi todo en dólares', () => {
    expect(plain(portfolioSegments(97)!)).toBe('Casi todo está en dólares: 97 de cada 100.');
  });
  it('casi todo en bolívares', () => {
    expect(plain(portfolioSegments(4)!)).toBe('Casi todo está en bolívares: 96 de cada 100.');
  });
  it('reparto parejo', () => {
    expect(plain(portfolioSegments(60)!)).toBe('60 de cada 100 están en dólares y 40 en bolívares.');
  });
  it('sin dato no hay frase', () => {
    expect(portfolioSegments(null)).toBeNull();
  });
});

describe('accountMonthSegments', () => {
  it('entraron y salieron con los montos en negrita', () => {
    const s = accountMonthSegments('noviembre', '$ 120,00', '$ 45,50');
    expect(plain(s)).toBe('En noviembre entraron $ 120,00 y salieron $ 45,50.');
    expect(bold(s)).toEqual(['$ 120,00', '$ 45,50']);
  });
});

describe('budgetPlanSegments', () => {
  it('llevas X de Y planificados', () => {
    const s = budgetPlanSegments('$ 300,00', '$ 800,00');
    expect(plain(s)).toBe('Llevas $ 300,00 de $ 800,00 planificados.');
    expect(bold(s)).toEqual(['$ 300,00']);
  });
});

describe('scopeRemainingSegments', () => {
  const base = { category: 'Comida', monthName: 'noviembre', isFixed: false, kind: 'expense' as const };
  it('variable en curso: cuánto queda y cuánto por día', () => {
    const s = scopeRemainingSegments({ ...base, remaining: '$ 90,00', perDay: '$ 6,00', over: false, past: false, daysLeft: 15 });
    expect(plain(s)).toBe('Te quedan $ 90,00 para Comida hasta fin de mes. Unos $ 6,00 por día.');
    expect(bold(s)).toEqual(['$ 90,00']);
  });
  it('variable pasado de límite', () => {
    const s = scopeRemainingSegments({ ...base, remaining: '$ 10,00', perDay: '$ 0,00', over: true, past: false, daysLeft: 5 });
    expect(plain(s)).toBe('Te pasaste $ 10,00 en Comida.');
  });
  it('mes pasado: va en pasado', () => {
    expect(plain(scopeRemainingSegments({ ...base, remaining: '$ 20,00', perDay: '$ 0,00', over: false, past: true, daysLeft: 0 }))).toBe('En noviembre te sobraron $ 20,00 de Comida.');
    expect(plain(scopeRemainingSegments({ ...base, remaining: '$ 20,00', perDay: '$ 0,00', over: true, past: true, daysLeft: 0 }))).toBe('En noviembre te pasaste $ 20,00 en Comida.');
  });
  it('último día: sin cuota por día', () => {
    const s = scopeRemainingSegments({ ...base, remaining: '$ 9,00', perDay: '$ 9,00', over: false, past: false, daysLeft: 1 });
    expect(plain(s)).toBe('Te quedan $ 9,00 para Comida hasta fin de mes.');
  });
  it('gasto fijo: cuánto falta por pagar', () => {
    expect(plain(scopeRemainingSegments({ ...base, isFixed: true, remaining: '$ 30,00', perDay: '$ 0,00', over: false, past: false, daysLeft: 9 }))).toBe('Faltan $ 30,00 para completar Comida.');
  });
  it('ingreso: cuánto falta por recibir', () => {
    expect(plain(scopeRemainingSegments({ ...base, kind: 'income', remaining: '$ 30,00', perDay: '$ 0,00', over: false, past: false, daysLeft: 9 }))).toBe('Faltan $ 30,00 por recibir de Comida.');
  });
});

describe('reportHeadlineSegments', () => {
  it('menos que el mes anterior: tono ingreso', () => {
    const r = reportHeadlineSegments({ monthName: 'noviembre', prevMonthName: 'octubre', expense: '$ 880,00', expenseMinor: 88000, prevExpenseMinor: 100000 });
    expect(plain(r)).toBe('En noviembre gastaste $ 880,00, un 12% menos que en octubre.');
    expect(r.find((s) => s.tone)).toEqual({ text: '12% menos', bold: true, tone: 'income' });
  });
  it('más que el mes anterior: tono gasto', () => {
    const r = reportHeadlineSegments({ monthName: 'noviembre', prevMonthName: 'octubre', expense: '$ 150,00', expenseMinor: 15000, prevExpenseMinor: 10000 });
    expect(plain(r)).toBe('En noviembre gastaste $ 150,00, un 50% más que en octubre.');
    expect(r.find((s) => s.tone)?.tone).toBe('expense');
  });
  it('igual: lo dice sin porcentaje', () => {
    const r = reportHeadlineSegments({ monthName: 'noviembre', prevMonthName: 'octubre', expense: '$ 100,00', expenseMinor: 10000, prevExpenseMinor: 10000 });
    expect(plain(r)).toBe('En noviembre gastaste $ 100,00, lo mismo que en octubre.');
  });
  it('sin mes anterior omite la comparación', () => {
    const r = reportHeadlineSegments({ monthName: 'noviembre', prevMonthName: 'octubre', expense: '$ 100,00', expenseMinor: 10000, prevExpenseMinor: 0 });
    expect(plain(r)).toBe('En noviembre gastaste $ 100,00.');
    expect(r.some((s) => s.tone)).toBe(false);
  });
});

describe('topCategoryInsight', () => {
  const slice = (key: string, label: string, usdMinor: number, share: number): Slice => ({ key, label, usdMinor, share });
  it('la categoría que más pesa y cuántos de cada 100 dólares', () => {
    expect(topCategoryInsight([slice('c', 'Comida', 4200, 0.42), slice('h', 'Hogar', 3000, 0.3)])).toEqual({ title: 'Comida sigue siendo lo que más pesa.', detail: '42 de cada 100 dólares se fueron ahí.' });
  });
  it('sin gastos no hay insight', () => {
    expect(topCategoryInsight([])).toBeNull();
  });
  it('si lo más grande es "sin categoría" no hay insight', () => {
    expect(topCategoryInsight([slice('none', 'Sin categoría', 100, 1)])).toBeNull();
  });
});
