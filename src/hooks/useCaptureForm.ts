import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { insertTransaction, updateTransaction } from '../data/repos/transactions';
import { findOrCreateTag } from '../data/repos/tags';
import { transactionInputSchema } from '../schemas/transaction';
import { usePreferences } from '../store/preferences';
import { categoryPath } from '../utils/categories';
import { dayOf, toLocalIso } from '../utils/dates';
import { enteredFromTx, pickCaptureRate, resolveEntry } from '../utils/entry';
import { captureSaveLabel, captureTitle, conversionSummary, frequentCategoryChips, rateChipLabel, tagsChipLabel } from '../utils/captureChips';
import { currencySymbol, formatMinor, formatMoney, formatRate, MoneyError, type Currency } from '../utils/money';
import { newId } from '../utils/ids';
import { needsRate, type RateRecord } from '../utils/rates';
import { signedAmount } from '../utils/transactions';
import { useAmountBuffer } from './useAmountBuffer';
import { useCreatedCategory } from './useCreatedCategory';
import { useDiscardGuard } from './useDiscardGuard';
import { useMovementDetails } from './useMovementDetails';
import { useAccountsWithBalance, useAllCategoryRows, useCategoryUsage, useLatestRate, useTags, useTagsOfTransaction, useTransactionById } from './useData';

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
  const categoryUsage = useCategoryUsage();
  const latestRate = useLatestRate();
  const lastAccountId = usePreferences((s) => s.lastAccountId);
  const setLastAccountId = usePreferences((s) => s.setLastAccountId);
  const amount = useAmountBuffer(2, false, true);
  const manualRate = useAmountBuffer(4);

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
  /** Tasa manual elegida para ESTE movimiento (null = la vigente del día). */
  const [manualRateScaled, setManualRateScaled] = useState<number | null>(null);
  const [rateSheetOpen, setRateSheetOpen] = useState(false);
  const [rateMode, setRateMode] = useState<'auto' | 'manual'>('auto');
  const [initialSignature, setInitialSignature] = useState<string | null>(null);

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

  const pickerCategories = useMemo(
    () => activeCategories.filter((c) => c.kind === kind).map((c) => ({ id: c.id, name: c.name, icon: c.icon, parentId: c.parentId })),
    [activeCategories, kind],
  );

  const categoryChips = useMemo(
    () =>
      frequentCategoryChips(
        activeCategories.map((c) => ({ id: c.id, name: c.name, kind: c.kind, parentId: c.parentId, color: c.color })),
        categoryUsage,
        kind,
        category?.id ?? null,
        8,
      ),
    [activeCategories, categoryUsage, kind, category],
  );
  const pickChipCategory = useCallback(
    (id: string) => {
      if (parentId === id) return;
      setParentId(id);
      setSubId(null);
    },
    [parentId],
  );

  const selectAnyCategory = useCallback(
    (id: string) => {
      const picked = activeCategories.find((c) => c.id === id);
      if (!picked) return;
      if (picked.parentId) {
        setParentId(picked.parentId);
        setSubId(picked.id);
      } else {
        setParentId(picked.id);
        setSubId(null);
      }
    },
    [activeCategories],
  );

  // Categoría recién creada desde esta pantalla: se elige sola (y se cambia el tipo si hace falta).
  useCreatedCategory(activeCategories, (created) => {
    setKindState(created.kind);
    setParentId(created.parentId ?? created.id);
    setSubId(created.parentId ? created.id : null);
  });

  const setKind = useCallback((next: CaptureKind) => {
    setKindState(next);
    setParentId(null);
    setSubId(null);
  }, []);

  // Al editar se respeta la tasa congelada; si no, la manual de este movimiento o la vigente.
  const rate: RateRecord | null = useMemo(
    () =>
      pickCaptureRate({
        frozen: isEdit && source?.rateScaled && source.rateSource ? { source: source.rateSource, rateScaled: source.rateScaled, validFrom: source.occurredAt.slice(0, 10) } : null,
        manualRateScaled,
        latest: latestRate,
        today: dayOf(toLocalIso(new Date())),
      }),
    [isEdit, source, latestRate, manualRateScaled],
  );

  const currency: Currency = enteredCurrency ?? account?.currency ?? 'USD';
  const rateNeeded = account ? needsRate(account.currency, currency === account.currency ? null : currency) : false;

  const conversion = useMemo(() => {
    if (!account || amount.minor <= 0) return { blocked: false };
    try {
      // Solo valida que la conversión sea posible (tasa presente y sin desborde).
      resolveEntry({
        enteredMinor: amount.minor,
        enteredCurrency: currency,
        accountCurrency: account.currency,
        rateScaled: rate?.rateScaled ?? null,
        rateSource: rate?.source ?? null,
      });
      return { blocked: false };
    } catch (e) {
      return { blocked: e instanceof MoneyError };
    }
  }, [account, amount.minor, currency, rate]);

  /** Chip «Tasa X»: solo cuando la moneda tecleada difiere de la de la cuenta. */
  const rateChip = !rateNeeded ? null : rate ? rateChipLabel(rate.rateScaled) : 'Define la tasa';
  const summary = conversionSummary({ amountMinor: amount.minor, currency, rateScaled: rate?.rateScaled ?? null });

  const setManual = manualRate.setRate;
  const openRateSheet = () => {
    if (isEdit) return;
    setRateMode(manualRateScaled === null ? 'auto' : 'manual');
    setManual(manualRateScaled ?? 0);
    setRateSheetOpen(true);
  };
  const canApplyRate = rateMode === 'auto' || manualRate.rateScaled > 0;
  const applyRate = () => {
    if (!canApplyRate) return;
    setManualRateScaled(rateMode === 'manual' ? manualRate.rateScaled : null);
    setRateSheetOpen(false);
  };

  // Aviso al salir con un movimiento a medias: se compara contra el estado inicial (ya hidratado al editar/duplicar).
  const signature = JSON.stringify([kind, accountId, parentId, subId, enteredCurrency, amount.buffer, concept, tagIds, occurredAt, manualRateScaled]);
  const signatureRef = useRef(signature);
  signatureRef.current = signature;
  const ready = (sourceId === '' || hydrated) && (sourceId === '' || sourceTags.length === 0 || tagsHydrated);
  useEffect(() => {
    if (ready && initialSignature === null) setInitialSignature(signatureRef.current);
  }, [ready, initialSignature]);
  useEffect(() => {
    if (tagsHydrated) setInitialSignature(signatureRef.current);
  }, [tagsHydrated]);
  const dirty = initialSignature !== null && signature !== initialSignature && !saving;
  const allowExit = useDiscardGuard(dirty, {
    title: isEdit ? '¿Descartar los cambios?' : '¿Descartar este movimiento?',
    message: isEdit ? 'Si sales ahora perderás los cambios que hiciste en este movimiento.' : 'Si sales ahora perderás el movimiento que estás registrando.',
  });

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
      allowExit();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
      setSaving(false);
    }
  }, [account, category, amount.minor, currency, rate, kind, occurredAt, concept, tagIds, isEdit, editId, source, setLastAccountId, router, allowExit]);

  const toggleTag = useCallback((id: string) => setTagIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])), []);
  const addTag = useCallback(async (raw: string) => {
    const id = await findOrCreateTag(raw);
    if (id) setTagIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }, []);

  const hasTags = tagIds.length > 0;

  return {
    title: captureTitle(isEdit),
    saveLabel: captureSaveLabel(kind, isEdit),
    isEdit,
    notFound: sourceId !== '' && !source,
    kind,
    setKind,
    kindOptions: [
      { value: 'expense', label: 'Gasto' },
      { value: 'income', label: 'Ingreso' },
      // Editar un movimiento no puede convertirlo en transferencia.
      ...(isEdit ? [] : [{ value: 'transfer', label: 'Transferencia' }]),
    ],
    selectKind: (value: string) => {
      if (value === 'transfer') {
        allowExit();
        router.replace('/transfer');
      } else setKind(value === 'income' ? 'income' : 'expense');
    },
    /** Monto grande: el resultado si hay una operación en curso; si no, lo tecleado. */
    amountDisplay: amount.operation ? (amount.result === null ? '0' : formatMinor(amount.result)) : amount.display,
    /** «500 + 395,23» mientras haya una operación en curso; null si no la hay. */
    expression: amount.operation ? amount.display : null,
    invalidOperation: amount.operation && amount.result === null,
    currencyPrefix: currencySymbol(currency),
    /** Monto para la tecla «=» (solo si el resultado es válido y positivo). */
    equalsLabel: amount.operation && amount.result !== null && amount.result > 0 ? formatMoney(amount.result, currency) : null,
    pressKey: amount.press,
    currency,
    setCurrency: setEnteredCurrency,
    summary,
    rateChip,
    rateMissing: rateNeeded && !rate,
    openRate: openRateSheet,
    rateSheet: {
      open: rateSheetOpen,
      close: () => setRateSheetOpen(false),
      mode: rateMode,
      setMode: setRateMode,
      manual: manualRate,
      autoLabel: latestRate ? `${latestRate.source === 'bcv' ? 'BCV' : 'Manual'} ${formatRate(latestRate.rateScaled)} Bs por USD` : 'Aún no hay una tasa registrada',
      canApply: canApplyRate,
      apply: applyRate,
    },
    accounts: accounts.map((a) => ({ value: a.id, label: a.name, hint: `${a.currency} · ${formatMoney(a.balanceMinor, a.currency)}` })),
    accountName: account?.name ?? 'Sin cuentas',
    accountId: account?.id ?? null,
    selectAccount: (id: string) => {
      setAccountId(id);
      setEnteredCurrency(null);
    },
    hasAccounts: accounts.length > 0,
    openNewAccount: () => router.push('/account/new'),
    pickerCategories,
    selectedCategoryValue: category?.id ?? null,
    selectAnyCategory,
    openNewCategory: () => router.push({ pathname: '/category/[id]', params: { id: 'new', kind, pick: '1' } }),
    openNewSubcategoryOf: (parentId: string) => router.push({ pathname: '/category/[id]', params: { id: 'new', kind, parentId, pick: '1' } }),
    categoryLabel: category ? (categoryPath(sub?.name ?? null, parent?.name ?? null) ?? category.name) : null,
    categoryChips,
    pickChipCategory,
    // Etiquetas (en «Más detalles»)
    hasTags,
    tagsChip: tagsChipLabel(tagIds.map((id) => allTags.find((t) => t.id === id)?.name ?? '').filter((n) => n !== '')),
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
