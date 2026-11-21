import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useThemedStyles } from '../../../hooks/useTheme';
import { useTransactionDetail } from '../../../hooks/useTransactionDetail';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { Chip } from '../../shared/Chip';
import { CategoryPickerModal } from '../../shared/CategoryPickerModal';
import { IconBadge } from '../../shared/IconBadge';
import { RowDato } from '../../shared/RowDato';
import { SelectRow } from '../../shared/SelectRow';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function DetalleView({ id }: { id: string }) {
  const vm = useTransactionDetail(id);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[16] },
    hero: { alignItems: 'center', gap: t.space[8], paddingVertical: t.space[8] },
    split: { flexDirection: 'row', gap: t.space[12] },
    tile: { flex: 1, minWidth: 0, gap: t.space[4], backgroundColor: t.colors.surface2, borderRadius: t.radius[16], padding: t.space[12] },
    chipRow: { paddingVertical: t.space[12], gap: t.space[8], borderBottomWidth: 1, borderBottomColor: t.colors.border },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[8] },
    actions: { flexDirection: 'row', gap: t.space[8] },
    action: { flex: 1 },
    rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: t.space[12] },
  }));

  if (!vm.found) {
    return (
      <ScreenTemplate left="back" onLeft={vm.close}>
        <View style={styles.hero}><AppText variant="body" color="textMuted">Este movimiento ya no existe.</AppText></View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate left="back" onLeft={vm.close} right={vm.isTransfer ? null : { label: 'Editar', onPress: vm.edit }} bottomInset>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <IconBadge icon={vm.icon} size={56} tint={vm.color} />
          <AppText variant="subtitle" align="center" numberOfLines={2}>{vm.title}</AppText>
          <AppText variant="display" color={vm.amountColor} fit>{vm.bigAmount}</AppText>
          <AppText variant="caption" color="textMuted">{vm.dateLabel}</AppText>
        </View>

        {vm.rateCard ? (
          <Card>
            <View style={styles.split}>
              <View style={styles.tile}>
                <AppText variant="label" color="textMuted">{vm.rateCard.listedLabel}</AppText>
                <AppText variant="amountMid" fit>{vm.rateCard.listed}</AppText>
              </View>
              <View style={styles.tile}>
                <AppText variant="label" color="textMuted">{vm.rateCard.paidLabel}</AppText>
                <AppText variant="amountMid" fit>{vm.rateCard.paid}</AppText>
              </View>
            </View>
            <View style={styles.rateRow}>
              <AppText variant="label" color="textMuted">TASA USADA</AppText>
              <AppText variant="amount" color="accent" numberOfLines={1}>{vm.rateCard.rate}</AppText>
            </View>
          </Card>
        ) : null}

        <Card>
          {vm.rows.map((r, i) =>
            r.chips ? (
              <View key={r.label} style={[styles.chipRow, i === vm.rows.length - 1 ? { borderBottomWidth: 0 } : null]}>
                <AppText variant="label" color="textMuted">{r.label}</AppText>
                <View style={styles.chips}>
                  {r.chips.map((c) => <Chip key={c} shape="tile" label={c} onPress={() => undefined} />)}
                </View>
              </View>
            ) : (
              <RowDato key={r.label} label={r.label} value={r.value} last={i === vm.rows.length - 1} />
            ),
          )}
        </Card>

        {vm.transferCategory ? (
          <>
            <SelectRow label="CATEGORÍA" value={vm.transferCategory.label} onPress={() => setCategoryOpen(true)} />
            <AppText variant="small" color="textMuted">Con categoría, esta transferencia cuenta como gasto en el presupuesto (una sola vez).</AppText>
          </>
        ) : null}

        <View style={styles.actions}>
          {vm.isTransfer ? null : <View style={styles.action}><Button label="Duplicar" variant="secondary" icon="copy" onPress={vm.duplicate} /></View>}
          <View style={styles.action}><Button label="Eliminar" variant="dangerTint" onPress={vm.confirmDelete} /></View>
        </View>
      </ScrollView>
      {vm.transferCategory ? (
        <CategoryPickerModal
          visible={categoryOpen}
          categories={vm.transferCategory.categories}
          selectedId={vm.transferCategory.selectedId}
          onSelect={(c) => {
            vm.transferCategory?.set(c);
            setCategoryOpen(false);
          }}
          onClear={() => {
            vm.transferCategory?.set(null);
            setCategoryOpen(false);
          }}
          onClose={() => setCategoryOpen(false)}
          onNew={() => {
            setCategoryOpen(false);
            vm.transferCategory?.openNew();
          }}
          onNewSub={(parentId) => {
            setCategoryOpen(false);
            vm.transferCategory?.openNewSub(parentId);
          }}
        />
      ) : null}
    </ScreenTemplate>
  );
}
