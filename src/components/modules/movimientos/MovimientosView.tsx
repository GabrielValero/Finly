import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useMovementsScreen } from '../../../hooks/useMovementsScreen';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { dayOf, toLocalIso } from '../../../utils/dates';
import { mix } from '../../../utils/color';
import { AppText } from '../../shared/AppText';
import { Banner } from '../../shared/Banner';
import { Button } from '../../shared/Button';
import { CalendarSheet } from '../../shared/CalendarSheet';
import { Card } from '../../shared/Card';
import { Icon } from '../../shared/Icon';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { RowMovimiento } from '../../shared/RowMovimiento';
import { SheetModal } from '../../shared/SheetModal';
import { TrendLine } from '../../shared/TrendLine';
import { ScreenTemplate } from '../../template/ScreenTemplate';
import { CalculadoraSheet } from '../calculadora/CalculadoraSheet';
import { FiltrosSheet } from './FiltrosSheet';
import { PrimerUso } from './PrimerUso';

/** Lo que tarda en cerrarse la animación de una hoja antes de abrir la siguiente. */
const MODAL_SWAP_MS = 400;

export function MovimientosView() {
  const vm = useMovementsScreen();
  const theme = useTheme();
  const [monthPicker, setMonthPicker] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  /** Rango de fechas en dos pasos (desde → hasta); la hoja de filtros se oculta mientras se elige. */
  const [rangeStep, setRangeStep] = useState<'from' | 'to' | null>(null);
  const [rangeFrom, setRangeFrom] = useState('');
  const today = dayOf(toLocalIso(new Date()));

  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: 120, gap: t.space[16] },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40 },
    month: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    round: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    right: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[8] },
    pill: { height: 28, paddingHorizontal: t.space[12], borderRadius: t.radius.full, backgroundColor: t.colors.surface2, justifyContent: 'center' },
    balance: { gap: t.space[4], marginTop: t.space[8] },
    tiles: { flexDirection: 'row', gap: t.space[12], marginTop: t.space[16] },
    tile: { flex: 1, minWidth: 0, gap: t.space[4], padding: t.space[12], borderRadius: t.radius[16], backgroundColor: t.colors.surface2 },
    bold: { fontFamily: t.font.sans.bold },
    bar: { height: 8, borderRadius: t.radius.full, backgroundColor: t.colors.surface2, overflow: 'hidden', marginTop: t.space[12] },
    barFill: { height: 8, borderRadius: t.radius.full, backgroundColor: t.colors.accent },
    barOver: { backgroundColor: t.colors.expense },
    spentRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: t.space[8] },
    quickWrap: { gap: t.space[12] },
    quickRow: { flexDirection: 'row', gap: t.space[8] },
    quick: { flex: 1, maxWidth: 96, height: 94, borderRadius: t.radius[20], backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', gap: t.space[8], padding: t.space[8] },
    quickOn: { borderColor: t.colors.accent },
    swatch: { width: 36, height: 36, borderRadius: t.radius[12], alignItems: 'center', justifyContent: 'center' },
    badge: { position: 'absolute', top: t.space[8], right: t.space[8], minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: t.radius.full, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' },
    day: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: t.space[8] },
    period: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: t.space[8], height: 34, paddingHorizontal: t.space[12], borderRadius: t.radius[12], backgroundColor: t.colors.surface2 },
    empty: { alignItems: 'center', gap: t.space[16], paddingVertical: t.space[32] },
  }));

  /** Un Modal nuevo no debe abrirse en el mismo tick que se cierra otro (iOS lo descarta): se espera a que termine la animación. */
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const after = (fn: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, MODAL_SWAP_MS);
  };
  const startRange = () => {
    setFiltersOpen(false);
    after(() => setRangeStep('from'));
  };
  const backToFilters = () => {
    after(() => setFiltersOpen(true));
  };
  const cancelRange = () => {
    setRangeStep(null);
    backToFilters();
  };

  return (
    <ScreenTemplate>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <PressableScale onPress={() => setMonthPicker(true)} style={styles.month} accessibilityLabel="Cambiar de mes">
            <AppText variant="title">{vm.monthLabel}</AppText>
            <Icon name="chevronDown" size={18} color="textMuted" />
          </PressableScale>
          <View style={styles.right}>
            <PressableScale onPress={() => setCalcOpen(true)} style={styles.round} accessibilityLabel="Calculadora de divisas">
              <Icon name="calculator" size={20} />
            </PressableScale>
            <PressableScale onPress={vm.openSettings} style={styles.round} accessibilityLabel="Ajustes">
              <Icon name="settings" size={20} />
            </PressableScale>
          </View>
        </View>

        <Card>
          <View style={styles.cardHead}>
            <AppText variant="label" color="textMuted" numberOfLines={1}>BALANCE DEL MES</AppText>
            <PressableScale onPress={vm.openRate} style={styles.pill} accessibilityLabel="Cambiar tasa">
              <AppText variant="caption">{vm.rateLabel}</AppText>
            </PressableScale>
          </View>
          <View style={styles.balance}>
            <AppText variant="balance" fit>{vm.balanceLabel}</AppText>
            {vm.balanceBsLabel ? <AppText variant="caption" color="textMuted">{vm.balanceBsLabel}</AppText> : null}
          </View>
          <TrendLine values={vm.trend} />
          <View style={styles.tiles}>
            <View style={styles.tile}>
              <AppText variant="label" color="textMuted" numberOfLines={1}>{vm.incomeTitle}</AppText>
              <AppText variant="amount" color="income" fit>{vm.incomeLabel}</AppText>
            </View>
            <View style={styles.tile}>
              <AppText variant="label" color="textMuted" numberOfLines={1}>{vm.expenseTitle}</AppText>
              <AppText variant="amount" color="expense" fit>{vm.expenseLabel}</AppText>
            </View>
          </View>
        </Card>

        {vm.banner ? <Banner text={vm.banner} action="ACTUALIZAR" onPress={vm.openRate} /> : null}

        {vm.pulse ? (
          <Card>
            <AppText variant="heading" color={vm.pulse.over ? 'expense' : 'text'}>
              {vm.pulse.lead}
              <Text style={styles.bold}>{vm.pulse.amount}</Text>
              {vm.pulse.tail}
            </AppText>
            <View style={styles.bar}>
              <View style={[styles.barFill, vm.pulse.over ? styles.barOver : null, { width: `${Math.round(vm.pulse.progress * 100)}%` }]} />
            </View>
            <View style={styles.spentRow}>
              <AppText variant="caption" color="textMuted">{vm.pulse.spentLabel}</AppText>
              <AppText variant="caption" color="textMuted">{vm.pulse.plannedLabel}</AppText>
            </View>
          </Card>
        ) : null}

        {vm.hasAccounts ? (
          <View style={styles.quickWrap}>
            <AppText variant="label" color="textMuted">FILTRAR MOVIMIENTOS</AppText>
            <View style={styles.quickRow}>
              {vm.tiles.map((c) => (
                <PressableScale key={c.categoryId} onPress={() => vm.toggleQuickCategory(c.categoryId)} style={[styles.quick, c.selected ? styles.quickOn : null]} accessibilityLabel={`Filtrar por ${c.name}`} accessibilityState={{ selected: c.selected }}>
                  <View style={[styles.swatch, { backgroundColor: c.color ? mix(theme.colors.surface, c.color, 0.18) : theme.colors.surface2 }]}>
                    <Icon name={c.icon ?? 'wallet'} size={18} tint={c.color} />
                  </View>
                  <AppText variant="small" numberOfLines={1}>{c.name}</AppText>
                </PressableScale>
              ))}
              <PressableScale onPress={() => setFiltersOpen(true)} style={[styles.quick, vm.filterBadge > 0 ? styles.quickOn : null]} accessibilityLabel="Filtros avanzados">
                <View style={[styles.swatch, { backgroundColor: theme.colors.surface2 }]}>
                  <Icon name="sliders" size={18} />
                </View>
                <AppText variant="small" numberOfLines={1}>Filtros</AppText>
                {vm.filterBadge > 0 ? (
                  <View style={styles.badge}>
                    <AppText variant="caption" color="onAccent">{vm.filterBadge}</AppText>
                  </View>
                ) : null}
              </PressableScale>
            </View>
          </View>
        ) : null}

        {vm.periodLabel ? (
          <PressableScale onPress={vm.clearPeriod} style={styles.period} accessibilityLabel={`Quitar periodo ${vm.periodLabel}`}>
            <AppText variant="small">{vm.periodLabel}</AppText>
            <Icon name="close" size={14} color="textMuted" />
          </PressableScale>
        ) : null}

        {!vm.hasAccounts ? (
          <PrimerUso onCreateAccount={vm.openNewAccount} />
        ) : vm.isEmpty ? (
          <View style={styles.empty}>
            <AppText variant="heading" align="center">{vm.hasFilters ? 'Sin movimientos con estos filtros' : 'Sin movimientos este mes'}</AppText>
            {vm.hasFilters ? (
              <Button label="Limpiar filtros" variant="outline" onPress={vm.clearFilters} />
            ) : (
              <AppText variant="small" color="textMuted" align="center">Toca + para registrar el primero.</AppText>
            )}
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

      <CalculadoraSheet visible={calcOpen} onClose={() => setCalcOpen(false)} />
      <FiltrosSheet vm={vm} visible={filtersOpen} onClose={() => setFiltersOpen(false)} onPickRange={startRange} />
      <CalendarSheet
        visible={rangeStep !== null}
        selectedDay={rangeStep === 'to' ? rangeFrom : (vm.filters.date.from ?? today)}
        onSelect={(day) => {
          if (rangeStep === 'from') {
            // Mismo Modal (CalendarSheet), solo cambia el paso: no hay que esperar.
            setRangeFrom(day);
            setRangeStep('to');
            return;
          }
          vm.setDateRange(rangeFrom, day);
          setRangeStep(null);
          backToFilters();
        }}
        onClose={cancelRange}
      />
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
