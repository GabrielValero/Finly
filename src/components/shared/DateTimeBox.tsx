import { useState } from 'react';
import { View } from 'react-native';
import type { useMovementDetails } from '../../hooks/useMovementDetails';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { CalendarSheet } from './CalendarSheet';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { TimePickerSheet } from './TimePickerSheet';

/** Fecha (con días ±1 y calendario) y hora (selector táctil) de un movimiento. */
export function DateTimeBox({ details }: { details: ReturnType<typeof useMovementDetails> }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const styles = useThemedStyles((t) => ({
    box: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, padding: t.space[16], gap: t.space[12] },
    stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.space[8], height: 40, paddingHorizontal: t.space[8] },
    step: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  }));
  const [datePart = '', timePart = ''] = details.dateLabel.split(' · ');
  return (
    <View style={styles.box}>
      <AppText variant="label" color="textMuted">FECHA Y HORA</AppText>
      <View style={styles.stepper}>
        <PressableScale onPress={() => details.shiftDate(-1)} style={styles.step} accessibilityLabel="Día anterior"><Icon name="chevronLeft" size={20} /></PressableScale>
        <PressableScale onPress={() => setCalendarOpen(true)} style={styles.dateBtn} accessibilityLabel="Abrir calendario">
          <Icon name="calendar" size={18} color="accent" />
          <AppText variant="heading" numberOfLines={1}>{datePart}</AppText>
        </PressableScale>
        <PressableScale onPress={() => details.shiftDate(1)} style={styles.step} accessibilityLabel="Día siguiente"><Icon name="chevronRight" size={20} /></PressableScale>
      </View>
      <View style={styles.timeRow}>
        <PressableScale onPress={() => setTimeOpen(true)} accessibilityLabel="Cambiar la hora">
          <AppText variant="heading">{timePart} <AppText variant="caption" color="accent">CAMBIAR</AppText></AppText>
        </PressableScale>
        <PressableScale onPress={details.resetDateToNow}><AppText variant="caption" color="accent">USAR AHORA</AppText></PressableScale>
      </View>
      <CalendarSheet
        visible={calendarOpen}
        selectedDay={details.day}
        onSelect={(day) => {
          details.setDay(day);
          setCalendarOpen(false);
        }}
        onClose={() => setCalendarOpen(false)}
      />
      <TimePickerSheet
        visible={timeOpen}
        value={details.time}
        onSelect={(t) => {
          details.setTime(t);
          setTimeOpen(false);
        }}
        onClose={() => setTimeOpen(false)}
      />
    </View>
  );
}
