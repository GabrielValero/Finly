import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useReportsScreen } from '../../../hooks/useReportsScreen';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Card } from '../../shared/Card';
import { Icon } from '../../shared/Icon';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';

const BAR_HEIGHT = 96;

function SliceList({ title, hint, slices }: { title: string; hint?: string; slices: { key: string; label: string; amount: string; percent: number; share: number }[] }) {
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    block: { gap: t.space[12] },
    item: { gap: t.space[4] },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.space[8] },
    label: { flex: 1, minWidth: 0 },
    track: { height: 6, borderRadius: 3, backgroundColor: t.colors.surface2, overflow: 'hidden' },
  }));
  if (slices.length === 0) return null;
  return (
    <Card style={styles.block}>
      <AppText variant="label" color="textMuted">{title}</AppText>
      {slices.map((s) => (
        <View key={s.key} style={styles.item}>
          <View style={styles.row}>
            <View style={styles.label}><AppText variant="body" numberOfLines={1}>{s.label}</AppText></View>
            <AppText variant="amountMid">{s.amount}</AppText>
            <AppText variant="caption" color="textMuted">{s.percent} %</AppText>
          </View>
          <View style={styles.track}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors.accent, width: `${Math.max(2, Math.round(s.share * 100))}%` }} />
          </View>
        </View>
      ))}
      {hint ? <AppText variant="small" color="textMuted">{hint}</AppText> : null}
    </Card>
  );
}

export function ReportesView() {
  const vm = useReportsScreen();
  const theme = useTheme();
  const [monthPicker, setMonthPicker] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[12] },
    pill: { alignSelf: 'flex-start', height: 32, paddingHorizontal: t.space[12], borderRadius: t.radius.full, backgroundColor: t.colors.surface, flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    cols: { flexDirection: 'row', paddingTop: t.space[8] },
    col: { flex: 1, gap: t.space[4], minWidth: 0, paddingRight: t.space[8] },
    card: { gap: t.space[8] },
    bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_HEIGHT + 24, paddingTop: t.space[8] },
    barCol: { flex: 1, alignItems: 'center', gap: t.space[4] },
    pair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: BAR_HEIGHT },
    legend: { flexDirection: 'row', gap: t.space[16] },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: t.space[4] },
  }));
  return (
    <ScreenTemplate title="REPORTES" left="back" onLeft={vm.back} bottomInset>
      <ScrollView contentContainerStyle={styles.scroll}>
        <PressableScale onPress={() => setMonthPicker(true)} style={styles.pill} accessibilityLabel="Cambiar de mes">
          <AppText variant="label">{vm.monthLabel}</AppText>
          <Icon name="chevronDown" size={16} color="textMuted" />
        </PressableScale>

        <Card highlight style={styles.card}>
          <AppText variant="label" color="textMuted">Gastado en el mes</AppText>
          <AppText variant="display" fit>{vm.expense}</AppText>
          {vm.spendDeltaLabel ? <AppText variant="small" color={vm.spendDeltaUp ? 'expense' : 'income'}>{vm.spendDeltaLabel}</AppText> : null}
          <View style={styles.cols}>
            <View style={styles.col}>
              <AppText variant="label" color="textMuted">Ingresos</AppText>
              <AppText variant="amountMid" color="income" fit>{vm.income}</AppText>
            </View>
            <View style={styles.col}>
              <AppText variant="label" color="textMuted">Balance del mes</AppText>
              <AppText variant="amountMid" color={vm.netPositive ? 'income' : 'expense'} fit>{vm.net}</AppText>
            </View>
          </View>
          {vm.unvalued > 0 ? <AppText variant="small" color="warning">{vm.unvalued} movimiento(s) en Bs sin tasa no se pudieron valorar.</AppText> : null}
        </Card>

        {vm.isEmpty ? (
          <AppText variant="small" color="textMuted">No hay movimientos en {vm.monthLabel}. Cambia de mes o registra el primero.</AppText>
        ) : null}

        <Card style={styles.card}>
          <AppText variant="label" color="textMuted">Ingresos vs gastos · últimos 6 meses</AppText>
          <View style={styles.bars}>
            {vm.flow.map((f) => (
              <View key={f.month} style={styles.barCol}>
                <View style={styles.pair}>
                  <View style={{ width: 12, height: Math.max(2, Math.round(f.incomeRatio * BAR_HEIGHT)), borderRadius: 3, backgroundColor: theme.colors.income, opacity: f.selected ? 1 : 0.55 }} />
                  <View style={{ width: 12, height: Math.max(2, Math.round(f.expenseRatio * BAR_HEIGHT)), borderRadius: 3, backgroundColor: theme.colors.expense, opacity: f.selected ? 1 : 0.55 }} />
                </View>
                <AppText variant="caption" color={f.selected ? 'text' : 'textMuted'}>{f.label}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: theme.colors.income }]} /><AppText variant="caption" color="textMuted">Ingresos</AppText></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: theme.colors.expense }]} /><AppText variant="caption" color="textMuted">Gastos</AppText></View>
          </View>
        </Card>

        <SliceList title="Gasto por categoría" slices={vm.categories} />
        <SliceList title="Gasto por etiqueta" hint="Un movimiento con varias etiquetas cuenta en cada una; por eso no suma el total." slices={vm.tags} />
        <AppText variant="small" color="textMuted">Todo en USD con la tasa de cada movimiento. No incluye transferencias ni categorías marcadas «no cuenta en reportes».</AppText>
      </ScrollView>
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
