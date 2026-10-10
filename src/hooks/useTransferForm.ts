import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { insertTransfer } from '../data/repos/transactions';
import { usePreferences } from '../store/preferences';
import { formatMoney, formatRate, MoneyError } from '../utils/money';
import { newId } from '../utils/ids';
import { buildTransfer } from '../utils/transactions';
import { convertAtRate, transferDifferenceVes } from '../utils/transfers';
import { useAmountBuffer } from './useAmountBuffer';
import { useAccountsWithBalance, useLatestRate } from './useData';
import { useMovementDetails } from './useMovementDetails';

type Side = 'from' | 'to';

export function useTransferForm() {
  const router = useRouter();
  const accounts = useAccountsWithBalance();
  const rate = useLatestRate();
  const lastAccountId = usePreferences((s) => s.lastAccountId);
  const outBuf = useAmountBuffer();
  const inBuf = useAmountBuffer();
  const details = useMovementDetails();

  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [active, setActive] = useState<Side>('from');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const from = useMemo(() => accounts.find((a) => a.id === (fromId ?? lastAccountId)) ?? accounts[0] ?? null, [accounts, fromId, lastAccountId]);
  const to = useMemo(() => {
    const chosen = accounts.find((a) => a.id === toId && a.id !== from?.id);
    return chosen ?? accounts.find((a) => a.id !== from?.id) ?? null;
  }, [accounts, toId, from]);

  const sameCurrency = !!from && !!to && from.currency === to.currency;

  // Misma moneda: el destino siempre refleja el origen (solo se teclea una vez).
  const outMinor = outBuf.minor;
  const inMinor = sameCurrency ? outBuf.minor : inBuf.minor;
  const effectiveActive: Side = sameCurrency ? 'from' : active;

  const press = useCallback(
    (key: Parameters<typeof outBuf.press>[0]) => (effectiveActive === 'from' ? outBuf.press(key) : inBuf.press(key)),
    [effectiveActive, outBuf, inBuf],
  );

  const implied = useMemo(() => {
    if (!from || !to || sameCurrency || outMinor <= 0 || inMinor <= 0) return null;
    try {
      return buildTransfer({ from, to, outMinor, inMinor, transferId: 'preview' })[0].rateScaled;
    } catch {
      return null;
    }
  }, [from, to, sameCurrency, outMinor, inMinor]);

  const rateCard = useMemo(() => {
    if (!from || !to || sameCurrency) return null;
    if (implied === null) return { value: '—', note: rate ? `BCV hoy ${formatRate(rate.rateScaled)} · teclea ambos montos` : 'Teclea ambos montos' };
    const diff = rate
      ? transferDifferenceVes({ fromCurrency: from.currency, toCurrency: to.currency, outMinor, inMinor, marketRateScaled: rate.rateScaled })
      : null;
    const diffText = diff === null ? '' : ` · diferencia ${diff < 0 ? '−' : '+'}${formatMoney(Math.abs(diff), 'VES')}`;
    return { value: formatRate(implied), note: rate ? `${rate.source === 'bcv' ? 'BCV' : 'Manual'} hoy ${formatRate(rate.rateScaled)}${diffText}` : 'Sin tasa de referencia' };
  }, [from, to, sameCurrency, implied, rate, outMinor, inMinor]);

  const insufficient = !!from && outMinor > 0 && from.balanceMinor < outMinor;
  const canSave = !saving && !!from && !!to && outMinor > 0 && inMinor > 0;

  const swap = useCallback(() => {
    if (!from || !to) return;
    setFromId(to.id);
    setToId(from.id);
    // Los montos viajan con su cuenta.
    const a = outBuf.minor;
    const b = inBuf.minor;
    outBuf.set(sameCurrency ? a : b);
    inBuf.set(a);
  }, [from, to, outBuf, inBuf, sameCurrency]);

  const save = useCallback(async () => {
    if (!from || !to) return;
    setError(null);
    setSaving(true);
    try {
      const legs = buildTransfer({ from, to, outMinor, inMinor, transferId: newId() });
      const now = new Date();
      const base = { categoryId: null, concept: details.concept.trim(), note: null, listedAmountMinor: null, listedCurrency: null, deletedAt: null, updatedAt: now, occurredAt: details.occurredAt };
      await insertTransfer([
        { ...base, id: newId(), ...legs[0] },
        { ...base, id: newId(), ...legs[1] },
      ]);
      router.back();
    } catch (e) {
      setError(e instanceof MoneyError || e instanceof Error ? e.message : 'No se pudo transferir');
      setSaving(false);
    }
  }, [from, to, outMinor, inMinor, details.concept, details.occurredAt, router]);

  const label = (a: typeof from) => (a ? `${a.name} · ${a.currency}` : 'Elige una cuenta');
  const money = (a: typeof from, display: string) => (a?.currency === 'VES' ? `Bs ${display}` : `$${display}`);

  return {
    hasEnoughAccounts: accounts.length >= 2,
    fromLabel: label(from),
    toLabel: label(to),
    fromId: from?.id ?? null,
    toId: to?.id ?? null,
    fromAmount: money(from, outBuf.display),
    toAmount: money(to, sameCurrency ? outBuf.display : inBuf.display),
    active: effectiveActive,
    setActive,
    sameCurrency,
    fromOptions: accounts.filter((a) => a.id !== to?.id).map((a) => ({ value: a.id, label: a.name, hint: `${a.currency} · ${formatMoney(a.balanceMinor, a.currency)}` })),
    toOptions: accounts.filter((a) => a.id !== from?.id).map((a) => ({ value: a.id, label: a.name, hint: `${a.currency} · ${formatMoney(a.balanceMinor, a.currency)}` })),
    selectFrom: setFromId,
    selectTo: setToId,
    swap,
    pressKey: press,
    rateCard,
    warning: insufficient ? 'El origen quedará en negativo' : null,
    detailsLabel: details.concept.trim() ? details.concept.trim() : '+ Concepto, fecha',
    details,
    canSave,
    error,
    save,
    close: () => router.back(),
    openNewAccount: () => router.push('/account/new'),
    convertHint: rate && from && to && !sameCurrency && outMinor > 0 && inBuf.minor === 0
      ? `≈ ${formatMoney(convertAtRate(outMinor, from.currency, to.currency, rate.rateScaled), to.currency)} a tasa de referencia`
      : null,
  };
}
