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
