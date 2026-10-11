import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useListDetail } from '../../../hooks/useListDetail';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { RowProducto } from '../../shared/RowProducto';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function ListaDetalleView({ id }: { id: string }) {
  const vm = useListDetail(id);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[24], gap: t.space[12] },
    summary: { gap: t.space[8] },
    cols: { flexDirection: 'row', gap: t.space[8] },
    col: { flex: 1, gap: t.space[4], minWidth: 0 },
    track: { height: 6, borderRadius: 3, backgroundColor: t.colors.surface2, overflow: 'hidden' },
    add: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    input: { flex: 1, height: 48, borderRadius: t.radius[16], backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.space[16], color: t.colors.text, fontFamily: t.font.sans.medium, fontSize: 16 },
    list: { paddingVertical: 0, paddingHorizontal: t.space[16] },
    footer: { paddingHorizontal: t.space[16], paddingBottom: t.space[16] + insets.bottom, paddingTop: t.space[8], gap: t.space[8] },
    sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.space[12] },
    flex: { flex: 1, minWidth: 0 },
  }));

  if (vm.notFound) {
    return (
      <ScreenTemplate title="LISTA" left="back" onLeft={vm.back}>
        <View style={styles.scroll}><AppText variant="small" color="textMuted">Esta lista ya no existe.</AppText></View>
      </ScreenTemplate>
    );
  }

  const submit = () => {
    vm.quickAdd(draft);
    setDraft('');
  };
  const isMarket = vm.kind === 'market';
  const limit = vm.limit;
  const barColor = limit?.state === 'over' ? theme.colors.expense : limit?.state === 'near' ? theme.colors.accent : theme.colors.income;

  return (
    <ScreenTemplate title={vm.title} left="back" onLeft={vm.back} right={{ label: 'Editar', onPress: vm.edit }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card highlight style={styles.summary}>
          <AppText variant="label" color="textMuted">{vm.kindLabel}{vm.categoryLabel ? ` · ${vm.categoryLabel}` : ''}</AppText>
          <AppText variant="display" fit>{vm.totalLabel}</AppText>
          <AppText variant="small" color="textMuted" numberOfLines={2}>
            {vm.pendingCount} {vm.pendingCount === 1 ? 'producto pendiente' : 'productos pendientes'}{vm.incomplete ? ` · ${vm.incomplete}` : ''}
          </AppText>
          {limit ? (
            <>
              <View style={styles.track}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: barColor, width: `${Math.round(Math.min(limit.ratio, 1) * 100)}%` }} />
              </View>
              <AppText variant="label" color={limit.state === 'over' ? 'expense' : 'textMuted'}>
                {limit.state === 'over' ? `Te pasas ${limit.remaining} del límite de ${limit.label}` : `Te quedan ${limit.remaining} de ${limit.label}`}
              </AppText>
            </>
          ) : null}
          {isMarket ? (
            <View style={styles.cols}>
              <View style={styles.col}>
                <AppText variant="label" color="textMuted">En el carrito</AppText>
                <AppText variant="amountMid" fit>{vm.cartLabel}</AppText>
              </View>
              <View style={styles.col}>
                <AppText variant="label" color="textMuted">Tasa</AppText>
                <AppText variant="small" numberOfLines={1}>{vm.rateLabel}</AppText>
              </View>
            </View>
          ) : (
            <AppText variant="small" color="textMuted">Tasa: {vm.rateLabel}</AppText>
          )}
          {vm.budgetHint ? <AppText variant="small" color="textMuted">{vm.budgetHint}</AppText> : null}
        </Card>

        <View style={styles.add}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            placeholder="Añadir producto…"
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="done"
            blurOnSubmit={false}
            style={styles.input}
          />
          <PressableScale onPress={vm.addItem} accessibilityLabel="Producto con detalles">
            <AppText variant="label" color="accent">Detalles</AppText>
          </PressableScale>
        </View>

        {vm.rows.length === 0 ? (
          <AppText variant="small" color="textMuted">Escribe el nombre y pulsa intro. Luego toca el producto para ponerle precio, cantidad o categoría.</AppText>
        ) : (
          <Card style={styles.list}>
            {vm.rows.map((r) => (
              <RowProducto
                key={r.id}
                {...r}
                mode={vm.kind}
                onPress={() => vm.openItem(r.id)}
                onToggle={() => (isMarket ? vm.toggle(r.id, !r.checked) : vm.openPurchase([r.id]))}
              />
            ))}
          </Card>
        )}
        {vm.completed ? <Button label="Reabrir lista" variant="outline" onPress={vm.reopen} /> : null}
      </ScrollView>

      {isMarket && !vm.completed ? (
        <View style={styles.footer}>
          <Button label={vm.checkedCount > 0 ? `Registrar compra (${vm.checkedCount})` : 'Registrar compra'} onPress={() => vm.openPurchase()} disabled={vm.pendingCount === 0} />
        </View>
      ) : null}

      <SheetModal visible={vm.purchaseOpen} title="REGISTRAR COMPRA" onClose={vm.closePurchase}>
        {vm.purchase ? (
          <>
            <AppText variant="label" color="textMuted">Pagar desde</AppText>
            <View style={{ maxHeight: 180 }}>
              <OptionList options={vm.accountOptions} selected={vm.accountId} onSelect={vm.setAccountId} />
            </View>
            {vm.purchase.groups.map((g) => (
              <View key={g.key} style={styles.sheetRow}>
                <View style={styles.flex}>
                  <AppText variant="body" numberOfLines={1}>{g.label}</AppText>
                  <AppText variant="caption" color="textMuted">{g.count} {g.count === 1 ? 'producto' : 'productos'}</AppText>
                </View>
                <AppText variant="amountMid">{g.amount}</AppText>
              </View>
            ))}
            <View style={styles.sheetRow}>
              <AppText variant="label" color="textMuted">Total</AppText>
              <AppText variant="heading">{vm.purchase.totalLabel}</AppText>
            </View>
            {vm.purchase.inBs ? <AppText variant="small" color="textMuted">Saldrán {vm.purchase.inBs} de la cuenta, a la tasa {vm.rateLabel}.</AppText> : null}
            {vm.purchase.warnings.map((w) => (
              <AppText key={w} variant="small" color="expense">{w}</AppText>
            ))}
            {vm.purchaseError ? <AppText variant="small" color="expense">{vm.purchaseError}</AppText> : null}
            <Button label="Registrar gasto" onPress={() => void vm.confirmPurchase()} disabled={vm.purchase.blocked || vm.purchaseSaving} />
          </>
        ) : null}
      </SheetModal>
    </ScreenTemplate>
  );
}
