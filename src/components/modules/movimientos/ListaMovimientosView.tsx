import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useScopedMovements, type MovementScope, type ScopeCard } from '../../../hooks/useScopedMovements';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Card } from '../../shared/Card';
import { HumanLine } from '../../shared/HumanLine';
import { IconBadge } from '../../shared/IconBadge';
import { MonthPill } from '../../shared/MonthPill';
import { OptionList } from '../../shared/OptionList';
import { ProgressBar } from '../../shared/ProgressBar';
import { RowMovimiento } from '../../shared/RowMovimiento';
import { SheetModal } from '../../shared/SheetModal';
import { StatTile } from '../../shared/StatTile';
import { StatusBadge } from '../../shared/StatusBadge';
import { ScreenTemplate } from '../../template/ScreenTemplate';

function ScopeSummary({ card }: { card: ScopeCard }) {
  const styles = useThemedStyles((t) => ({
    head: { flexDirection: 'row', alignItems: 'center', gap: t.space[12] },
    texts: { flex: 1, gap: t.space[8], minWidth: 0 },
    block: { gap: t.space[4], marginTop: t.space[12] },
    human: { marginTop: t.space[12] },
    tiles: { flexDirection: 'row', gap: t.space[12], marginTop: t.space[16] },
    bar: { marginTop: t.space[12] },
  }));

  if (card.type === 'account') {
    return (
      <Card>
        <AppText variant="label" color="textMuted">{card.label}</AppText>
        <View style={styles.block}>
          <AppText variant="balance" fit>{card.headline}</AppText>
          {card.equivalent ? <AppText variant="caption" color="textMuted">{card.equivalent}</AppText> : null}
        </View>
        <View style={styles.human}><HumanLine segments={card.human} variant="bodyRegular" /></View>
        <View style={styles.tiles}>
          {card.stats.map((s) => <StatTile key={s.label} label={s.label} value={s.value} tone={s.tone} />)}
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.head}>
        <IconBadge icon={card.icon} size={48} tint={card.color} />
        <View style={styles.texts}>
          <AppText variant="label" color="textMuted" numberOfLines={1}>{card.eyebrow}</AppText>
          <StatusBadge label={card.badge.label} tone={card.badge.tone} />
        </View>
      </View>
      <View style={styles.block}>
        <AppText variant="label" color="textMuted">{card.label}</AppText>
        <AppText variant="amountMid" fit>{card.headline}</AppText>
      </View>
      <View style={styles.bar}><ProgressBar value={card.progress.value} color={card.progress.color} /></View>
      {card.human ? <View style={styles.human}><HumanLine segments={card.human} variant="bodyRegular" /></View> : null}
    </Card>
  );
}

/** Movimientos de una cuenta (por mes) o de una partida del presupuesto. */
export function ListaMovimientosView({ scope }: { scope: MovementScope }) {
  const vm = useScopedMovements(scope);
  const [monthPicker, setMonthPicker] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[16] },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    day: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: t.space[8] },
    empty: { alignItems: 'center', paddingVertical: t.space[32] },
  }));

  if (!vm.found) {
    return (
      <ScreenTemplate title="Movimientos" titleBold left="back" onLeft={vm.close}>
        <View style={styles.empty}><AppText variant="body" color="textMuted">Esto ya no existe.</AppText></View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title={vm.title} titleBold left="back" onLeft={vm.close} right={{ label: 'Editar', onPress: vm.edit }} bottomInset>
      <ScrollView contentContainerStyle={styles.scroll}>
        {vm.card ? <ScopeSummary card={vm.card} /> : null}

        <View style={styles.sectionHead}>
          <AppText variant="label" color="textMuted">MOVIMIENTOS</AppText>
          {vm.months ? (
            <MonthPill label={vm.monthLabel} onPress={() => setMonthPicker(true)} />
          ) : (
            <AppText variant="label" color="textMuted">{vm.monthLabel}</AppText>
          )}
        </View>

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
