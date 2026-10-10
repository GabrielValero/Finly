import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { insertTransaction, updateTransaction } from '../data/repos/transactions';
import { findOrCreateTag } from '../data/repos/tags';
import { transactionInputSchema } from '../schemas/transaction';
import { usePreferences } from '../store/preferences';
import { enteredFromTx, resolveEntry } from '../utils/entry';
import { formatMoney, formatRate, MoneyError, type Currency } from '../utils/money';
import { newId } from '../utils/ids';
import { needsRate, type RateRecord } from '../utils/rates';
import { signedAmount } from '../utils/transactions';
import { useAmountBuffer } from './useAmountBuffer';
import { useMovementDetails } from './useMovementDetails';
import { useAccountsWithBalance, useAllCategoryRows, useLatestRate, useTags, useTagsOfTransaction, useTransactionById } from './useData';

export type CaptureKind = 'expense' | 'income';

interface Options {
  /** Edita este movimiento (conserva su tasa congelada y su fecha). */
  editId?: string;
  /** Precarga este movimiento como uno nuevo (fecha de ahora, tasa vigente). */
  duplicateId?: string;
}

export function useCaptureForm({ editId, duplicateId }: Options = {}) {
  const router = useRouter();
  const sourceId = editId ?? duplicateId ?? '';
  const isEdit = editId !== undefined;
  const source = useTransactionById(sourceId);
  const sourceTags = useTagsOfTransaction(sourceId);

  const accounts = useAccountsWithBalance();
  const allCategories = useAllCategoryRows();
  const allTags = useTags();
  const latestRate = useLatestRate();
  const lastAccountId = usePreferences((s) => s.lastAccountId);
  const setLastAccountId = usePreferences((s) => s.setLastAccountId);
  const amount = useAmountBuffer();

  const [kind, setKindState] = useState<CaptureKind>('expense');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [enteredCurrency, setEnteredCurrency] = useState<Currency | null>(null);
  const details = useMovementDetails();
  const { concept, setConcept, occurredAt, setOccurredAt } = details;
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [tagsHydrated, setTagsHydrated] = useState(false);

  const setAmount = amount.set;
  // Precarga al editar/duplicar: una sola vez, cuando llegan los datos del movimiento.
  useEffect(() => {
    if (hydrated || !source || source.deletedAt || source.kind === 'transfer') return;
    const entered = enteredFromTx(source);
    const sourceCategory = allCategories.find((c) => c.id === source.categoryId);
    setKindState(source.kind === 'income' ? 'income' : 'expense');
    setAccountId(source.accountId);
    setEnteredCurrency(entered.currency);
    setAmount(entered.minor);
    setConcept(source.concept);
    if (sourceCategory?.parentId) {
      setParentId(sourceCategory.parentId);
      setSubId(sourceCategory.id);
    } else {
      setParentId(sourceCategory?.id ?? null);
      setSubId(null);
    }
    if (isEdit) setOccurredAt(source.occurredAt);
    setHydrated(true);
  }, [hydrated, source, allCategories, isEdit, setAmount, setConcept, setOccurredAt]);

  useEffect(() => {
    if (tagsHydrated || !hydrated || sourceTags.length === 0) return;
    setTagIds(sourceTags.map((t) => t.id));
    setTagsHydrated(true);
  }, [tagsHydrated, hydrated, sourceTags]);

  // Cuenta por defecto: la última usada (si existe) o la primera.
  const account = useMemo(() => {
    const preferred = accountId ?? lastAccountId;
    return accounts.find((a) => a.id === preferred) ?? accounts[0] ?? null;
  }, [accounts, accountId, lastAccountId]);

  const activeCategories = useMemo(() => allCategories.filter((c) => !c.archivedAt), [allCategories]);
  const parents = useMemo(() => activeCategories.filter((c) => c.kind === kind && !c.parentId), [activeCategories, kind]);
  const parent = parents.find((c) => c.id === parentId) ?? null;
  const subs = useMemo(() => (parent ? activeCategories.filter((c) => c.parentId === parent.id) : []), [activeCategories, parent]);
  const sub = subs.find((c) => c.id === subId) ?? null;
  const category = sub ?? parent;

  const setKind = useCallback((next: CaptureKind) => {
    setKindState(next);
    setParentId(null);
    setSubId(null);
  }, []);

  // Al editar se respeta la tasa congelada del movimiento; si no, rige la más reciente.
  const rate: RateRecord | null = useMemo(() => {
    if (isEdit && source?.rateScaled && source.rateSource) {
      return { source: source.rateSource, rateScaled: source.rateScaled, validFrom: source.occurredAt.slice(0, 10) };
    }
    return latestRate;
  }, [isEdit, source, latestRate]);

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
      const target = kind === 'expense' ? 'de tu cuenta' : 'a tu cuenta';
      const preview = currency !== account.currency ? `${verb} ${formatMoney(r.amountMinor, account.currency)} ${target}` : null;
      return { preview, blocked: false };
    } catch (e) {
      return { preview: null, blocked: e instanceof MoneyError };
    }
  }, [account, amount.minor, currency, rate, kind]);

  const rateLabel = !rateNeeded ? null : rate ? `Tasa ${rate.source === 'bcv' ? 'BCV' : 'manual'} ${formatRate(rate.rateScaled)}${isEdit ? '' : ' · cambiar'}` : 'Define la tasa del día para continuar';

  const sourceReady = sourceId === '' || hydrated;
  const canSave = !saving && sourceReady && !!account && !!category && amount.minor > 0 && !(rateNeeded && !rate) && !conversion.blocked;

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
        occurredAt,
        categoryId: category.id,
        concept,
        tagIds,
        listedAmountMinor: entry.listedAmountMinor,
        listedCurrency: entry.listedCurrency,
        rateScaled: entry.rateScaled,
        rateSource: entry.rateSource,
      });
      const row = {
        accountId: parsed.accountId,
        accountCurrency: parsed.accountCurrency,
        kind: parsed.kind,
        amountMinor: signedAmount(parsed.kind, parsed.amountMinor),
        occurredAt: parsed.occurredAt,
        categoryId: parsed.categoryId,
        concept: parsed.concept,
        note: isEdit ? (source?.note ?? null) : parsed.note,
        rateScaled: parsed.rateScaled,
        rateSource: parsed.rateSource,
        listedAmountMinor: parsed.listedAmountMinor,
        listedCurrency: parsed.listedCurrency,
        updatedAt: new Date(),
      };
      if (isEdit && editId) {
        await updateTransaction(editId, row, parsed.tagIds);
      } else {
        await insertTransaction({ ...row, id: newId(), transferId: null, deletedAt: null }, parsed.tagIds);
      }
      setLastAccountId(account.id);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
      setSaving(false);
    }
  }, [account, category, amount.minor, currency, rate, kind, occurredAt, concept, tagIds, isEdit, editId, source, setLastAccountId, router]);

  const toggleTag = useCallback((id: string) => setTagIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])), []);
  const addTag = useCallback(async (raw: string) => {
    const id = await findOrCreateTag(raw);
    if (id) setTagIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }, []);

  const hasDetails = concept.trim().length > 0 || tagIds.length > 0;

  return {
    title: isEdit ? 'EDITAR MOVIMIENTO' : null,
    isEdit,
    notFound: sourceId !== '' && !source,
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
    categories: parents.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
    categoryId: parent?.id ?? null,
    selectCategory: (id: string) => {
      setParentId(id);
      setSubId(null);
    },
    subcategories: subs.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
    subcategoryId: sub?.id ?? null,
    selectSubcategory: (id: string) => setSubId((cur) => (cur === id ? null : id)),
    // Más detalles
    hasDetails,
    detailsLabel: hasDetails ? [concept.trim(), ...tagIds.map((id) => `#${allTags.find((t) => t.id === id)?.name ?? ''}`)].filter(Boolean).join(' · ') : '+ Concepto, etiquetas, fecha',
    details,
    tags: allTags.map((t) => ({ id: t.id, name: t.name, selected: tagIds.includes(t.id) })),
    toggleTag,
    addTag,
    canSave,
    error,
    save,
    close: () => router.back(),
  };
}
