import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { archiveCategory, insertCategory, updateCategory } from '../data/repos/categories';
import { useUi } from '../store/ui';
import { validateCategory, type CategoryKind } from '../utils/categories';
import { useCategoryRows } from './useData';

interface Params {
  /** 'new' o el id de la categoría a editar. */
  id: string;
  kind?: string;
  parentId?: string;
  /** '1' = subcategoría: el padre es obligatorio. */
  sub?: string;
  /** '1' = se abrió desde un selector: al guardar, avisa cuál se creó para que se elija sola. */
  pick?: string;
}

export function useCategoryForm({ id, kind: kindParam, parentId: parentParam, sub, pick }: Params) {
  const router = useRouter();
  const rows = useCategoryRows();
  const isNew = id === 'new';
  const subMode = isNew && sub === '1';
  const setCreatedCategoryId = useUi((s) => s.setCreatedCategoryId);
  const existing = isNew ? null : (rows.find((c) => c.id === id) ?? null);

  const [name, setName] = useState('');
  const [kind, setKind] = useState<CategoryKind>(kindParam === 'income' ? 'income' : 'expense');
  const [parentId, setParentId] = useState<string | null>(parentParam ?? null);
  const [icon, setIcon] = useState<string>('cart');
  const [exclude, setExclude] = useState(false);
  const [hydrated, setHydrated] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated || !existing) return;
    setName(existing.name);
    setKind(existing.kind);
    setParentId(existing.parentId);
    setIcon(existing.icon);
    setExclude(existing.excludeFromReports);
    setHydrated(true);
  }, [hydrated, existing]);

  const askParent = subMode && parentParam === undefined;
  const parentOptions = useMemo(() => rows.filter((c) => c.parentId === null && c.kind === kind && c.id !== id), [rows, kind, id]);
  const parent = rows.find((c) => c.id === parentId) ?? null;
  const hasChildren = existing ? rows.some((c) => c.parentId === existing.id) : false;
  // La subcategoría hereda el tipo del padre.
  const effectiveKind: CategoryKind = parent ? parent.kind : kind;

  const problem = useMemo(
    () => (name.trim() === '' ? null : validateCategory({ id: isNew ? null : id, name, kind: effectiveKind, parentId, requireParent: subMode }, rows)),
    [name, effectiveKind, parentId, rows, id, isNew, subMode],
  );

  const canSave = hydrated && !saving && name.trim().length > 0 && problem === null;

  const save = async () => {
    const issue = validateCategory({ id: isNew ? null : id, name, kind: effectiveKind, parentId, requireParent: subMode }, rows);
    if (issue) return setError(issue);
    setSaving(true);
    setError(null);
    try {
      const fields = { name: name.trim(), icon, kind: effectiveKind, parentId, excludeFromReports: exclude };
      if (isNew) {
        const createdId = await insertCategory(fields);
        if (pick === '1') setCreatedCategoryId(createdId);
      } else await updateCategory(id, fields);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
      setSaving(false);
    }
  };

  const confirmArchive = () => {
    if (!existing) return;
    Alert.alert('Archivar categoría', `${existing.name}${hasChildren ? ' y sus subcategorías dejarán' : ' dejará'} de ofrecerse al registrar. Tus movimientos no cambian.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Archivar', style: 'destructive', onPress: () => void archiveCategory(existing.id, new Date()).then(() => router.back()) },
    ]);
  };

  const trimmed = name.trim();
  return {
    isNew,
    notFound: !isNew && rows.length > 0 && !existing,
    title: isNew ? (parentId || subMode ? 'NUEVA SUBCATEGORÍA' : 'NUEVA CATEGORÍA') : 'EDITAR CATEGORÍA',
    previewName: trimmed || 'Nueva categoría',
    previewSub: parent ? `SUBCATEGORÍA DE ${parent.name.toUpperCase()}` : effectiveKind === 'expense' ? 'GASTO' : 'INGRESO',
    name,
    setName,
    kind: effectiveKind,
    setKind,
    kindLocked: parent !== null || hasChildren,
    parentLabel: parent?.name ?? (subMode ? 'Elegir categoría' : 'Ninguna (principal)'),
    parentOptions: [...(subMode ? [] : [{ value: '', label: 'Ninguna (principal)' }]), ...parentOptions.map((c) => ({ value: c.id, label: c.name }))],
    askParent,
    parentId,
    setParentId: (value: string) => setParentId(value === '' ? null : value),
    canNest: !hasChildren,
    icon,
    setIcon,
    exclude,
    setExclude,
    canSave,
    error: problem ?? error,
    save,
    canArchive: !isNew && existing !== null,
    confirmArchive,
    close: () => router.back(),
  };
}
