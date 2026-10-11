import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { deleteList, insertList, updateList } from '../data/repos/shopping';
import { categoryPath } from '../utils/categories';
import { formatMoney, formatRate } from '../utils/money';
import { useAmountBuffer } from './useAmountBuffer';
import { useCreatedCategory } from './useCreatedCategory';
import { useCategoryRows } from './useData';
import { useRateRows, useShoppingList } from './useShopping';
import { resolveListRate } from '../utils/shopping';

type Kind = 'market' | 'wish';
type RateMode = 'bcv' | 'manual';

export function useListForm(id: string) {
  const router = useRouter();
  const isNew = id === 'new';
  const existing = useShoppingList(isNew ? '' : id);
  const categories = useCategoryRows();
  const rates = useRateRows();

  const limit = useAmountBuffer();
  const manualRate = useAmountBuffer(4);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<Kind>('market');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [rateMode, setRateMode] = useState<RateMode>('bcv');
  const [hydrated, setHydrated] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLimit = limit.set;
  const setManual = manualRate.setRate;
  useEffect(() => {
    if (hydrated || !existing) return;
    setName(existing.name);
    setKind(existing.kind);
    setCategoryId(existing.categoryId);
    setRateMode(existing.rateMode);
    setLimit(existing.limitMinor ?? 0);
    if (existing.manualRateScaled) setManual(existing.manualRateScaled);
    setHydrated(true);
  }, [hydrated, existing, setLimit, setManual]);

  const pickerCategories = useMemo(
    () => categories.filter((c) => c.kind === 'expense').map((c) => ({ id: c.id, name: c.name, icon: c.icon, parentId: c.parentId })),
    [categories],
  );
  const selected = categories.find((c) => c.id === categoryId) ?? null;
  const categoryLabel = selected ? (categoryPath(selected.name, categories.find((p) => p.id === selected.parentId)?.name ?? null) ?? selected.name) : null;

  useCreatedCategory(categories, (created) => {
    if (created.kind === 'expense') setCategoryId(created.id);
  });

  const currentBcv = resolveListRate({ rateMode: 'bcv', manualRateScaled: null }, rates);
  const manualValid = manualRate.rateScaled > 0;
  const canSave = hydrated && !saving && name.trim().length > 0 && categoryId !== null && (rateMode === 'bcv' || manualValid);

  const save = async () => {
    if (!canSave || !categoryId) return;
    setSaving(true);
    setError(null);
    const fields = {
      name: name.trim(),
      kind,
      categoryId,
      limitMinor: kind === 'market' && limit.minor > 0 ? limit.minor : null,
      rateMode,
      manualRateScaled: rateMode === 'manual' ? manualRate.rateScaled : null,
    };
    try {
      if (isNew) {
        const newId = await insertList(fields, new Date());
        router.replace({ pathname: '/list/[id]', params: { id: newId } });
      } else {
        await updateList(id, fields, new Date());
        router.back();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Eliminar lista', `Se borrará "${existing.name}" con todos sus productos. Los gastos ya registrados no cambian.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          void deleteList(existing.id).then(() => {
            // Se vuelve a la pestaña: la pantalla de detalle de esta lista ya no existe.
            router.dismissAll();
          }),
      },
    ]);
  };

  return {
    isNew,
    title: isNew ? 'NUEVA LISTA' : 'EDITAR LISTA',
    name,
    setName,
    kind,
    setKind,
    kindLocked: !isNew,
    categoryLabel,
    categoryId,
    pickerCategories,
    selectCategory: setCategoryId,
    openNewCategory: () => router.push({ pathname: '/category/[id]', params: { id: 'new', kind: 'expense', pick: '1' } }),
    openNewSubcategory: (parentId: string) => router.push({ pathname: '/category/[id]', params: { id: 'new', kind: 'expense', parentId, pick: '1' } }),
    limit,
    limitLabel: limit.minor > 0 ? formatMoney(limit.minor, 'USD') : 'Sin límite',
    rateMode,
    setRateMode,
    manualRate,
    bcvLabel: currentBcv ? `Hoy: ${formatRate(currentBcv.rateScaled)} Bs por USD` : 'Aún no hay tasa BCV guardada',
    manualLabel: manualValid ? `${formatRate(manualRate.rateScaled)} Bs por USD` : 'Escribir tasa',
    canSave,
    error,
    save,
    confirmDelete,
    close: () => router.back(),
  };
}
