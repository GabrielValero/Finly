import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { usePresupuestoScreen, type BudgetRowVm } from '../../../hooks/usePresupuestoScreen';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { Fab } from '../../shared/Fab';
import { Icon } from '../../shared/Icon';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { RowPresupuesto } from '../../shared/RowPresupuesto';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function PresupuestoView() {
  const vm = usePresupuestoScreen();
  const theme = useTheme();
  const [monthPicker, setMonthPicker] = useState(false);
  const styles = useThemedStyles((t) => ({
    header: { height: 56, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pill: { height: 32, paddingHorizontal: t.space[12], borderRadius: t.radius.full, backgroundColor: t.colors.surface, flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    scroll: { paddingHorizontal: t.space[16], paddingBottom: 120, gap: t.space[8] },
    summary: { gap: t.space[8] },
    track: { height: 6, borderRadius: 3, backgroundColor: t.colors.surface2, overflow: 'hidden' },
    cols: { flexDirection: 'row', paddingTop: t.space[8] },
    col: { flex: 1, gap: t.space[4], minWidth: 0, paddingRight: t.space[8] },
    section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: t.space[12] },
    empty: { alignItems: 'center', gap: t.space[12] },
  }));

  const Section = ({ title, rows, action }: { title: string; rows: BudgetRowVm[]; action?: boolean }) =>
    rows.length === 0 ? null : (
      <>
        <View style={styles.section}>
          <AppText variant="label" color="textMuted">{title}</AppText>
          {action ? (
            <PressableScale onPress={vm.copyPrevious}><AppText variant="label" color="accent">Copiar mes anterior</AppText></PressableScale>
          ) : null}
        </View>
        {rows.map((r) => (
          <RowPresupuesto key={r.id} {...r} onPress={() => vm.openItem(r.id)} />
        ))}
      </>
    );

  return (
    <ScreenTemplate>
      <View style={styles.header}>
        <AppText variant="title">Presupuesto</AppText>
        <PressableScale onPress={() => setMonthPicker(true)} style={styles.pill} accessibilityLabel="Cambiar de mes">
          <AppText variant="label">{vm.monthLabel}</AppText>
          <Icon name="chevronDown" size={16} color="textMuted" />
        </PressableScale>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {vm.isEmpty ? (
          <Card>
            <View style={styles.empty}>
              <AppText variant="heading" align="center">Aún no planificas {vm.monthLabel}</AppText>
              <AppText variant="small" color="textMuted" align="center">Define cuánto vas a gastar por categoría y sigue tu avance durante el mes. Todo en USD, sin depender de la tasa.</AppText>
              <Button label="Planificar el mes" onPress={vm.openAdd} />
              <Button label="Copiar mes anterior" variant="outline" onPress={vm.copyPrevious} />
            </View>
          </Card>
        ) : (
          <>
            <Card style={styles.summary}>
              <AppText variant="label" color="textMuted">Gastado este mes</AppText>
              <AppText variant="balance" fit>{vm.summary.spent}</AppText>
              <AppText variant="small" color="textMuted" numberOfLines={1}>de {vm.summary.planned} planificados · {vm.summary.percent} %</AppText>
              <View style={styles.track}>
                <View style={{ height: 6, borderRadius: 3, width: `${Math.round(vm.summary.progress * 100)}%`, backgroundColor: vm.summary.over ? theme.colors.expense : theme.colors.accent }} />
              </View>
              <View style={styles.cols}>
                <View style={styles.col}>
                  <AppText variant="label" color="textMuted">Ingresos plan</AppText>
                  <AppText variant="amountMid" fit>{vm.summary.plannedIncome}</AppText>
                </View>
                <View style={styles.col}>
                  <AppText variant="label" color="textMuted">{vm.summary.leftoverLabel}</AppText>
                  <AppText variant="amountMid" color={vm.summary.leftoverNegative ? 'expense' : 'income'} fit>{vm.summary.leftover}</AppText>
                </View>
              </View>
            </Card>
            {vm.unplanned ? <AppText variant="small" color="textMuted">Sin planificar este mes: {vm.unplanned} en categorías fuera del presupuesto.</AppText> : null}
            <Section title="Gastos fijos" rows={vm.fixed} action />
            <Section title="Gastos variables" rows={vm.variable} action={vm.fixed.length === 0} />
            <Section title="Ingresos" rows={vm.income} />
          </>
        )}
      </ScrollView>
      <Fab onPress={vm.openAdd} label="Planificar categoría" />
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
