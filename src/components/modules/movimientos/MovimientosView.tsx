import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useMovementsScreen } from '../../../hooks/useMovementsScreen';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Banner } from '../../shared/Banner';
import { Card } from '../../shared/Card';
import { Fab } from '../../shared/Fab';
import { Icon } from '../../shared/Icon';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { RowMovimiento } from '../../shared/RowMovimiento';
import { SheetModal } from '../../shared/SheetModal';
import { Button } from '../../shared/Button';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function MovimientosView() {
  const vm = useMovementsScreen();
  const [monthPicker, setMonthPicker] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: 120, gap: t.space[12] },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 36 },
    month: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    pill: { height: 28, paddingHorizontal: t.space[12], borderRadius: t.radius.full, backgroundColor: t.colors.surface, justifyContent: 'center' },
    balance: { gap: t.space[8] },
    divider: { height: 1, backgroundColor: t.colors.border, marginVertical: t.space[8] },
    summary: { flexDirection: 'row' },
    summaryCol: { flex: 1, gap: t.space[4], minWidth: 0, paddingRight: t.space[8] },
    day: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: t.space[8] },
    empty: { alignItems: 'center', gap: t.space[16], paddingVertical: t.space[32] },
  }));

  return (
    <ScreenTemplate>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <PressableScale onPress={() => setMonthPicker(true)} style={styles.month} accessibilityLabel="Cambiar de mes">
            <AppText variant="label">{vm.monthLabel}</AppText>
            <Icon name="chevronDown" size={16} color="textMuted" />
          </PressableScale>
          <PressableScale onPress={vm.openRate} style={styles.pill} accessibilityLabel="Cambiar tasa">
            <AppText variant="caption">{vm.rateLabel}</AppText>
          </PressableScale>
        </View>

        <Card>
          <View style={styles.balance}>
            <AppText variant="label" color="textMuted">Balance total</AppText>
            <AppText variant="balance" fit>{vm.balanceLabel}</AppText>
            {vm.balanceNote ? <AppText variant="small" color="warning">{vm.balanceNote}</AppText> : null}
            {vm.deltaLabel ? <AppText variant="small" color={vm.deltaPositive ? 'income' : 'expense'}>{vm.deltaLabel}</AppText> : null}
          </View>
          <View style={styles.divider} />
          <View style={styles.summary}>
            <View style={styles.summaryCol}>
              <AppText variant="label" color="textMuted">Gastos</AppText>
              <AppText variant="amountMid" fit>{vm.expenseLabel}</AppText>
            </View>
            <View style={styles.summaryCol}>
              <AppText variant="label" color="textMuted">Ingresos</AppText>
              <AppText variant="amountMid" color="income" fit>{vm.incomeLabel}</AppText>
            </View>
          </View>
        </Card>

        {vm.banner ? <Banner text={vm.banner} action="ACTUALIZAR" onPress={vm.openRate} /> : null}

        {!vm.hasAccounts ? (
          <View style={styles.empty}>
            <AppText variant="heading" align="center">Empieza creando tu primera cuenta</AppText>
            <AppText variant="small" color="textMuted" align="center">Efectivo, banco, Binance… cada una en su moneda.</AppText>
            <Button label="Crear cuenta" onPress={vm.openNewAccount} />
          </View>
        ) : vm.isEmpty ? (
          <View style={styles.empty}>
            <AppText variant="heading" align="center">Sin movimientos este mes</AppText>
            <AppText variant="small" color="textMuted" align="center">Toca + para registrar el primero.</AppText>
          </View>
        ) : (
          vm.groups.map((g) => (
            <View key={g.day}>
              <View style={styles.day}>
                <AppText variant="label" color="textMuted">{g.label}</AppText>
                <AppText variant="caption" color="textMuted">{g.total}</AppText>
              </View>
              {g.rows.map((r) => (
                <RowMovimiento key={r.id} {...r} onPress={() => vm.openDetail(r.id)} />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {vm.hasAccounts ? <Fab onPress={vm.openCapture} /> : null}

      <SheetModal visible={monthPicker} title="MES" onClose={() => setMonthPicker(false)}>
        <OptionList
          options={vm.months}
          selected={vm.selectedMonth}
          onSelect={(m) => {
            vm.setMonth(m);
            setMonthPicker(false);
          }}
        />
      </SheetModal>
    </ScreenTemplate>
  );
}
