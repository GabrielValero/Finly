import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { usePresupuestoScreen, type BudgetRowVm } from '../../../hooks/usePresupuestoScreen';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { useUi } from '../../../store/ui';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { HumanLine } from '../../shared/HumanLine';
import { IconBadge } from '../../shared/IconBadge';
import { MonthPill } from '../../shared/MonthPill';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { ProgressBar } from '../../shared/ProgressBar';
import { RowPresupuesto } from '../../shared/RowPresupuesto';
import { Segmented } from '../../shared/Segmented';
import { SheetModal } from '../../shared/SheetModal';
import { StatTile } from '../../shared/StatTile';
import { ScreenTemplate } from '../../template/ScreenTemplate';
import { ListasView } from '../listas/ListasView';

export function PresupuestoView() {
  const vm = usePresupuestoScreen();
  const theme = useTheme();
  const [monthPicker, setMonthPicker] = useState(false);
  const section = useUi((s) => s.presupuestoSection);
  const setSection = useUi((s) => s.setPresupuestoSection);
  const styles = useThemedStyles((t) => ({
    header: { height: 56, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    switch: { paddingHorizontal: t.space[16], paddingBottom: t.space[8] },
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[16] },
    human: { marginBottom: t.space[12] },
    bar: { marginTop: t.space[12] },
    barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: t.space[8] },
    tiles: { flexDirection: 'row', gap: t.space[12], marginTop: t.space[16] },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    group: { gap: t.space[8] },
    rows: { paddingVertical: t.space[4], paddingHorizontal: t.space[16] },
    divider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
    empty: { alignItems: 'center', gap: t.space[12] },
    emptyIcon: { marginBottom: t.space[4] },
  }));

  const Section = ({ title, rows, action }: { title: string; rows: BudgetRowVm[]; action?: boolean }) =>
    rows.length === 0 ? null : (
      <View style={styles.group}>
        <View style={styles.sectionHead}>
          <AppText variant="label" color="textMuted">{title}</AppText>
          {action ? (
            <PressableScale onPress={vm.copyPrevious}><AppText variant="label" color="accent">Copiar mes anterior</AppText></PressableScale>
          ) : null}
        </View>
        <Card style={styles.rows}>
          {rows.map((r, i) => (
            <View key={r.id} style={i < rows.length - 1 ? styles.divider : null}>
              <RowPresupuesto {...r} onPress={() => vm.openItem(r.id)} />
            </View>
          ))}
        </Card>
      </View>
    );

  return (
    <ScreenTemplate>
      <View style={styles.header}>
        <AppText variant="title">Presupuesto</AppText>
        {section === 'budget' ? <MonthPill label={vm.monthLabel} onPress={() => setMonthPicker(true)} /> : null}
      </View>
      <View style={styles.switch}>
        <Segmented options={[{ value: 'budget', label: 'Presupuesto' }, { value: 'lists', label: 'Listas' }]} value={section} onChange={setSection} />
      </View>
      {section === 'lists' ? <ListasView /> : null}
      {section === 'budget' ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {vm.isEmpty ? (
            <Card>
              <View style={styles.empty}>
                <View style={styles.emptyIcon}><IconBadge icon="pie" size={64} tint={theme.colors.accent} color="accent" /></View>
                <AppText variant="subtitle" align="center">Aún no planificas {vm.monthLabel}</AppText>
                <AppText variant="small" color="textMuted" align="center">Define cuánto vas a gastar por categoría y sigue tu avance durante el mes. Todo en USD, sin depender de la tasa.</AppText>
                <Button label="Planificar el mes" onPress={vm.openAdd} />
                <Button label={`Copiar ${vm.previousMonthName}`} variant="secondary" onPress={vm.copyPrevious} />
              </View>
            </Card>
          ) : (
            <>
              <Card>
                <View style={styles.human}><HumanLine segments={vm.summary.human} variant="subtitle" /></View>
                <ProgressBar value={vm.summary.progress} color={vm.summary.over ? 'expense' : 'accent'} />
                <View style={styles.barLabels}>
                  <AppText variant="caption" color="textMuted">{vm.summary.percent} % del plan</AppText>
                  {vm.summary.daysLeftLabel ? <AppText variant="caption" color="textMuted">{vm.summary.daysLeftLabel}</AppText> : null}
                </View>
                <View style={styles.tiles}>
                  <StatTile label="INGRESOS PLAN" value={vm.summary.plannedIncome} tone="income" />
                  <StatTile label={vm.summary.leftoverLabel.toUpperCase()} value={vm.summary.leftover} tone={vm.summary.leftoverNegative ? 'expense' : 'income'} />
                </View>
              </Card>
              {vm.unplanned ? <AppText variant="small" color="textMuted">Sin planificar este mes: {vm.unplanned} en categorías fuera del presupuesto.</AppText> : null}
              <Section title="GASTOS FIJOS" rows={vm.fixed} action />
              <Section title="GASTOS VARIABLES" rows={vm.variable} action={vm.fixed.length === 0} />
              <Section title="INGRESOS" rows={vm.income} />
              <Button label="Planificar categoría" icon="plus" variant="secondary" onPress={vm.openAdd} />
            </>
          )}
        </ScrollView>
      ) : null}
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
