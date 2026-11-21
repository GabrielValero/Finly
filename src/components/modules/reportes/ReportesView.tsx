import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useReportsScreen } from '../../../hooks/useReportsScreen';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Card } from '../../shared/Card';
import { arcColor, DonutChart } from '../../shared/DonutChart';
import { HumanLine } from '../../shared/HumanLine';
import { MonthPill } from '../../shared/MonthPill';
import { OptionList } from '../../shared/OptionList';
import { SheetModal } from '../../shared/SheetModal';
import { StatTile } from '../../shared/StatTile';
import { ScreenTemplate } from '../../template/ScreenTemplate';
import { readableRoleOn } from '../../../utils/theme';

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
  const insightText = readableRoleOn(theme.colors, theme.colors.income);
  const styles = useThemedStyles((t) => ({
    header: { height: 56, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[16] },
    tiles: { flexDirection: 'row', gap: t.space[12] },
    card: { gap: t.space[12] },
    donutWrap: { alignItems: 'center', paddingVertical: t.space[4] },
    legend: { gap: t.space[8] },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    swatch: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: { flex: 1, minWidth: 0 },
    insight: { backgroundColor: t.colors.income, borderRadius: t.radius[24], padding: t.space[20], gap: t.space[4] },
    bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_HEIGHT + 24, paddingTop: t.space[8] },
    barCol: { flex: 1, alignItems: 'center', gap: t.space[4] },
    pair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: BAR_HEIGHT },
    barLegend: { flexDirection: 'row', gap: t.space[16] },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: t.space[4] },
  }));
  return (
    <ScreenTemplate>
      <View style={styles.header}>
        <AppText variant="title">Reportes</AppText>
        <MonthPill label={vm.monthLabel} onPress={() => setMonthPicker(true)} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <HumanLine segments={vm.headline} variant="subtitle" />
        <View style={styles.tiles}>
          <StatTile label="INGRESOS" value={vm.income} tone="income" />
          <StatTile label="BALANCE" value={vm.net} tone={vm.netPositive ? 'income' : 'expense'} />
        </View>
        {vm.unvalued > 0 ? <AppText variant="small" color="warning">{vm.unvalued} movimiento(s) en Bs sin tasa no se pudieron valorar.</AppText> : null}

        {vm.isEmpty ? (
          <AppText variant="small" color="textMuted">No hay movimientos en {vm.monthLabel}. Cambia de mes o registra el primero.</AppText>
        ) : null}

        {vm.donut.arcs.length > 0 ? (
          <Card style={styles.card}>
            <AppText variant="label" color="textMuted">GASTO POR CATEGORÍA</AppText>
            <View style={styles.donutWrap}>
              <DonutChart arcs={vm.donut.arcs} centerLabel="GASTADO" centerValue={vm.donut.total} />
            </View>
            <View style={styles.legend}>
              {vm.donut.arcs.map((a) => (
                <View key={a.key} style={styles.legendRow}>
                  <View style={[styles.swatch, { backgroundColor: arcColor(theme, a) }]} />
                  <View style={styles.legendLabel}><AppText variant="bodyRegular" numberOfLines={1}>{a.label}</AppText></View>
                  <AppText variant="caption" color="textMuted">{a.percent}</AppText>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {vm.insight ? (
          <View style={styles.insight}>
            <AppText variant="subtitle" color={insightText}>{vm.insight.title}</AppText>
            <AppText variant="bodyRegular" color={insightText}>{vm.insight.detail}</AppText>
          </View>
        ) : null}

        <Card style={styles.card}>
          <AppText variant="label" color="textMuted">INGRESOS Y GASTOS · ÚLTIMOS 6 MESES</AppText>
          <View style={styles.bars}>
            {vm.flow.map((f) => (
              <View key={f.month} style={styles.barCol} accessible accessibilityLabel={`${f.fullLabel}: ingresos ${f.incomeLabel}, gastos ${f.expenseLabel}`}>
                <View style={styles.pair}>
                  <View style={{ width: 12, height: Math.max(2, Math.round(f.incomeRatio * BAR_HEIGHT)), borderRadius: 3, backgroundColor: theme.colors.income, opacity: f.selected ? 1 : 0.4 }} />
                  <View style={{ width: 12, height: Math.max(2, Math.round(f.expenseRatio * BAR_HEIGHT)), borderRadius: 3, backgroundColor: theme.colors.expense, opacity: f.selected ? 1 : 0.4 }} />
                </View>
                <AppText variant="caption" color={f.selected ? 'text' : 'textMuted'}>{f.label}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.barLegend}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: theme.colors.income }]} /><AppText variant="caption" color="textMuted">Ingresos</AppText></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: theme.colors.expense }]} /><AppText variant="caption" color="textMuted">Gastos</AppText></View>
          </View>
        </Card>

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
