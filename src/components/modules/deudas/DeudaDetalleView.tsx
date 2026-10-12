import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebtDetail } from '../../../hooks/useDebtDetail';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { Keypad } from '../../shared/Keypad';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { SettingsRow } from '../../shared/SettingsRow';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function DeudaDetalleView({ id }: { id: string }) {
  const vm = useDebtDetail(id);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[24], gap: t.space[12] },
    summary: { gap: t.space[8] },
    cols: { flexDirection: 'row', gap: t.space[8] },
    col: { flex: 1, minWidth: 0, gap: t.space[4] },
    track: { height: 6, borderRadius: 3, backgroundColor: t.colors.surface2, overflow: 'hidden' },
    list: { paddingVertical: 0, paddingHorizontal: t.space[16] },
    payment: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: t.space[12], gap: t.space[12] },
    footer: { paddingHorizontal: t.space[16], paddingBottom: Math.max(insets.bottom, 8) + t.space[8], paddingTop: t.space[8] },
    quick: { alignItems: 'center', paddingVertical: t.space[4] },
  }));

  if (vm.notFound) {
    return (
      <ScreenTemplate title="DEUDA" left="back" onLeft={vm.back}>
        <View style={styles.scroll}><AppText variant="small" color="textMuted">Esta deuda ya no existe.</AppText></View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title={vm.directionLabel.toUpperCase()} left="back" onLeft={vm.back} right={{ label: 'Editar', onPress: vm.edit }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card highlight style={styles.summary}>
          <AppText variant="label" color="textMuted">{vm.person}</AppText>
          <AppText variant="display" fit>{vm.isSettled ? 'Saldada' : vm.remaining}</AppText>
          {vm.usdNote && !vm.isSettled ? <AppText variant="amountMid" color="textMuted" fit>{vm.usdNote}</AppText> : null}
          <View style={styles.track}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: vm.isSettled ? theme.colors.income : theme.colors.accent, width: `${Math.round(Math.min(vm.progress, 1) * 100)}%` }} />
          </View>
          <View style={styles.cols}>
            <View style={styles.col}>
              <AppText variant="label" color="textMuted">Monto original</AppText>
              <AppText variant="body" fit>{vm.principal}</AppText>
            </View>
            <View style={styles.col}>
              <AppText variant="label" color="textMuted">Pagado</AppText>
              <AppText variant="body" fit>{vm.paid}</AppText>
            </View>
          </View>
          <AppText variant="small" color="textMuted">{vm.openedLabel}</AppText>
          {vm.dueLabel ? <AppText variant="small" color={vm.status === 'overdue' ? 'expense' : 'textMuted'}>{vm.dueLabel}</AppText> : null}
          {vm.note ? <AppText variant="small">{vm.note}</AppText> : null}
          {vm.devaluationNote ? <AppText variant="small" color="textMuted">{vm.devaluationNote}</AppText> : null}
        </Card>

        <AppText variant="label" color="textMuted">Pagos</AppText>
        {vm.payments.length === 0 ? (
          <AppText variant="small" color="textMuted">Aún no hay pagos registrados.</AppText>
        ) : (
          <Card style={styles.list}>
            {vm.payments.map((p) => (
              <View key={p.id} style={styles.payment}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="body">{p.amount}</AppText>
                  <AppText variant="caption" color="textMuted">{p.date}{p.linked ? ' · en cuenta' : ''}</AppText>
                </View>
                <PressableScale onPress={() => vm.confirmDeletePayment(p.id)} accessibilityLabel="Quitar pago">
                  <AppText variant="label" color="expense">Quitar</AppText>
                </PressableScale>
              </View>
            ))}
          </Card>
        )}
        <Card style={styles.list}><SettingsRow label="Eliminar deuda" danger onPress={vm.confirmDeleteDebt} last /></Card>
      </ScrollView>

      {!vm.isSettled ? (
        <View style={styles.footer}><Button label="Registrar pago" onPress={vm.openPayment} /></View>
      ) : null}

      <SheetModal visible={vm.sheet} title="REGISTRAR PAGO" onClose={vm.closeSheet}>
        <AppText variant="display" align="center" fit>{vm.amount.minor > 0 ? vm.amountLabel : vm.amount.display}</AppText>
        <PressableScale onPress={vm.payAll} style={styles.quick} accessibilityLabel="Pagar todo">
          <AppText variant="label" color="accent">Pagar todo ({vm.remaining})</AppText>
        </PressableScale>
        <Keypad onKey={vm.amount.press} />
        <AppText variant="label" color="textMuted">Registrar también en una cuenta (opcional)</AppText>
        <View style={{ maxHeight: 150 }}>
          <OptionList options={vm.movement.options} selected={vm.movement.accountId ?? 'none'} onSelect={(v) => vm.movement.setAccountId(v === 'none' ? null : v)} />
        </View>
        {vm.paymentError ? <AppText variant="small" color="expense">{vm.paymentError}</AppText> : null}
        <Button label="Guardar pago" onPress={() => void vm.confirmPayment()} disabled={vm.amount.minor <= 0 || vm.saving} />
      </SheetModal>
    </ScreenTemplate>
  );
}
