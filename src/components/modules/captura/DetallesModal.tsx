import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { useMovementDetails } from '../../../hooks/useMovementDetails';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Chip } from '../../shared/Chip';
import { Field } from '../../shared/Field';
import { Icon } from '../../shared/Icon';
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

/** Concepto, fecha/hora y etiquetas (pantalla 12 del diseño). */
export function DetallesModal({ visible, onClose, details, tags }: Props) {
  const insets = useSafeAreaInsets();
  const [newTag, setNewTag] = useState('');
  const styles = useThemedStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + t.space[16] },
    top: { height: 56, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    round: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    body: { paddingHorizontal: t.space[16], gap: t.space[12] },
    dateBox: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, padding: t.space[16], gap: t.space[12] },
    stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    step: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[8] },
    tagsBlock: { gap: t.space[8] },
    footer: { paddingHorizontal: t.space[16], marginTop: 'auto' },
  }));

  const submitTag = () => {
    const value = newTag;
    setNewTag('');
    void tags?.add(value);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <View style={styles.top}>
          <PressableScale onPress={onClose} style={styles.round} accessibilityLabel="Cerrar"><Icon name="close" size={20} /></PressableScale>
          <AppText variant="heading">Más detalles</AppText>
          <PressableScale onPress={onClose} accessibilityLabel="Listo"><AppText variant="body" color="accent">Listo</AppText></PressableScale>
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Field label="CONCEPTO" value={details.concept} onChangeText={details.setConcept} placeholder="Ej. Mercado semanal" maxLength={120} />

          <View style={styles.dateBox}>
            <AppText variant="label" color="textMuted">FECHA Y HORA</AppText>
            <View style={styles.stepper}>
              <PressableScale onPress={() => details.shiftDate(-1)} style={styles.step} accessibilityLabel="Día anterior"><Icon name="chevronLeft" size={20} /></PressableScale>
              <AppText variant="heading">{details.dateLabel}</AppText>
              <PressableScale onPress={() => details.shiftDate(1)} style={styles.step} accessibilityLabel="Día siguiente"><Icon name="chevronRight" size={20} /></PressableScale>
            </View>
            <Field
              label="HORA (24 H)"
              value={details.timeText}
              onChangeText={details.setTimeText}
              onBlur={() => details.commitTime(details.timeText)}
              onSubmitEditing={() => details.commitTime(details.timeText)}
              placeholder="HH:mm"
              maxLength={5}
              error={details.timeInvalid}
            />
            <PressableScale onPress={details.resetDateToNow}><AppText variant="caption" color="accent">USAR AHORA</AppText></PressableScale>
          </View>

          {tags ? (
            <View style={styles.tagsBlock}>
              <AppText variant="label" color="textMuted">ETIQUETAS</AppText>
              <Field label="NUEVA ETIQUETA" value={newTag} onChangeText={setNewTag} placeholder="Escribe y pulsa Enter" maxLength={30} returnKeyType="done" onSubmitEditing={submitTag} />
              <View style={styles.chips}>
                {tags.list.map((t) => <Chip key={t.id} label={`#${t.name}`} selected={t.selected} onPress={() => tags.toggle(t.id)} />)}
              </View>
              <AppText variant="small" color="textMuted">Toca para marcar o quitar. Las etiquetas no afectan al presupuesto.</AppText>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.footer}><Button label="Listo" onPress={onClose} /></View>
      </View>
    </Modal>
  );
}
