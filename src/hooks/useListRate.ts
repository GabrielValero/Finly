import { useState } from 'react';
import { setListRate } from '../data/repos/shopping';
import { formatRate } from '../utils/money';
import { resolveListRate } from '../utils/shopping';
import { useAmountBuffer } from './useAmountBuffer';
import { useRateRows, useShoppingList } from './useShopping';

/** Editor de la tasa de una lista (BCV o manual). Lo comparten el detalle y el formulario de producto. */
export function useListRateEditor(listId: string) {
  const list = useShoppingList(listId);
  const rates = useRateRows();
  const manual = useAmountBuffer(4);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'bcv' | 'manual'>('bcv');
  const [saving, setSaving] = useState(false);

  const effective = list ? resolveListRate(list, rates) : null;
  const bcv = resolveListRate({ rateMode: 'bcv', manualRateScaled: null }, rates);
  const setManual = manual.setRate;

  const openSheet = () => {
    setMode(list?.rateMode ?? 'bcv');
    setManual(list?.manualRateScaled ?? 0);
    setOpen(true);
  };

  const canSave = !saving && (mode === 'bcv' || manual.rateScaled > 0);
  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await setListRate(listId, mode, mode === 'manual' ? manual.rateScaled : null, new Date());
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return {
    rate: effective,
    label: effective ? `${formatRate(effective.rateScaled)} Bs · ${effective.source === 'bcv' ? 'BCV' : 'Manual'}` : 'Sin tasa',
    bcvLabel: bcv ? `BCV hoy: ${formatRate(bcv.rateScaled)} Bs por USD` : 'Aún no hay tasa BCV guardada',
    open,
    openSheet,
    close: () => setOpen(false),
    mode,
    setMode,
    manual,
    canSave,
    save,
  };
}

export type ListRateEditor = ReturnType<typeof useListRateEditor>;
