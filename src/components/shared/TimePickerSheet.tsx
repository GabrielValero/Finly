import { useState } from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { shiftTime } from '../../utils/dates';
import { AppText } from './AppText';
import { Button } from './Button';
import { PressableScale } from './PressableScale';
import { SheetModal } from './SheetModal';

interface Props {
  visible: boolean;
  /** "HH:mm" (24 h) */
  value: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const pad = (n: number) => String(n).padStart(2, '0');

/** Selector de hora sin teclear: cuadrícula de horas, minutos de 5 en 5 y ajuste fino de ±1 minuto. */
export function TimePickerSheet({ visible, value, onSelect, onClose }: Props) {
  // Se reinicia al abrir con la hora actual del movimiento.
  return (
    <SheetModal visible={visible} title="HORA" onClose={onClose}>
      {visible ? <Body value={value} onSelect={onSelect} /> : null}
    </SheetModal>
  );
}

function Body({ value, onSelect }: Pick<Props, 'value' | 'onSelect'>) {
  const [draft, setDraft] = useState(value);
  const hour = Number(draft.slice(0, 2));
  const minute = Number(draft.slice(3, 5));
  const styles = useThemedStyles((t) => ({
    readout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.space[16] },
    nudge: { width: 44, height: 44, borderRadius: t.radius.full, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[8] },
    cell: { width: '14.5%', height: 40, borderRadius: t.radius[12], backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    on: { backgroundColor: t.colors.accent },
  }));
  const setHour = (h: number) => setDraft(`${pad(h)}:${pad(minute)}`);
  const setMinute = (m: number) => setDraft(`${pad(hour)}:${pad(m)}`);
  // El ±1 solo mueve los minutos (sin acarrear a la hora) para que no cambie la hora elegida por accidente.
  const nudge = (delta: number) => setMinute(Number(shiftTime(`00:${pad(minute)}`, delta).slice(3, 5)));

  return (
    <>
      <View style={styles.readout}>
        <PressableScale onPress={() => nudge(-1)} style={styles.nudge} accessibilityLabel="Un minuto menos">
          <AppText variant="heading">−</AppText>
        </PressableScale>
        <AppText variant="display">{draft}</AppText>
        <PressableScale onPress={() => nudge(1)} style={styles.nudge} accessibilityLabel="Un minuto más">
          <AppText variant="heading">+</AppText>
        </PressableScale>
      </View>
      <AppText variant="label" color="textMuted">Hora</AppText>
      <View style={styles.grid}>
        {HOURS.map((h) => (
          <PressableScale key={h} onPress={() => setHour(h)} style={[styles.cell, h === hour ? styles.on : null]} accessibilityLabel={`${h} horas`}>
            <AppText variant="body" color={h === hour ? 'onAccent' : 'text'}>{pad(h)}</AppText>
          </PressableScale>
        ))}
      </View>
      <AppText variant="label" color="textMuted">Minutos</AppText>
      <View style={styles.grid}>
        {MINUTES.map((m) => (
          <PressableScale key={m} onPress={() => setMinute(m)} style={[styles.cell, m === minute ? styles.on : null]} accessibilityLabel={`${m} minutos`}>
            <AppText variant="body" color={m === minute ? 'onAccent' : 'text'}>{pad(m)}</AppText>
          </PressableScale>
        ))}
      </View>
      <Button label="Listo" onPress={() => onSelect(draft)} />
    </>
  );
}
