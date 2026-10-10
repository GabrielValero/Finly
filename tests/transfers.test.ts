import { describe, expect, it } from 'vitest';
import { convertAtRate, latestTransfer, transferDifferenceVes, type TransferLegRow } from '../src/utils/transfers';

const R = 871_370_000; // 871,37

describe('transferDifferenceVes', () => {
  it('USD -> Bs: recibido menos lo que daba el mercado', () => {
    expect(transferDifferenceVes({ fromCurrency: 'USD', toCurrency: 'VES', outMinor: 5000, inMinor: 4_350_000, marketRateScaled: R })).toBe(-6850);
  });
  it('Bs -> USD: positivo cuando te rindió más', () => {
    // 43.500 Bs a 871,37 valen $49,92; recibir $50,00 es ventaja.
    const d = transferDifferenceVes({ fromCurrency: 'VES', toCurrency: 'USD', outMinor: 4_350_000, inMinor: 5000, marketRateScaled: R });
    expect(d).toBe(6850);
  });
  it('misma moneda o sin tasa: no aplica', () => {
    expect(transferDifferenceVes({ fromCurrency: 'USD', toCurrency: 'USD', outMinor: 100, inMinor: 100, marketRateScaled: R })).toBeNull();
    expect(transferDifferenceVes({ fromCurrency: 'USD', toCurrency: 'VES', outMinor: 100, inMinor: 100, marketRateScaled: 0 })).toBeNull();
  });
});

describe('convertAtRate', () => {
  it('convierte en ambos sentidos y respeta misma moneda', () => {
    expect(convertAtRate(5000, 'USD', 'VES', R)).toBe(4_356_850);
    expect(convertAtRate(4_356_850, 'VES', 'USD', R)).toBe(5000);
    expect(convertAtRate(5000, 'USD', 'USD', R)).toBe(5000);
  });
});

describe('latestTransfer', () => {
  const leg = (o: Partial<TransferLegRow>): TransferLegRow => ({ id: 'x', transferId: 't1', occurredAt: '2026-10-09T10:00:00', amountMinor: -5000, accountCurrency: 'USD', accountName: 'Binance', rateScaled: 870_000_000, ...o });
  it('une las patas de la más reciente', () => {
    const rows = [
      leg({ id: 'a', transferId: 'old', occurredAt: '2026-10-01T10:00:00' }),
      leg({ id: 'b', transferId: 'old', occurredAt: '2026-10-01T10:00:00', amountMinor: 100, accountName: 'Otra' }),
      leg({ id: 'c' }),
      leg({ id: 'd', amountMinor: 4_350_000, accountCurrency: 'VES', accountName: 'Banesco' }),
    ];
    expect(latestTransfer(rows)).toMatchObject({ transferId: 't1', fromName: 'Binance', toName: 'Banesco', outMinor: 5000, inMinor: 4_350_000, outCurrency: 'USD', inCurrency: 'VES', rateScaled: 870_000_000 });
  });
  it('sin datos o incompleta: null', () => {
    expect(latestTransfer([])).toBeNull();
    expect(latestTransfer([leg({})])).toBeNull();
  });
});

import { collapseTransfers } from '../src/utils/transfers';

describe('collapseTransfers', () => {
  const t = (id: string, transferId: string | null, amountMinor: number, accountName = 'A') => ({ id, transferId, amountMinor, accountCurrency: 'USD' as const, accountName });
  it('une las dos patas en un solo movimiento, conservando el orden', () => {
    const items = collapseTransfers([t('g', null, -100), t('in', 'x', 4000, 'Banesco'), t('out', 'x', -50, 'Binance'), t('h', null, -5)]);
    expect(items.map((i) => (i.type === 'transfer' ? `T:${i.id}` : i.row.id))).toEqual(['g', 'T:out', 'h']);
  });
  it('una pata huérfana queda como fila normal', () => {
    expect(collapseTransfers([t('solo', 'y', -50)])).toEqual([{ type: 'tx', row: t('solo', 'y', -50) }]);
  });
});
