import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { useMovementDetails } from '../../../hooks/useMovementDetails';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { DateTimeBox } from '../../shared/DateTimeBox';
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
  /** Muestra concepto y fecha/hora (en captura ya están en la pantalla principal; en transferencias no). Por defecto sí. */
  basics?: boolean;
  /** Solo los gastos/ingresos llevan etiquetas; las transferencias no. */
  tags?: { list: TagVm[]; toggle: (id: string) => void; add: (name: string) => Promise<void> };
}

/** Concepto, fecha/hora y etiquetas (pantalla 12 del diseño). */
export function DetallesModal({ visible, ...rest }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={rest.onClose} statusBarTranslucent navigationBarTranslucent>
      <ModalSafeArea>
        <DetallesBody {...rest} />
      </ModalSafeArea>
    </Modal>
  );
}

function DetallesBody({ onClose, details, tags, basics = true }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const [newTag, setNewTag] = useState('');
  const styles = useThemedStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + t.space[16] },
    top: { height: 56, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    round: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    body: { paddingHorizontal: t.space[16], gap: t.space[12] },
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
      <View style={styles.root}>
        <View style={styles.top}>
          <PressableScale onPress={onClose} style={styles.round} accessibilityLabel="Cerrar"><Icon name="close" size={20} /></PressableScale>
          <AppText variant="heading">Más detalles</AppText>
          <PressableScale onPress={onClose} accessibilityLabel="Listo"><AppText variant="body" color="accent">Listo</AppText></PressableScale>
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {basics ? (
            <>
              <Field label="CONCEPTO" value={details.concept} onChangeText={details.setConcept} placeholder="Ej. Mercado semanal" maxLength={120} />
              <DateTimeBox details={details} />
            </>
          ) : null}

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
  );
}
