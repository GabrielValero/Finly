import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useHomeMenu } from '../../../hooks/useHomeMenu';
import { useMovementsScreen } from '../../../hooks/useMovementsScreen';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Banner } from '../../shared/Banner';
import { Card } from '../../shared/Card';
import { Chip } from '../../shared/Chip';
import { Fab } from '../../shared/Fab';
import { Icon } from '../../shared/Icon';
import { MenuDrawer } from '../../shared/MenuDrawer';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { RowMovimiento } from '../../shared/RowMovimiento';
import { SheetModal } from '../../shared/SheetModal';
import { Button } from '../../shared/Button';
import { CalculadoraSheet } from '../calculadora/CalculadoraSheet';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function MovimientosView() {
  const vm = useMovementsScreen();
  const [monthPicker, setMonthPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const menu = useHomeMenu();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: 120, gap: t.space[12] },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 36 },
    left: { flexDirection: 'row', alignItems: 'center', gap: t.space[12] },
    month: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    hamburger: { width: 36, height: 36, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    right: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    pill: { height: 28, paddingHorizontal: t.space[12], borderRadius: t.radius.full, backgroundColor: t.colors.surface, justifyContent: 'center' },
    balance: { gap: t.space[8] },
    divider: { height: 1, backgroundColor: t.colors.border, marginVertical: t.space[8] },
    chips: { flexDirection: 'row', gap: t.space[8], paddingRight: t.space[16] },
    summary: { flexDirection: 'row' },
    summaryCol: { flex: 1, gap: t.space[4], minWidth: 0, paddingRight: t.space[8] },
    day: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: t.space[8] },
    empty: { alignItems: 'center', gap: t.space[16], paddingVertical: t.space[32] },
  }));

  return (
    <ScreenTemplate>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.left}>
            <PressableScale onPress={() => setMenuOpen(true)} style={styles.hamburger} accessibilityLabel="Abrir menú">
              <Icon name="menu" size={20} />
            </PressableScale>
            <PressableScale onPress={() => setMonthPicker(true)} style={styles.month} accessibilityLabel="Cambiar de mes">
              <AppText variant="label">{vm.monthLabel}</AppText>
              <Icon name="chevronDown" size={16} color="textMuted" />
            </PressableScale>
          </View>
          <View style={styles.right}>
            <PressableScale onPress={vm.openRate} style={styles.pill} accessibilityLabel="Cambiar tasa">
              <AppText variant="caption">{vm.rateLabel}</AppText>
            </PressableScale>
            <PressableScale onPress={() => setCalcOpen(true)} style={styles.hamburger} accessibilityLabel="Calculadora de divisas">
              <Icon name="calculator" size={20} />
            </PressableScale>
          </View>
        </View>

        <Card>
          <View style={styles.balance}>
            <AppText variant="label" color="textMuted" numberOfLines={1}>{vm.balanceTitle}</AppText>
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

        {vm.accountChips.length > 2 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {vm.accountChips.map((c) => (
              <Chip key={c.id ?? 'all'} label={c.name} selected={c.id === vm.accountFilter} onPress={() => vm.setAccountFilter(c.id)} />
            ))}
          </ScrollView>
        ) : null}

        {vm.tagChips.length > 1 || vm.tagFilter ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {vm.tagChips.map((c) => (
              <Chip key={c.id ?? 'all-tags'} label={c.id === null ? 'Todas las etiquetas' : `#${c.name} · ${c.count}`} selected={c.id === vm.tagFilter} onPress={() => vm.setTagFilter(c.id)} />
            ))}
          </ScrollView>
        ) : null}

        {vm.banner ? <Banner text={vm.banner} action="ACTUALIZAR" onPress={vm.openRate} /> : null}

        {!vm.hasAccounts ? (
          <View style={styles.empty}>
            <AppText variant="heading" align="center">Empieza creando tu primera cuenta</AppText>
            <AppText variant="small" color="textMuted" align="center">Efectivo, banco, Binance… cada una en su moneda.</AppText>
            <Button label="Crear cuenta" onPress={vm.openNewAccount} />
          </View>
        ) : vm.isEmpty ? (
          <View style={styles.empty}>
            <AppText variant="heading" align="center">
              {vm.tagFilterName ? `Sin movimientos con #${vm.tagFilterName} este mes` : vm.filterName ? `Sin movimientos de ${vm.filterName} este mes` : 'Sin movimientos este mes'}
            </AppText>
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

      <MenuDrawer visible={menuOpen} items={menu} onClose={() => setMenuOpen(false)} />
      <CalculadoraSheet visible={calcOpen} onClose={() => setCalcOpen(false)} />
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
