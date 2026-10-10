import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { softDeleteTransaction } from '../data/repos/transactions';
import { categoryPath } from '../utils/categories';
import { formatDateTimeLong } from '../utils/dates';
import { formatMinor, formatMoney, formatRate } from '../utils/money';
import { usdEquivalent } from '../utils/transactions';
import { latestTransfer } from '../utils/transfers';
import { useTagsOfTransaction, useTransactionById, useTransferLegs } from './useData';

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
  const tags = useTagsOfTransaction(id);
  const legs = useTransferLegs(tx?.transferId ?? null);

  if (!tx || tx.deletedAt) return { found: false as const, close: () => router.back() };

  const usd = safeUsd(tx);
  const isTransfer = tx.kind === 'transfer';
  const transfer = isTransfer ? latestTransfer(legs) : null;
  const sign = tx.amountMinor < 0 ? '-' : '+';
  const bigAmount = transfer
    ? formatMoney(transfer.outMinor, transfer.outCurrency)
    : usd === null ? formatMoney(tx.amountMinor, tx.accountCurrency) : `${sign}${formatMoney(Math.abs(usd), 'USD')}`;

  // Tarjeta de conversión: solo si hubo moneda/tasa de por medio.
  const rateCard = tx.rateScaled
    ? {
        listedLabel: isTransfer ? 'SALIÓ' : tx.listedCurrency === 'USD' ? 'PRECIO EN USD' : tx.listedCurrency === 'VES' || tx.accountCurrency === 'VES' ? 'PRECIO EN BS' : 'PRECIO',
        listed: transfer
          ? formatMoney(transfer.outMinor, transfer.outCurrency)
          : tx.listedAmountMinor !== null && tx.listedCurrency
            ? formatMoney(tx.listedAmountMinor, tx.listedCurrency)
            : formatMoney(Math.abs(tx.amountMinor), tx.accountCurrency),
        paidLabel: isTransfer ? 'LLEGÓ' : tx.kind === 'income' ? 'RECIBISTE' : 'PAGASTE',
        paid: transfer ? formatMoney(transfer.inMinor, transfer.inCurrency) : formatMoney(Math.abs(tx.amountMinor), tx.accountCurrency),
        rate: `${formatRate(tx.rateScaled)} · ${isTransfer ? 'OBTENIDA' : tx.rateSource === 'bcv' ? 'BCV' : 'MANUAL'}`,
      }
    : null;

  const path = categoryPath(tx.categoryName, tx.categoryParentName);

  return {
    found: true as const,
    isTransfer,
    icon: isTransfer ? 'transfer' : (tx.categoryIcon ?? 'wallet'),
    title: tx.concept.trim() || (transfer ? `${transfer.fromName} → ${transfer.toName}` : isTransfer ? 'Transferencia' : (tx.categoryName ?? 'Movimiento')),
    bigAmount,
    dateLabel: formatDateTimeLong(tx.occurredAt),
    rateCard,
    rows: [
      ...(transfer
        ? [
            { label: 'DESDE', value: transfer.fromName },
            { label: 'HACIA', value: transfer.toName },
          ]
        : [{ label: 'CUENTA', value: tx.accountName }]),
      ...(path ? [{ label: 'CATEGORÍA', value: path }] : []),
      ...(tx.concept.trim() ? [{ label: 'CONCEPTO', value: tx.concept.trim() }] : []),
      ...(tags.length > 0 ? [{ label: 'ETIQUETAS', value: tags.map((t) => `#${t.name}`).join(' ') }] : []),
      ...(tx.note ? [{ label: 'NOTA', value: tx.note }] : []),
    ],
    close: () => router.back(),
    edit: () => router.push({ pathname: '/capture', params: { editId: tx.id } }),
    duplicate: () => router.push({ pathname: '/capture', params: { duplicateId: tx.id } }),
    confirmDelete: () => {
      const detail = isTransfer ? 'Se quitarán las dos partes de la transferencia' : `Se quitará ${formatMinor(Math.abs(tx.amountMinor))} de tu historial y de los saldos`;
      Alert.alert(isTransfer ? 'Eliminar transferencia' : 'Eliminar movimiento', `${detail}.`, [
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
