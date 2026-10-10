import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { deleteBudgetItem, saveBudgetItem } from '../data/repos/budgets';
import { validateBudgetItem } from '../utils/budget';
import { categoryPath, type CategoryKind } from '../utils/categories';
import { formatMonthLabel } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { useAmountBuffer } from './useAmountBuffer';
import { useCreatedCategory } from './useCreatedCategory';
import { useBudgetItems, useCategoryRows } from './useData';

interface Params {
  /** 'new' o el id de la partida a editar. */
  id: string;
  month: string;
}

export function useBudgetItemForm({ id, month }: Params) {
  const router = useRouter();
  const isNew = id === 'new';
  const items = useBudgetItems(month);
  const categories = useCategoryRows();
  const existing = isNew ? null : (items.find((i) => i.id === id) ?? null);

  const amount = useAmountBuffer();
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isFixed, setIsFixed] = useState(false);
  const [hydrated, setHydrated] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAmount = amount.set;
  useEffect(() => {
    if (hydrated || !existing) return;
    setKind(existing.kind);
    setCategoryId(existing.categoryId);
    setIsFixed(existing.isFixed);
    setAmount(existing.plannedMinor);
    setHydrated(true);
  }, [hydrated, existing, setAmount]);

  const taken = useMemo(() => items.filter((i) => i.kind === kind && i.id !== id).map((i) => i.categoryId), [items, kind, id]);

  const pickerCategories = useMemo(
    () => categories.filter((c) => c.kind === kind).map((c) => ({ id: c.id, name: c.name, icon: c.icon, parentId: c.parentId })),
    [categories, kind],
  );

  const selected = categories.find((c) => c.id === categoryId) ?? null;
  const selectedLabel = selected ? (categoryPath(selected.name, categories.find((c) => c.id === selected.parentId)?.name ?? null) ?? selected.name) : null;

  // Categoría recién creada desde el selector: se elige sola (y cambia el tipo si hace falta).
  useCreatedCategory(categories, (created) => {
    setKind(created.kind);
    if (created.kind === 'income') setIsFixed(false);
    setCategoryId(created.id);
  });

  const changeKind = (next: CategoryKind) => {
    if (next === kind) return;
    setKind(next);
    setCategoryId(null);
    if (next === 'income') setIsFixed(false);
  };

  const save = async () => {
    setError(null);
    const problem = validateBudgetItem({ categoryId, categoryKind: selected?.kind ?? null, kind, plannedMinor: amount.minor, takenCategoryIds: taken });
    if (problem || !categoryId) return setError(problem ?? 'Elige una categoría');
    setSaving(true);
    try {
      await saveBudgetItem({ month, categoryId, kind, plannedMinor: amount.minor, isFixed }, new Date());
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Quitar del presupuesto', `${existing.categoryName} dejará de estar planificada en ${formatMonthLabel(month)}. Tus movimientos no cambian.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => void deleteBudgetItem(existing.id).then(() => router.back()) },
    ]);
  };

  return {
    isNew,
    notFound: !isNew && items.length > 0 && !existing,
    title: isNew ? 'PLANIFICAR' : 'EDITAR PARTIDA',
    monthLabel: formatMonthLabel(month),
    kind,
    changeKind,
    categoryLocked: !isNew,
    selectedLabel,
    pickerCategories,
    takenIds: taken,
    selectedId: categoryId,
    selectCategory: setCategoryId,
    openNewCategory: () => router.push({ pathname: '/category/[id]', params: { id: 'new', kind, pick: '1' } }),
    openNewSubcategory: (parentId: string) => router.push({ pathname: '/category/[id]', params: { id: 'new', kind, parentId, pick: '1' } }),
    amount,
    amountLabel: `$ ${amount.display}`,
    previewLabel: formatMoney(amount.minor, 'USD'),
    isFixed,
    setIsFixed,
    canSave: hydrated && !saving && amount.minor > 0 && categoryId !== null,
    error,
    save,
    confirmDelete,
    close: () => router.back(),
  };
}
