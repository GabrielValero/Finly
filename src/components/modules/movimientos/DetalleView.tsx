import { ScrollView, View } from 'react-native';
import { useThemedStyles } from '../../../hooks/useTheme';
import { useTransactionDetail } from '../../../hooks/useTransactionDetail';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { IconBadge } from '../../shared/IconBadge';
import { RowDato } from '../../shared/RowDato';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function DetalleView({ id }: { id: string }) {
  const vm = useTransactionDetail(id);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[16] },
    hero: { alignItems: 'center', gap: t.space[8], paddingVertical: t.space[8] },
    split: { flexDirection: 'row', gap: t.space[32] },
    col: { gap: t.space[4] },
    divider: { height: 1, backgroundColor: t.colors.border, marginVertical: t.space[12] },
    actions: { flexDirection: 'row', gap: t.space[8] },
    action: { flex: 1 },
    rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  }));

  if (!vm.found) {
    return (
      <ScreenTemplate title="DETALLE" left="back" onLeft={vm.close}>
        <View style={styles.hero}><AppText variant="body" color="textMuted">Este movimiento ya no existe.</AppText></View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title="DETALLE" left="back" onLeft={vm.close} right={vm.isTransfer ? null : { label: 'EDITAR', onPress: vm.edit }} bottomInset>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <IconBadge icon={vm.icon} size={60} />
          <AppText variant="heading">{vm.title}</AppText>
          <AppText variant="display">{vm.bigAmount}</AppText>
          <AppText variant="caption" color="textMuted">{vm.dateLabel}</AppText>
        </View>

        {vm.rateCard ? (
          <Card highlight>
            <View style={styles.split}>
              <View style={styles.col}>
                <AppText variant="label" color="textMuted">{vm.rateCard.listedLabel}</AppText>
                <AppText variant="amountMid">{vm.rateCard.listed}</AppText>
              </View>
              <View style={styles.col}>
                <AppText variant="label" color="textMuted">{vm.rateCard.paidLabel}</AppText>
                <AppText variant="amountMid">{vm.rateCard.paid}</AppText>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.rateRow}>
              <AppText variant="label" color="textMuted">TASA USADA</AppText>
              <AppText variant="amount" color="accent">{vm.rateCard.rate}</AppText>
            </View>
          </Card>
        ) : null}

        <Card>
          {vm.rows.map((r, i) => (
            <RowDato key={r.label} label={r.label} value={r.value} last={i === vm.rows.length - 1} />
          ))}
        </Card>

        <View style={styles.actions}>
          {vm.isTransfer ? null : <View style={styles.action}><Button label="Duplicar" variant="outline" onPress={vm.duplicate} /></View>}
          <View style={styles.action}><Button label="Eliminar" variant="danger" onPress={vm.confirmDelete} /></View>
        </View>
      </ScrollView>
    </ScreenTemplate>
  );
}
