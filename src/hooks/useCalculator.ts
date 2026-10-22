import { useMemo, useState } from 'react';
import { convertAmount, latestRatePerSource } from '../utils/calculator';
import { formatMoney, formatRate, type Currency } from '../utils/money';
import { usePreferences } from '../store/preferences';
import { useAmountBuffer } from './useAmountBuffer';
import { useRateRows } from './useShopping';

const SOURCE_LABEL = { bcv: 'BCV', manual: 'Manual' } as const;

/** Calculadora USD ⇄ Bs: no guarda nada, solo convierte con la última tasa de la fuente elegida. */
export function useCalculator() {
  const rows = useRateRows();
  const preferred = usePreferences((s) => s.defaultRateSource);
  const amount = useAmountBuffer();
  const [from, setFrom] = useState<Currency>('USD');
  const [picked, setPicked] = useState<'bcv' | 'manual' | null>(null);

  return useMemo(() => {
    const options = latestRatePerSource(rows);
    const rate = options.find((o) => o.source === (picked ?? preferred)) ?? options[0] ?? null;
    const to: Currency = from === 'USD' ? 'VES' : 'USD';
    const result = rate && amount.minor > 0 ? convertAmount(amount.minor, from, rate.rateScaled) : null;
    return {
      from,
      to,
      amount,
      inputPrefix: from === 'USD' ? '$' : 'Bs',
      resultLabel: result === null ? (rate ? formatMoney(0, to) : '—') : formatMoney(result, to),
      rate,
      rateLabel: rate ? `${SOURCE_LABEL[rate.source]} · ${formatRate(rate.rateScaled)} Bs por USD` : null,
      sourceOptions: options.length > 1 ? options.map((o) => ({ value: o.source, label: `${SOURCE_LABEL[o.source]} ${formatRate(o.rateScaled)}` })) : [],
      source: rate?.source ?? 'bcv',
      setSource: setPicked,
      swap: () => setFrom((c) => (c === 'USD' ? 'VES' : 'USD')),
      clear: amount.reset,
    };
  }, [rows, preferred, picked, from, amount]);
}
