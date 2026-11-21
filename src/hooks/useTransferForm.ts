import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { insertTransfer } from '../data/repos/transactions';
import { usePreferences } from '../store/preferences';
import { rateChipLabel } from '../utils/captureChips';
import { formatMinor, formatMoney, formatRate, MoneyError } from '../utils/money';
import { newId } from '../utils/ids';
import { buildTransfer } from '../utils/transactions';
import { convertAtRate, transferDifferenceVes } from '../utils/transfers';
import { useAmountBuffer } from './useAmountBuffer';
import { useDiscardGuard } from './useDiscardGuard';
import { categoryPath } from '../utils/categories';
import { useCreatedCategory } from './useCreatedCategory';
import { useAccountsWithBalance, useCategoryRows, useLatestRate } from './useData';
import { useMovementDetails } from './useMovementDetails';

type Side = 'from' | 'to';

export function useTransferForm() {
  const router = useRouter();
  const accounts = useAccountsWithBalance();
  const rate = useLatestRate();
  const lastAccountId = usePreferences((s) => s.lastAccountId);
  // Calculadora (+ − × ÷) en ambos montos: `minor` es el resultado de la expresión.
  const outBuf = useAmountBuffer(2, false, true);
  const inBuf = useAmountBuffer(2, false, true);
  const details = useMovementDetails();

  const categories = useCategoryRows();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [active, setActive] = useState<Side>('from');
  const [error, setError] = useState<string | null>(null);
  const initialDay = useRef(details.day);
  const allowExit = useDiscardGuard(outBuf.buffer !== '' || inBuf.buffer !== '' || details.concept.trim() !== '' || categoryId !== null || details.day !== initialDay.current, {
    title: '¿Descartar esta transferencia?',
    message: 'Si sales ahora perderás la transferencia que estás registrando.',
  });
  const [saving, setSaving] = useState(false);

  const from = useMemo(() => accounts.find((a) => a.id === (fromId ?? lastAccountId)) ?? accounts[0] ?? null, [accounts, fromId, lastAccountId]);
  const to = useMemo(() => {
    const chosen = accounts.find((a) => a.id === toId && a.id !== from?.id);
    return chosen ?? accounts.find((a) => a.id !== from?.id) ?? null;
  }, [accounts, toId, from]);

  // Solo categorías de gasto: la transferencia cuenta en el presupuesto como un gasto, por su pata de salida.
  const expenseCategories = useMemo(() => categories.filter((c) => c.kind === 'expense'), [categories]);
  const category = expenseCategories.find((c) => c.id === categoryId) ?? null;
  const categoryLabel = category ? (categoryPath(category.name, expenseCategories.find((c) => c.id === category.parentId)?.name ?? null) ?? category.name) : null;
  useCreatedCategory(categories, (created) => {
    if (created.kind === 'expense') setCategoryId(created.id);
  });

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

  const activeBuf = effectiveActive === 'from' ? outBuf : inBuf;
  const activeAccount = effectiveActive === 'from' ? from : to;
  /** Texto de un monto: el resultado si hay una operación en curso; si no, lo tecleado. */
  const shown = (buf: typeof outBuf) => (buf.operation ? (buf.result === null ? '0' : formatMinor(buf.result)) : buf.display);

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
      const base = { categoryId: category?.id ?? null, concept: details.concept.trim(), note: null, listedAmountMinor: null, listedCurrency: null, deletedAt: null, updatedAt: now, occurredAt: details.occurredAt };
      await insertTransfer([
        { ...base, id: newId(), ...legs[0] },
        { ...base, id: newId(), ...legs[1] },
      ]);
      allowExit();
      router.back();
    } catch (e) {
      setError(e instanceof MoneyError || e instanceof Error ? e.message : 'No se pudo transferir');
      setSaving(false);
    }
  }, [from, to, outMinor, inMinor, details.concept, details.occurredAt, category, router, allowExit]);

  // Saldo actual y cómo quedará con el monto tecleado (para ver de un vistazo si alcanza).
  const balanceInfo = (a: typeof from, deltaMinor: number) => {
    if (!a) return null;
    const after = a.balanceMinor + deltaMinor;
    return {
      current: `Saldo ${formatMoney(a.balanceMinor, a.currency)}`,
      after: deltaMinor === 0 ? null : `Quedará ${formatMoney(after, a.currency)}`,
      negative: after < 0 && deltaMinor !== 0,
    };
  };

  const label = (a: typeof from) => (a ? `${a.name} · ${a.currency}` : 'Elige una cuenta');
  const money = (a: typeof from, display: string) => (a?.currency === 'VES' ? `Bs ${display}` : `$${display}`);

  return {
    hasEnoughAccounts: accounts.length >= 2,
    fromLabel: label(from),
    toLabel: label(to),
    fromId: from?.id ?? null,
    toId: to?.id ?? null,
    fromBalance: balanceInfo(from, -outMinor),
    toBalance: balanceInfo(to, inMinor),
    fromAmount: money(from, shown(outBuf)),
    toAmount: money(to, shown(sameCurrency ? outBuf : inBuf)),
    /** «500 + 395,23» del monto activo mientras haya una operación; null si no la hay. */
    expression: activeBuf.operation ? activeBuf.display : null,
    invalidOperation: activeBuf.operation && activeBuf.result === null,
    /** Monto para la tecla «=» del monto activo (solo si el resultado es válido y positivo). */
    equalsLabel: activeAccount && activeBuf.operation && activeBuf.result !== null && activeBuf.result > 0 ? formatMoney(activeBuf.result, activeAccount.currency) : null,
    kindOptions: [
      { value: 'expense', label: 'Gasto' },
      { value: 'income', label: 'Ingreso' },
      { value: 'transfer', label: 'Transferencia' },
    ],
    /** Gasto/Ingreso vuelven a la captura sin avisar de descarte (el cambio de pantalla no pierde nada). */
    selectKind: (value: string) => {
      if (value === 'transfer') return;
      // Sin allowExit(): si hay datos, el aviso de descarte aparece y solo se reemplaza al confirmar.
      router.replace({ pathname: '/capture', params: { kind: value === 'income' ? 'income' : 'expense' } });
    },
    /** Chip informativo «Tasa X»: solo cuando hay tasa implícita (monedas distintas y ambos montos). */
    rateChip: implied === null ? null : rateChipLabel(implied),
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
    categoryLabel,
    pickerCategories: expenseCategories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, parentId: c.parentId })),
    selectedCategoryId: category?.id ?? null,
    selectCategory: setCategoryId,
    clearCategory: () => setCategoryId(null),
    openNewCategory: () => router.push({ pathname: '/category/[id]', params: { id: 'new', kind: 'expense', pick: '1' } }),
    openNewSubcategoryOf: (parentId: string) => router.push({ pathname: '/category/[id]', params: { id: 'new', kind: 'expense', parentId, pick: '1' } }),
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
