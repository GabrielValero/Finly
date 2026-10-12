import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { createDebt, updateDebt } from '../data/repos/debts';
import { dayOf, formatDayShort, toLocalIso } from '../utils/dates';
import { DIRECTION_LABEL, validatePerson, type DebtDirection } from '../utils/debts';
import { formatMoney, type Currency } from '../utils/money';
import { useAmountBuffer } from './useAmountBuffer';
import { useLatestRate } from './useData';
import { useDebt } from './useDebtData';
import { useMovementLink } from './useMovementLink';

export function useDebtForm(id: string, initialDirection: DebtDirection) {
  const router = useRouter();
  const isNew = id === 'new';
  const existing = useDebt(isNew ? '' : id);
  const rate = useLatestRate();

  const amount = useAmountBuffer();
  const [direction, setDirection] = useState<DebtDirection>(initialDirection);
  const [person, setPerson] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [note, setNote] = useState('');
  const [dueOn, setDueOn] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const movement = useMovementLink(currency);

  const setAmount = amount.set;
  useEffect(() => {
    if (hydrated || !existing) return;
    setDirection(existing.direction);
    setPerson(existing.person);
    setCurrency(existing.currency);
    setNote(existing.note ?? '');
    setDueOn(existing.dueOn);
    setAmount(existing.principalMinor);
    setHydrated(true);
  }, [hydrated, existing, setAmount]);

  const today = dayOf(toLocalIso(new Date()));
  const canSave = hydrated && !saving && person.trim().length > 0 && amount.minor > 0;

  const save = async () => {
    const problem = validatePerson(person);
    if (problem) return setError(problem);
    if (isNew && movement.problem) return setError(movement.problem);
    setSaving(true);
    setError(null);
    try {
      const base = {
        direction,
        person,
        currency,
        principalMinor: amount.minor,
        note: note.trim() === '' ? null : note.trim(),
        dueOn,
        // Para medir la devaluación de una deuda en Bs se guarda la tasa del día de apertura.
        openRateScaled: currency === 'VES' ? (existing?.openRateScaled ?? rate?.rateScaled ?? null) : null,
      };
      if (isNew) {
        const newId = await createDebt({ ...base, openedOn: today }, movement.link, new Date());
        router.replace({ pathname: '/debt/[id]', params: { id: newId } });
      } else {
        await updateDebt(id, base, new Date());
        router.back();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
      setSaving(false);
    }
  };

  return {
    isNew,
    title: isNew ? 'NUEVA DEUDA' : 'EDITAR DEUDA',
    directionOptions: [
      { value: 'owed_to_me' as const, label: DIRECTION_LABEL.owed_to_me },
      { value: 'i_owe' as const, label: DIRECTION_LABEL.i_owe },
    ],
    direction,
    setDirection,
    locked: !isNew,
    person,
    setPerson,
    currency,
    setCurrency,
    amount,
    amountLabel: amount.minor > 0 ? formatMoney(amount.minor, currency) : 'Escribir monto',
    note,
    setNote,
    dueOn,
    setDueOn,
    dueLabel: dueOn ? formatDayShort(dueOn) : 'Sin fecha',
    today,
    movement,
    movementHint:
      direction === 'owed_to_me'
        ? 'Si eliges una cuenta, el préstamo sale de ella como movimiento (no cuenta como gasto en reportes ni presupuesto).'
        : 'Si eliges una cuenta, el dinero recibido entra a ella como movimiento (no cuenta como ingreso en reportes).',
    canSave,
    error,
    save,
    close: () => router.back(),
  };
}
