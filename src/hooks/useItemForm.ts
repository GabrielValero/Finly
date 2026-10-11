import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { deleteItem, insertItem, updateItem } from '../data/repos/shopping';
import { categoryPath } from '../utils/categories';
import { formatMoney, type Currency } from '../utils/money';
import { formatQuantity, parseQuantity } from '../utils/shopping';
import { useAmountBuffer } from './useAmountBuffer';
import { useCreatedCategory } from './useCreatedCategory';
import { useCategoryRows } from './useData';
import { useShoppingItems, useShoppingList } from './useShopping';

type Priority = 'low' | 'medium' | 'high';

export function useItemForm(id: string, listId: string) {
  const router = useRouter();
  const isNew = id === 'new';
  const list = useShoppingList(listId);
  const items = useShoppingItems(listId);
  const categories = useCategoryRows();
  const existing = isNew ? null : (items.find((i) => i.id === id) ?? null);

  const price = useAmountBuffer();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [note, setNote] = useState('');
  const [hydrated, setHydrated] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setPrice = price.set;
  useEffect(() => {
    if (hydrated || !existing) return;
    setName(existing.name);
    setQuantity(formatQuantity(existing.quantityMilli));
    setCurrency(existing.priceCurrency);
    setCategoryId(existing.categoryId);
    setPriority(existing.priority);
    setNote(existing.note ?? '');
    setPrice(existing.priceMinor ?? 0);
    setHydrated(true);
  }, [hydrated, existing, setPrice]);

  const labelOf = (cid: string | null) => {
    const c = categories.find((x) => x.id === cid);
    return c ? (categoryPath(c.name, categories.find((p) => p.id === c.parentId)?.name ?? null) ?? c.name) : null;
  };
  const pickerCategories = useMemo(
    () => categories.filter((c) => c.kind === 'expense').map((c) => ({ id: c.id, name: c.name, icon: c.icon, parentId: c.parentId })),
    [categories],
  );

  useCreatedCategory(categories, (created) => {
    if (created.kind === 'expense') setCategoryId(created.id);
  });

  const canSave = hydrated && !saving && name.trim().length > 0;

  const save = async () => {
    if (!canSave) return;
    let quantityMilli: number;
    try {
      quantityMilli = parseQuantity(quantity);
    } catch {
      return setError('Cantidad inválida (ej. 2 o 0,5)');
    }
    setSaving(true);
    setError(null);
    const fields = {
      name: name.trim(),
      quantityMilli,
      // Precio 0 = "sin precio": el teclado vacío no distingue un 0 intencional, y un producto gratis no tiene sentido en una lista.
      priceMinor: price.minor > 0 ? price.minor : null,
      priceCurrency: currency,
      categoryId,
      priority: list?.kind === 'wish' ? priority : null,
      note: note.trim() === '' ? null : note.trim(),
    };
    try {
      if (isNew) await insertItem(listId, fields, new Date());
      else await updateItem(id, fields, new Date());
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Quitar producto', `Se quitará "${existing.name}" de la lista.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => void deleteItem(existing.id).then(() => router.back()) },
    ]);
  };

  return {
    isNew,
    notFound: !isNew && items.length > 0 && !existing,
    title: isNew ? 'NUEVO PRODUCTO' : 'EDITAR PRODUCTO',
    isWish: list?.kind === 'wish',
    name,
    setName,
    quantity,
    setQuantity,
    currency,
    setCurrency,
    price,
    priceLabel: price.minor > 0 ? formatMoney(price.minor, currency) : 'Sin precio',
    categoryId,
    categoryLabel: labelOf(categoryId),
    inheritedLabel: labelOf(list?.categoryId ?? null),
    pickerCategories,
    selectCategory: setCategoryId,
    clearCategory: () => setCategoryId(null),
    openNewCategory: () => router.push({ pathname: '/category/[id]', params: { id: 'new', kind: 'expense', pick: '1' } }),
    openNewSubcategory: (parentId: string) => router.push({ pathname: '/category/[id]', params: { id: 'new', kind: 'expense', parentId, pick: '1' } }),
    priority,
    setPriority,
    note,
    setNote,
    canSave,
    error,
    save,
    confirmDelete,
    close: () => router.back(),
  };
}
