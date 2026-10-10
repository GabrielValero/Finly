import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useMemo } from 'react';
import { setTransferCategory, softDeleteTransaction } from '../data/repos/transactions';
import { categoryPath } from '../utils/categories';
import { formatDateTimeLong } from '../utils/dates';
import { formatMinor, formatMoney, formatRate } from '../utils/money';
import { usdEquivalent } from '../utils/transactions';
import { latestTransfer } from '../utils/transfers';
import { useCreatedCategory } from './useCreatedCategory';
import { useCategoryRows, useTagsOfTransaction, useTransactionById, useTransferLegs } from './useData';

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
  const categories = useCategoryRows();
  const expenseCategories = useMemo(() => categories.filter((c) => c.kind === 'expense'), [categories]);
  const transferId = tx?.transferId ?? null;
  // Categoría recién creada desde el selector de esta pantalla: se asigna sola a la transferencia.
  useCreatedCategory(categories, (created) => {
    if (transferId && created.kind === 'expense') void setTransferCategory(transferId, created.id, new Date());
  });

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
      ...(path && !isTransfer ? [{ label: 'CATEGORÍA', value: path }] : []),
      ...(tx.concept.trim() ? [{ label: 'CONCEPTO', value: tx.concept.trim() }] : []),
      ...(tags.length > 0 ? [{ label: 'ETIQUETAS', value: tags.map((t) => `#${t.name}`).join(' ') }] : []),
      ...(tx.note ? [{ label: 'NOTA', value: tx.note }] : []),
    ],
    /** Solo transferencias: la categoría hace que cuenten en el presupuesto (como gasto, por la pata de salida). */
    transferCategory: isTransfer && tx.transferId
      ? {
          label: path ?? 'Sin categoría',
          hasCategory: tx.categoryId !== null,
          categories: expenseCategories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, parentId: c.parentId })),
          selectedId: tx.categoryId,
          set: (categoryId: string | null) => void setTransferCategory(tx.transferId!, categoryId, new Date()),
          openNew: () => router.push({ pathname: '/category/[id]', params: { id: 'new', kind: 'expense', pick: '1' } }),
          openNewSub: (parentId: string) => router.push({ pathname: '/category/[id]', params: { id: 'new', kind: 'expense', parentId, pick: '1' } }),
        }
      : null,
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
