import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { useMovementDetails } from '../../../hooks/useMovementDetails';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { CalendarSheet } from '../../shared/CalendarSheet';
import { Chip } from '../../shared/Chip';
import { Field } from '../../shared/Field';
import { Icon } from '../../shared/Icon';
import { ModalSafeArea } from '../../shared/ModalSafeArea';
import { PressableScale } from '../../shared/PressableScale';

interface TagVm {
  id: string;
  name: string;
  selected: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  details: ReturnType<typeof useMovementDetails>;
  /** Solo los gastos/ingresos llevan etiquetas; las transferencias no. */
  tags?: { list: TagVm[]; toggle: (id: string) => void; add: (name: string) => Promise<void> };
}

/** Más detalles: concepto, fecha (Hoy / Ayer / Elegir fecha) y etiquetas (pantalla 04 del diseño). */
export function DetallesModal({ visible, ...rest }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={rest.onClose} statusBarTranslucent navigationBarTranslucent>
      <ModalSafeArea>
        <DetallesBody {...rest} />
      </ModalSafeArea>
    </Modal>
  );
}

function DetallesBody({ onClose, details, tags }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const [newTag, setNewTag] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const styles = useThemedStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + t.space[16] },
    top: { height: 56, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    round: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    body: { paddingHorizontal: t.space[16], gap: t.space[16] },
    block: { gap: t.space[8] },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[8] },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[12], height: 48, borderRadius: t.radius[16], backgroundColor: t.colors.surface2, paddingHorizontal: t.space[16] },
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    tagField: { flex: 1 },
    add: { height: 56, paddingHorizontal: t.space[16], borderRadius: t.radius[16], backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    footer: { paddingHorizontal: t.space[16], marginTop: 'auto' },
  }));

  const submitTag = () => {
    const value = newTag;
    if (value.trim() === '') return;
    setNewTag('');
    void tags?.add(value);
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <PressableScale onPress={onClose} style={styles.round} accessibilityLabel="Cerrar"><Icon name="close" size={20} /></PressableScale>
        <AppText variant="subtitle">Más detalles</AppText>
        <PressableScale onPress={onClose} accessibilityLabel="Listo"><AppText variant="body" color="accent">Listo</AppText></PressableScale>
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field label="CONCEPTO" value={details.concept} onChangeText={details.setConcept} placeholder="Ej. Mercado semanal" maxLength={120} />

        <View style={styles.block}>
          <AppText variant="label" color="textMuted">FECHA</AppText>
          <View style={styles.chips}>
            <Chip shape="tile" label="Hoy" selected={details.dateChoice === 'today'} onPress={details.pickToday} />
            <Chip shape="tile" label="Ayer" selected={details.dateChoice === 'yesterday'} onPress={details.pickYesterday} />
            <Chip shape="tile" label="Elegir fecha" selected={details.dateChoice === 'other'} onPress={() => setCalendarOpen(true)} />
          </View>
          <PressableScale onPress={() => setCalendarOpen(true)} style={styles.dateRow} accessibilityLabel="Abrir calendario">
            <Icon name="calendar" size={18} color="accent" />
            <AppText variant="body">{details.dateLong}</AppText>
          </PressableScale>
        </View>

        {tags ? (
          <View style={styles.block}>
            <AppText variant="label" color="textMuted">ETIQUETAS</AppText>
            <View style={styles.tagRow}>
              <View style={styles.tagField}>
                <Field label="NUEVA ETIQUETA" value={newTag} onChangeText={setNewTag} placeholder="Escribe una etiqueta" maxLength={30} returnKeyType="done" onSubmitEditing={submitTag} />
              </View>
              <PressableScale onPress={submitTag} style={styles.add} accessibilityLabel="Añadir etiqueta">
                <AppText variant="label" color="accent">AÑADIR</AppText>
              </PressableScale>
            </View>
            <View style={styles.chips}>
              {tags.list.map((t) => <Chip key={t.id} shape="tile" label={`#${t.name}`} selected={t.selected} onPress={() => tags.toggle(t.id)} />)}
            </View>
            <AppText variant="small" color="textMuted">Las etiquetas no afectan al presupuesto.</AppText>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}><Button label="Listo" onPress={onClose} /></View>

      <CalendarSheet
        visible={calendarOpen}
        selectedDay={details.day}
        onSelect={(day) => {
          details.setDay(day);
          setCalendarOpen(false);
        }}
        onClose={() => setCalendarOpen(false)}
      />
    </View>
  );
}
