import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useScopedMovements, type MovementScope } from '../../../hooks/useScopedMovements';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Card } from '../../shared/Card';
import { Icon } from '../../shared/Icon';
import { IconBadge } from '../../shared/IconBadge';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { RowMovimiento } from '../../shared/RowMovimiento';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';

/** Movimientos de una cuenta (por mes) o de una partida del presupuesto. */
export function ListaMovimientosView({ scope }: { scope: MovementScope }) {
  const vm = useScopedMovements(scope);
  const theme = useTheme();
  const [monthPicker, setMonthPicker] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[12] },
    head: { flexDirection: 'row', alignItems: 'center', gap: t.space[16] },
    texts: { flex: 1, gap: t.space[4], minWidth: 0 },
    stats: { flexDirection: 'row', gap: t.space[16], marginTop: t.space[8] },
    stat: { flex: 1, gap: t.space[4], minWidth: 0 },
    track: { height: 6, borderRadius: 3, backgroundColor: t.colors.surface2, overflow: 'hidden', marginTop: t.space[8] },
    month: { flexDirection: 'row', alignItems: 'center', gap: t.space[8], alignSelf: 'flex-start' },
    day: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: t.space[8] },
    empty: { alignItems: 'center', paddingVertical: t.space[32] },
  }));

  if (!vm.found) {
    return (
      <ScreenTemplate title="MOVIMIENTOS" left="back" onLeft={vm.close}>
        <View style={styles.empty}><AppText variant="body" color="textMuted">Esto ya no existe.</AppText></View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title="MOVIMIENTOS" left="back" onLeft={vm.close} right={{ label: 'EDITAR', onPress: vm.edit }} bottomInset>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <View style={styles.head}>
            <IconBadge icon={vm.icon} />
            <View style={styles.texts}>
              <AppText variant="heading" numberOfLines={1}>{vm.title}</AppText>
              {vm.subtitle ? <AppText variant="caption" color="textMuted" numberOfLines={1}>{vm.subtitle}</AppText> : null}
            </View>
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <AppText variant="label" color="textMuted">{vm.headlineLabel}</AppText>
              <AppText variant="amountMid" fit>{vm.headline}</AppText>
            </View>
          </View>
          {vm.stats.length > 0 ? (
            <View style={styles.stats}>
              {vm.stats.map((s) => (
                <View key={s.label} style={styles.stat}>
                  <AppText variant="label" color="textMuted">{s.label}</AppText>
                  <AppText variant="amountMid" color={s.tone === 'income' ? 'income' : 'text'} fit>{s.value}</AppText>
                </View>
              ))}
            </View>
          ) : null}
          {vm.progress ? (
            <View style={styles.track}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors[vm.progress.color], width: `${Math.round(vm.progress.value * 100)}%` }} />
            </View>
          ) : null}
          {vm.status ? <AppText variant="label" color={vm.status.color}>{vm.status.label}</AppText> : null}
        </Card>

        {vm.months ? (
          <PressableScale onPress={() => setMonthPicker(true)} style={styles.month} accessibilityLabel="Cambiar de mes">
            <AppText variant="label">{vm.monthLabel}</AppText>
            <Icon name="chevronDown" size={16} color="textMuted" />
          </PressableScale>
        ) : (
          <AppText variant="label" color="textMuted">{vm.monthLabel}</AppText>
        )}

        {vm.isEmpty ? (
          <View style={styles.empty}><AppText variant="small" color="textMuted" align="center">{vm.emptyText}</AppText></View>
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

      {vm.months ? (
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
      ) : null}
    </ScreenTemplate>
  );
}
