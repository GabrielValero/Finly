import { vesToUsd, type Currency } from './money';

export interface PortfolioAccount {
  currency: Currency;
  balanceMinor: number;
  includeInTotal: boolean;
}

export interface PortfolioTotal {
  usdMinor: number;
  /** Hay saldo en Bs que no se pudo valorar por no haber tasa. */
  missingRate: boolean;
}

/** Patrimonio en USD: los saldos en Bs se valoran con la tasa más reciente (no con snapshots). */
export function portfolioTotal(accounts: readonly PortfolioAccount[], rateScaled: number | null): PortfolioTotal {
  let usd = 0;
  let missingRate = false;
  for (const account of accounts) {
    if (!account.includeInTotal) continue;
    if (account.currency === 'USD') {
      usd += account.balanceMinor;
    } else if (rateScaled === null) {
      if (account.balanceMinor !== 0) missingRate = true;
    } else {
      usd += vesToUsd(account.balanceMinor, rateScaled);
    }
  }
  return { usdMinor: usd, missingRate };
}

export interface PortfolioSplit {
  /** Suma de las cuentas en USD que cuentan en el patrimonio. */
  usdMinor: number;
  /** Suma de las cuentas en Bs (en Bs). */
  vesMinor: number;
  /** Lo de Bs valorado en USD; null si no hay tasa y hay saldo en Bs. */
  vesInUsdMinor: number | null;
  totalUsdMinor: number;
  /** Cuántos de cada 100 dólares del patrimonio están en cuentas USD; null si no se puede repartir. */
  usdPer100: number | null;
  missingRate: boolean;
}

/** Reparto del patrimonio entre dólares y bolívares (para la frase y las fichas de Cuentas). */
export function portfolioSplit(accounts: readonly PortfolioAccount[], rateScaled: number | null): PortfolioSplit {
  let usdMinor = 0;
  let vesMinor = 0;
  for (const a of accounts) {
    if (!a.includeInTotal) continue;
    if (a.currency === 'USD') usdMinor += a.balanceMinor;
    else vesMinor += a.balanceMinor;
  }
  const missingRate = rateScaled === null && vesMinor !== 0;
  const vesInUsdMinor = rateScaled === null ? (vesMinor === 0 ? 0 : null) : vesToUsd(vesMinor, rateScaled);
  const totalUsdMinor = usdMinor + (vesInUsdMinor ?? 0);
  let usdPer100: number | null = null;
  if (vesInUsdMinor !== null) {
    const usdPart = Math.max(usdMinor, 0);
    const vesPart = Math.max(vesInUsdMinor, 0);
    const sum = usdPart + vesPart;
    if (sum > 0) usdPer100 = Math.round((usdPart / sum) * 100);
  }
  return { usdMinor, vesMinor, vesInUsdMinor, totalUsdMinor, usdPer100, missingRate };
}
