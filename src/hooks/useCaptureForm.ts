import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { insertTransaction } from '../data/repos/transactions';
import { transactionInputSchema } from '../schemas/transaction';
import { usePreferences } from '../store/preferences';
import { toLocalIso } from '../utils/dates';
import { resolveEntry } from '../utils/entry';
import { formatMoney, formatRate, MoneyError, type Currency } from '../utils/money';
import { newId } from '../utils/ids';
import { needsRate } from '../utils/rates';
import { signedAmount } from '../utils/transactions';
import { useAmountBuffer } from './useAmountBuffer';
import { useAccountsWithBalance, useCategoryRows, useLatestRate } from './useData';

export type CaptureKind = 'expense' | 'income';

export function useCaptureForm() {
  const router = useRouter();
  const accounts = useAccountsWithBalance();
  const allCategories = useCategoryRows();
  const rate = useLatestRate();
  const lastAccountId = usePreferences((s) => s.lastAccountId);
  const setLastAccountId = usePreferences((s) => s.setLastAccountId);
  const amount = useAmountBuffer();

  const [kind, setKind] = useState<CaptureKind>('expense');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [enteredCurrency, setEnteredCurrency] = useState<Currency | null>(null);
  const [concept, setConcept] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cuenta por defecto: la última usada (si existe) o la primera.
  const account = useMemo(() => {
    const preferred = accountId ?? lastAccountId;
    return accounts.find((a) => a.id === preferred) ?? accounts[0] ?? null;
  }, [accounts, accountId, lastAccountId]);

  const categories = useMemo(() => allCategories.filter((c) => c.kind === kind && !c.parentId), [allCategories, kind]);
  const category = categories.find((c) => c.id === categoryId) ?? null;

  // Al cambiar de tipo, la categoría elegida deja de aplicar.
  useEffect(() => setCategoryId(null), [kind]);

  const currency: Currency = enteredCurrency ?? account?.currency ?? 'USD';
  const rateNeeded = account ? needsRate(account.currency, currency === account.currency ? null : currency) : false;

  const conversion = useMemo(() => {
    if (!account || amount.minor <= 0) return { preview: null as string | null, blocked: false };
    try {
      const r = resolveEntry({
        enteredMinor: amount.minor,
        enteredCurrency: currency,
        accountCurrency: account.currency,
        rateScaled: rate?.rateScaled ?? null,
        rateSource: rate?.source ?? null,
      });
      const verb = kind === 'expense' ? 'Saldrán' : 'Entrarán';
      const preview = currency !== account.currency ? `${verb} ${formatMoney(r.amountMinor, account.currency)} de tu cuenta` : null;
      return { preview: kind === 'income' && preview ? preview.replace('de tu cuenta', 'a tu cuenta') : preview, blocked: false };
    } catch (e) {
      return { preview: null, blocked: e instanceof MoneyError };
    }
  }, [account, amount.minor, currency, rate, kind]);

  const rateLabel = !rateNeeded ? null : rate ? `Tasa ${rate.source === 'bcv' ? 'BCV' : 'manual'} ${formatRate(rate.rateScaled)} · cambiar` : 'Define la tasa del día para continuar';

  const canSave = !saving && !!account && !!category && amount.minor > 0 && !(rateNeeded && !rate) && !conversion.blocked;

  const save = useCallback(async () => {
    if (!account || !category) return;
    setError(null);
    setSaving(true);
    try {
      const entry = resolveEntry({
        enteredMinor: amount.minor,
        enteredCurrency: currency,
        accountCurrency: account.currency,
        rateScaled: rate?.rateScaled ?? null,
        rateSource: rate?.source ?? null,
      });
      const parsed = transactionInputSchema.parse({
        accountId: account.id,
        accountCurrency: account.currency,
        kind,
        amountMinor: entry.amountMinor,
        occurredAt: toLocalIso(new Date()),
        categoryId: category.id,
        concept,
        listedAmountMinor: entry.listedAmountMinor,
        listedCurrency: entry.listedCurrency,
        rateScaled: entry.rateScaled,
        rateSource: entry.rateSource,
      });
      await insertTransaction({
        id: newId(),
        accountId: parsed.accountId,
        accountCurrency: parsed.accountCurrency,
        kind: parsed.kind,
        amountMinor: signedAmount(parsed.kind, parsed.amountMinor),
        occurredAt: parsed.occurredAt,
        categoryId: parsed.categoryId,
        concept: parsed.concept,
        note: parsed.note,
        rateScaled: parsed.rateScaled,
        rateSource: parsed.rateSource,
        listedAmountMinor: parsed.listedAmountMinor,
        listedCurrency: parsed.listedCurrency,
        transferId: null,
        deletedAt: null,
        updatedAt: new Date(),
      });
      setLastAccountId(account.id);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
      setSaving(false);
    }
  }, [account, category, amount.minor, currency, rate, kind, concept, setLastAccountId, router]);

  return {
    kind,
    setKind,
    kindLabel: kind === 'expense' ? 'Gasto' : 'Ingreso',
    amountDisplay: amount.display,
    pressKey: amount.press,
    currency,
    setCurrency: setEnteredCurrency,
    preview: conversion.preview,
    rateLabel,
    rateMissing: rateNeeded && !rate,
    openRate: () => router.push('/rate'),
    accounts: accounts.map((a) => ({ value: a.id, label: a.name, hint: `${a.currency} · ${formatMoney(a.balanceMinor, a.currency)}` })),
    accountName: account?.name ?? 'Sin cuentas',
    accountId: account?.id ?? null,
    selectAccount: (id: string) => {
      setAccountId(id);
      setEnteredCurrency(null);
    },
    hasAccounts: accounts.length > 0,
    openNewAccount: () => router.push('/account/new'),
    categories: categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
    categoryId: category?.id ?? null,
    selectCategory: setCategoryId,
    concept,
    setConcept,
    canSave,
    error,
    save,
    close: () => router.back(),
  };
}
