import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useListDetail, type ProductRowVm } from '../../../hooks/useListDetail';
import { useListRateEditor } from '../../../hooks/useListRate';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { HumanLine } from '../../shared/HumanLine';
import { Icon } from '../../shared/Icon';
import { PressableScale } from '../../shared/PressableScale';
import { ProgressBar } from '../../shared/ProgressBar';
import { RowProducto } from '../../shared/RowProducto';
import { StatTile } from '../../shared/StatTile';
import { ScreenTemplate } from '../../template/ScreenTemplate';
import { ListRateSheet } from './ListRateSheet';
import { PurchaseSheet } from './PurchaseSheet';

export function ListaDetalleView({ id }: { id: string }) {
  const vm = useListDetail(id);
  const rateEditor = useListRateEditor(id);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[24], gap: t.space[12] },
    summary: { gap: t.space[8] },
    tiles: { flexDirection: 'row', gap: t.space[12], marginTop: t.space[4] },
    rateTile: { flex: 1, minWidth: 0, gap: t.space[4], padding: t.space[12], borderRadius: t.radius[16], backgroundColor: t.colors.surface2 },
    rateFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.space[4] },
    add: { flexDirection: 'row', alignItems: 'center', gap: t.space[12], minHeight: 52, paddingHorizontal: t.space[16], borderRadius: t.radius[16], backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
    input: { flex: 1, height: 48, color: t.colors.text, fontFamily: t.font.sans.medium, fontSize: 16, padding: 0 },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.space[8] },
    group: { gap: t.space[8] },
    rows: { paddingVertical: t.space[4], paddingHorizontal: t.space[16] },
    divider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
    footer: { paddingHorizontal: t.space[16], paddingBottom: t.space[16] + Math.max(insets.bottom, t.space[8]), paddingTop: t.space[8], gap: t.space[8] },
  }));

  if (vm.notFound) {
    return (
      <ScreenTemplate title="Lista" titleBold left="back" onLeft={vm.back}>
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
  const barTone = limit?.state === 'over' ? 'expense' : limit?.state === 'near' ? 'warning' : 'accent';
  const label = `${vm.kindLabel}${vm.categoryLabel ? ` · ${vm.categoryLabel}` : ''}`;
  const pendingInfo = [
    `${vm.pendingCount} ${vm.pendingCount === 1 ? 'producto pendiente' : 'productos pendientes'}`,
    vm.incomplete || null,
  ].filter(Boolean).join(' · ');

  const row = (r: ProductRowVm, i: number, all: readonly ProductRowVm[]) => (
    <View key={r.id} style={i < all.length - 1 ? styles.divider : null}>
      <RowProducto
        {...r}
        mode={vm.kind}
        onPress={() => vm.openItem(r.id)}
        onToggle={() => (isMarket ? vm.toggle(r.id, !r.checked) : vm.openPurchase([r.id]))}
      />
    </View>
  );
  const section = (title: string, subtotal: string | null, rows: readonly ProductRowVm[]) =>
    rows.length === 0 ? null : (
      <View style={styles.group}>
        <View style={styles.sectionHead}>
          <AppText variant="label" color="textMuted">{title} · {rows.length}</AppText>
          {subtotal ? <AppText variant="caption" color="textMuted">{subtotal}</AppText> : null}
        </View>
        <Card style={styles.rows}>{rows.map(row)}</Card>
      </View>
    );

  return (
    <ScreenTemplate title={vm.title} titleBold left="back" onLeft={vm.back} right={{ label: 'Editar', onPress: vm.edit }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card highlight style={styles.summary}>
          <AppText variant="label" color="textMuted" numberOfLines={1}>{label}</AppText>
          <AppText variant="display" fit>{vm.totalLabel}</AppText>
          {vm.totalBsLabel ? <AppText variant="amount" color="textMuted" fit>{vm.totalBsLabel}</AppText> : null}
          {isMarket && vm.limitSegments ? <HumanLine segments={vm.limitSegments} variant="bodyRegular" /> : null}
          {isMarket && limit ? <ProgressBar value={Math.min(limit.ratio, 1)} color={barTone} /> : null}
          {!isMarket && vm.wishSummary ? <HumanLine segments={vm.wishSummary} variant="bodyRegular" /> : null}
          {isMarket ? (
            <View style={styles.tiles}>
              <StatTile label="EN EL CARRITO" value={vm.cartLabel} note={vm.cartBsLabel} />
              <PressableScale onPress={rateEditor.openSheet} style={styles.rateTile} accessibilityLabel="Cambiar tasa">
                <AppText variant="label" color="textMuted">Tasa</AppText>
                <AppText variant="amount" fit>{vm.rateValue}</AppText>
                <View style={styles.rateFoot}>
                  <AppText variant="caption" color="textMuted" numberOfLines={1}>{vm.rateSource ?? '—'}</AppText>
                  <AppText variant="label" color="accent">Cambiar</AppText>
                </View>
              </PressableScale>
            </View>
          ) : (
            <PressableScale onPress={rateEditor.openSheet} accessibilityLabel="Cambiar tasa" style={styles.sectionHead}>
              <AppText variant="label" color="textMuted" numberOfLines={1}>Tasa: {vm.rateLabel}</AppText>
              <AppText variant="label" color="accent">Cambiar</AppText>
            </PressableScale>
          )}
          {vm.budgetHint ? <AppText variant="small" color="textMuted">{vm.budgetHint}</AppText> : null}
          {vm.ivaLabel ? <AppText variant="caption" color="textMuted">{vm.ivaLabel}</AppText> : null}
          {isMarket && vm.pendingCount > 0 ? <AppText variant="small" color="textMuted" numberOfLines={2}>{pendingInfo}</AppText> : null}
        </Card>

        <View style={styles.add}>
          <Icon name="plus" size={20} color="accent" />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            placeholder={isMarket ? 'Añadir producto…' : 'Añadir deseo…'}
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
        ) : isMarket ? (
          <>
            {section('EN EL CARRITO', vm.cartSection.subtotal, vm.cartSection.rows)}
            {section('PENDIENTES', vm.pendingSection.subtotal, vm.pendingSection.rows)}
            {section('COMPRADOS', null, vm.purchasedRows)}
          </>
        ) : (
          <>
            <Card style={styles.rows}>{vm.rows.map(row)}</Card>
            <AppText variant="small" color="textMuted">Cada deseo se registra como gasto cuando lo compras.</AppText>
          </>
        )}
        {vm.completed ? <Button label="Reabrir lista" variant="secondary" onPress={vm.reopen} /> : null}
        {vm.archived ? <Button label="Sacar del historial" variant="secondary" onPress={vm.unarchive} /> : null}
        {isMarket && (vm.completed || vm.archived) ? <Button label="Duplicar lista" variant="secondary" onPress={vm.duplicate} /> : null}
        {!vm.completed && !vm.archived ? <Button label="Archivar lista" variant="secondary" onPress={vm.archive} /> : null}
      </ScrollView>

      {isMarket && !vm.completed && !vm.archived ? (
        <View style={styles.footer}>
          <Button label={vm.checkedCount > 0 ? `Registrar compra (${vm.checkedCount})` : 'Registrar compra'} icon="cart" onPress={() => vm.openPurchase()} disabled={vm.pendingCount === 0} />
        </View>
      ) : null}

      <ListRateSheet editor={rateEditor} />
      <PurchaseSheet vm={vm} />
    </ScreenTemplate>
  );
}
