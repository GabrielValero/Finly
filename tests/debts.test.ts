import { describe, expect, it } from 'vitest';
import { debtStatus, debtUsd, devaluation, movementConcept, movementFor, remainingMinor, summarizeDebts, validatePayment } from '../src/utils/debts';

describe('remainingMinor', () => {
  it('resta pagos y nunca baja de cero', () => {
    expect(remainingMinor(10_000, [{ amountMinor: 2500 }, { amountMinor: 1000 }])).toBe(6500);
    expect(remainingMinor(1000, [{ amountMinor: 1500 }])).toBe(0);
  });
});

describe('debtStatus', () => {
  it('saldada, vencida, por vencer y abierta', () => {
    expect(debtStatus(0, '2026-01-01', '2026-10-12')).toBe('settled');
    expect(debtStatus(100, '2026-10-01', '2026-10-12')).toBe('overdue');
    expect(debtStatus(100, '2026-10-19', '2026-10-12')).toBe('dueSoon');
    expect(debtStatus(100, '2026-10-20', '2026-10-12')).toBe('open');
    expect(debtStatus(100, null, '2026-10-12')).toBe('open');
  });
});

describe('validatePayment', () => {
  it('rechaza cero, negativos y excesos', () => {
    expect(validatePayment(0, 500)).not.toBeNull();
    expect(validatePayment(501, 500)).not.toBeNull();
    expect(validatePayment(500, 500)).toBeNull();
  });
});

describe('valoración en USD', () => {
  it('USD directo; Bs con tasa; Bs sin tasa es null', () => {
    expect(debtUsd(500, 'USD', null)).toBe(500);
    expect(debtUsd(87_500, 'VES', 875_000_000)).toBe(100);
    expect(debtUsd(87_500, 'VES', null)).toBeNull();
  });
  it('suma por dirección y cuenta las no valoradas', () => {
    const d = (o: object) => ({ id: 'x', direction: 'owed_to_me' as const, currency: 'USD' as const, principalMinor: 1, dueOn: null, openRateScaled: null, remainingMinor: 0, ...o });
    const t = summarizeDebts(
      [d({ remainingMinor: 1000 }), d({ direction: 'i_owe', remainingMinor: 400 }), d({ currency: 'VES', remainingMinor: 87_500 }), d({ remainingMinor: 0 })],
      null,
    );
    expect(t).toEqual({ owedToMeUsd: 1000, iOweUsd: 400, unvalued: 1 });
  });
});

describe('devaluation', () => {
  it('Bs 87.500 valían $125 a 700 y hoy $100 a 875', () => {
    expect(devaluation(87_500, 700_000_000, 875_000_000)).toEqual({ atOpenUsd: 125, nowUsd: 100, lossUsd: 25 });
  });
  it('sin tasa de apertura o saldada no aplica', () => {
    expect(devaluation(87_500, null, 875_000_000)).toBeNull();
    expect(devaluation(0, 700_000_000, 875_000_000)).toBeNull();
  });
});

describe('movimientos', () => {
  it('dirección y fase eligen el movimiento', () => {
    expect(movementFor('owed_to_me', 'open')).toBe('lend');
    expect(movementFor('owed_to_me', 'payment')).toBe('collect');
    expect(movementFor('i_owe', 'open')).toBe('borrow');
    expect(movementFor('i_owe', 'payment')).toBe('repay');
    expect(movementConcept('lend', ' Liseth ')).toBe('Préstamo a Liseth');
  });
});
