import { View } from 'react-native';
import { useCalendarPicker } from '../../hooks/useCalendarPicker';
import { useThemedStyles } from '../../hooks/useTheme';
import { WEEKDAY_INITIALS } from '../../utils/dates';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { SheetModal } from './SheetModal';

interface Props {
  visible: boolean;
  /** YYYY-MM-DD */
  selectedDay: string;
  onSelect: (day: string) => void;
  onClose: () => void;
}

/** Calendario en hoja inferior: toca el mes/año del encabezado para saltar rápido. */
export function CalendarSheet({ visible, selectedDay, onSelect, onClose }: Props) {
  const cal = useCalendarPicker(selectedDay, visible);
  const styles = useThemedStyles((t) => ({
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    nav: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    title: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], height: 40, paddingHorizontal: t.space[12] },
    week: { flexDirection: 'row' },
    cell: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: t.radius.full },
    cellSelected: { backgroundColor: t.colors.accent },
    cellToday: { borderWidth: 1, borderColor: t.colors.accent },
    grid: { gap: t.space[4] },
    months: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[8] },
    monthCell: { width: '23%', height: 44, borderRadius: t.radius[12], backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    foot: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: t.space[8] },
  }));

  return (
    <SheetModal visible={visible} title="FECHA" onClose={onClose}>
      <View style={styles.head}>
        <PressableScale onPress={cal.mode === 'days' ? cal.prevMonth : cal.prevYear} style={styles.nav} accessibilityLabel="Anterior">
          <Icon name="chevronLeft" size={20} />
        </PressableScale>
        <PressableScale onPress={cal.toggleMode} style={styles.title} accessibilityLabel="Elegir mes y año">
          <AppText variant="heading">{cal.mode === 'days' ? cal.title : String(cal.year)}</AppText>
          <Icon name="chevronDown" size={16} color="accent" />
        </PressableScale>
        <PressableScale onPress={cal.mode === 'days' ? cal.nextMonth : cal.nextYear} style={styles.nav} accessibilityLabel="Siguiente">
          <Icon name="chevronRight" size={20} />
        </PressableScale>
      </View>

      {cal.mode === 'months' ? (
        <View style={styles.months}>
          {cal.months.map((m) => (
            <PressableScale key={m.index} onPress={() => cal.pickMonth(m.index)} style={[styles.monthCell, m.selected ? styles.cellSelected : null]}>
              <AppText variant="body" color={m.selected ? 'onAccent' : 'text'}>{m.label}</AppText>
            </PressableScale>
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          <View style={styles.week}>
            {WEEKDAY_INITIALS.map((d, i) => (
              <View key={`${d}${i}`} style={styles.cell}><AppText variant="label" color="textMuted">{d}</AppText></View>
            ))}
          </View>
          {cal.weeks.map((week, wi) => (
            <View key={wi} style={styles.week}>
              {week.map((cell, ci) =>
                cell ? (
                  <PressableScale key={cell.day} onPress={() => onSelect(cell.day)} style={[styles.cell, cell.selected ? styles.cellSelected : cell.today ? styles.cellToday : null]} accessibilityLabel={cell.day}>
                    <AppText variant="body" color={cell.selected ? 'onAccent' : 'text'}>{cell.label}</AppText>
                  </PressableScale>
                ) : (
                  <View key={`e${ci}`} style={styles.cell} />
                ),
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.foot}>
        <PressableScale onPress={() => { onSelect(cal.today); }}><AppText variant="caption" color="accent">IR A HOY</AppText></PressableScale>
        <PressableScale onPress={onClose}><AppText variant="caption" color="textMuted">CERRAR</AppText></PressableScale>
      </View>
    </SheetModal>
  );
}
