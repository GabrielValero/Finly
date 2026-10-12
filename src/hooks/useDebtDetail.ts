import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { addPayment, deleteDebt, deletePayment } from '../data/repos/debts';
import { dayOf, formatDayShort, toLocalIso } from '../utils/dates';
import { DIRECTION_LABEL, debtStatus, debtUsd, devaluation, remainingMinor, validatePayment } from '../utils/debts';
import { formatMoney } from '../utils/money';
import { useAmountBuffer } from './useAmountBuffer';
import { useLatestRate } from './useData';
import { useDebt, useDebtPayments } from './useDebtData';
import { useMovementLink } from './useMovementLink';

export function useDebtDetail(id: string) {
  const router = useRouter();
  const debt = useDebt(id);
  const payments = useDebtPayments(id);
  const rate = useLatestRate();
  const today = dayOf(toLocalIso(new Date()));

  const [sheet, setSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const amount = useAmountBuffer();
  const movement = useMovementLink(debt?.currency ?? 'USD');

  const view = useMemo(() => {
    if (!debt) return null;
    const remaining = remainingMinor(debt.principalMinor, payments);
    const status = debtStatus(remaining, debt.dueOn, today);
    const usd = debt.currency === 'VES' ? debtUsd(remaining, 'VES', rate?.rateScaled ?? null) : null;
    const dev = debt.currency === 'VES' ? devaluation(remaining, debt.openRateScaled, rate?.rateScaled ?? null) : null;
    return { remaining, status, usd, dev };
  }, [debt, payments, rate, today]);

  const openPayment = () => {
    amount.reset();
    setError(null);
    setSheet(true);
  };

  const confirmPayment = async () => {
    if (!debt || !view) return;
    const problem = validatePayment(amount.minor, view.remaining) ?? movement.problem;
    if (problem) return setError(problem);
    setSaving(true);
    setError(null);
    try {
      await addPayment({ debtId: debt.id, amountMinor: amount.minor, paidOn: today, note: null, link: movement.link }, new Date());
      setSheet(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletePayment = (paymentId: string) =>
    Alert.alert('Quitar pago', 'Se quitará el pago y, si lo registraste en una cuenta, también ese movimiento.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => void deletePayment(paymentId, new Date()) },
    ]);

  const confirmDeleteDebt = () => {
    if (!debt) return;
    Alert.alert('Eliminar deuda', `Se borrará la deuda con ${debt.person}, sus pagos y los movimientos que haya registrado en tus cuentas.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void deleteDebt(debt.id, new Date()).then(() => router.back()) },
    ]);
  };

  const currency = debt?.currency ?? 'USD';
  return {
    notFound: debt === null,
    person: debt?.person ?? '',
    directionLabel: debt ? DIRECTION_LABEL[debt.direction] : '',
    note: debt?.note ?? null,
    status: view?.status ?? 'open',
    remaining: formatMoney(view?.remaining ?? 0, currency),
    principal: formatMoney(debt?.principalMinor ?? 0, currency),
    paid: formatMoney((debt?.principalMinor ?? 0) - (view?.remaining ?? 0), currency),
    progress: debt ? 1 - (view?.remaining ?? 0) / debt.principalMinor : 0,
    usdNote: view?.usd == null ? null : `≈ ${formatMoney(view.usd, 'USD')} hoy`,
    devaluationNote:
      view?.dev && view.dev.lossUsd !== 0
        ? view.dev.lossUsd > 0
          ? `Cuando se abrió valía ${formatMoney(view.dev.atOpenUsd, 'USD')}; hoy ${formatMoney(view.dev.nowUsd, 'USD')} (${debt?.direction === 'owed_to_me' ? 'perdiste' : 'ahorraste'} ${formatMoney(view.dev.lossUsd, 'USD')} por la devaluación).`
          : `Cuando se abrió valía ${formatMoney(view.dev.atOpenUsd, 'USD')}; hoy ${formatMoney(view.dev.nowUsd, 'USD')}.`
        : null,
    openedLabel: debt ? `Desde ${formatDayShort(debt.openedOn)}` : '',
    dueLabel: debt?.dueOn ? `${view?.status === 'overdue' ? 'Venció el' : 'Vence el'} ${formatDayShort(debt.dueOn)}` : null,
    payments: [...payments].reverse().map((p) => ({ id: p.id, date: formatDayShort(p.paidOn), amount: formatMoney(p.amountMinor, currency), linked: p.transactionId !== null })),
    sheet,
    closeSheet: () => setSheet(false),
    openPayment,
    amount,
    amountLabel: formatMoney(amount.minor, currency),
    payAll: () => amount.set(view?.remaining ?? 0),
    movement,
    paymentError: error,
    saving,
    confirmPayment,
    confirmDeletePayment,
    confirmDeleteDebt,
    isSettled: view?.status === 'settled',
    edit: () => router.push({ pathname: '/debt-form/[id]', params: { id } }),
    back: () => router.back(),
  };
}
