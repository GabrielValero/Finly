import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { softDeleteTransaction } from '../data/repos/transactions';
import { formatDateTimeLong } from '../utils/dates';
import { formatMinor, formatMoney, formatRate } from '../utils/money';
import { usdEquivalent } from '../utils/transactions';
import { useTransactionById } from './useData';

function safeUsd(tx: Parameters<typeof usdEquivalent>[0]): number | null {
  try {
    return usdEquivalent(tx);
  } catch {
    return null;
  }
}

export function useTransactionDetail(id: string) {
  const router = useRouter();
  const tx = useTransactionById(id);

  if (!tx || tx.deletedAt) return { found: false as const, close: () => router.back() };

  const usd = safeUsd(tx);
  const isTransfer = tx.kind === 'transfer';
  const sign = tx.amountMinor < 0 ? '-' : '+';
  const bigAmount = usd === null ? formatMoney(tx.amountMinor, tx.accountCurrency) : `${sign}${formatMoney(Math.abs(usd), 'USD')}`;

  // Tarjeta de conversión: solo si hubo moneda/tasa de por medio.
  const rateCard = tx.rateScaled
    ? {
        listedLabel: tx.listedCurrency === 'USD' ? 'PRECIO EN USD' : tx.listedCurrency === 'VES' || tx.accountCurrency === 'VES' ? 'PRECIO EN BS' : 'PRECIO',
        listed:
          tx.listedAmountMinor !== null && tx.listedCurrency
            ? formatMoney(tx.listedAmountMinor, tx.listedCurrency)
            : formatMoney(Math.abs(tx.amountMinor), tx.accountCurrency),
        paidLabel: tx.kind === 'income' ? 'RECIBISTE' : 'PAGASTE',
        paid: formatMoney(Math.abs(tx.amountMinor), tx.accountCurrency),
        rate: `${formatRate(tx.rateScaled)} · ${tx.rateSource === 'bcv' ? 'BCV' : 'MANUAL'}`,
      }
    : null;

  return {
    found: true as const,
    icon: isTransfer ? 'transfer' : (tx.categoryIcon ?? 'wallet'),
    title: tx.concept.trim() || (isTransfer ? 'Transferencia' : (tx.categoryName ?? 'Movimiento')),
    bigAmount,
    dateLabel: formatDateTimeLong(tx.occurredAt),
    rateCard,
    rows: [
      { label: 'CUENTA', value: tx.accountName },
      ...(tx.categoryName ? [{ label: 'CATEGORÍA', value: tx.categoryName }] : []),
      ...(tx.concept.trim() ? [{ label: 'CONCEPTO', value: tx.concept.trim() }] : []),
      ...(tx.note ? [{ label: 'NOTA', value: tx.note }] : []),
    ],
    close: () => router.back(),
    confirmDelete: () => {
      Alert.alert('Eliminar movimiento', `Se quitará ${formatMinor(Math.abs(tx.amountMinor))} de tu historial y de los saldos.`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void softDeleteTransaction(tx.id, new Date()).then(() => router.back());
          },
        },
      ]);
    },
  };
}
