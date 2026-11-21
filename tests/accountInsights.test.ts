import { describe, expect, it } from 'vitest';
import { accountKindLabel } from '../src/utils/accounts';
import { portfolioSplit, type PortfolioAccount } from '../src/utils/portfolio';

const acc = (currency: 'USD' | 'VES', balanceMinor: number, includeInTotal = true): PortfolioAccount => ({ currency, balanceMinor, includeInTotal });
// 1 USD = 50 Bs
const RATE = 50_000_000;

describe('portfolioSplit', () => {
  it('separa dólares y bolívares y calcula cuántos de cada 100 están en USD', () => {
    const s = portfolioSplit([acc('USD', 97_00), acc('VES', 150_00)], RATE); // 150 Bs = $3,00
    expect(s.usdMinor).toBe(97_00);
    expect(s.vesMinor).toBe(150_00);
    expect(s.vesInUsdMinor).toBe(3_00);
    expect(s.totalUsdMinor).toBe(100_00);
    expect(s.usdPer100).toBe(97);
    expect(s.missingRate).toBe(false);
  });

  it('ignora las cuentas fuera del balance total', () => {
    const s = portfolioSplit([acc('USD', 50_00), acc('USD', 900_00, false)], RATE);
    expect(s.usdMinor).toBe(50_00);
    expect(s.usdPer100).toBe(100);
  });

  it('sin tasa y con saldo en Bs no puede repartir', () => {
    const s = portfolioSplit([acc('USD', 50_00), acc('VES', 100_00)], null);
    expect(s.missingRate).toBe(true);
    expect(s.vesInUsdMinor).toBeNull();
    expect(s.usdPer100).toBeNull();
    expect(s.vesMinor).toBe(100_00);
  });

  it('con total 0 no hay reparto', () => {
    expect(portfolioSplit([], RATE).usdPer100).toBeNull();
    expect(portfolioSplit([acc('USD', 0)], RATE).usdPer100).toBeNull();
  });

  it('un saldo negativo no rompe el reparto', () => {
    const s = portfolioSplit([acc('USD', 100_00), acc('VES', -50_00)], RATE);
    expect(s.usdPer100).toBe(100);
  });
});

describe('accountKindLabel', () => {
  it('traduce el ícono a un tipo legible', () => {
    expect(accountKindLabel('cash')).toBe('Efectivo');
    expect(accountKindLabel('bank')).toBe('Banco');
    expect(accountKindLabel('wallet')).toBe('Billetera');
  });
  it('un ícono desconocido no tiene tipo', () => {
    expect(accountKindLabel('zzz')).toBeNull();
  });
});
