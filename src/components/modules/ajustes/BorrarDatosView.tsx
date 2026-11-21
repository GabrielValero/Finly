import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONFIRM_WORD, useDeleteAllData } from '../../../hooks/useDeleteAllData';
import { useThemedStyles } from '../../../hooks/useTheme';
import { mix } from '../../../utils/color';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { Field } from '../../shared/Field';
import { Icon } from '../../shared/Icon';
import { PressableScale } from '../../shared/PressableScale';
import { ScreenTemplate } from '../../template/ScreenTemplate';

/** Borrar todos los datos (pantalla 31): aviso de peligro, conteos y confirmación escrita. */
export function BorrarDatosView() {
  const vm = useDeleteAllData();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[16], gap: t.space[12] },
    warning: { borderRadius: t.radius[24], borderWidth: 1, borderColor: t.colors.expense, backgroundColor: mix(t.colors.surface, t.colors.expense, 0.12), padding: t.space[20], gap: t.space[8] },
    warningHead: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    list: { paddingVertical: t.space[8], paddingHorizontal: t.space[16] },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: t.space[8] },
    keep: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[8], paddingVertical: t.space[4] },
    footer: { paddingHorizontal: t.space[16], paddingBottom: t.space[16] + insets.bottom },
  }));
  return (
    <ScreenTemplate title="Borrar datos" titleBold left="back" onLeft={vm.back}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.warning}>
          <View style={styles.warningHead}>
            <Icon name="alert" size={18} color="expense" />
            <AppText variant="label" color="expense">Esto no se puede deshacer</AppText>
          </View>
          <AppText variant="bodyRegular">Se eliminarán de este teléfono todas tus cuentas, movimientos, etiquetas, presupuestos y tasas. Las categorías vuelven a las iniciales.</AppText>
        </View>
        <Card style={styles.list}>
          {vm.rows.map((r) => (
            <View key={r.label} style={styles.row}>
              <AppText variant="body">{r.label}</AppText>
              <AppText variant="caption" color="textMuted">{r.value}</AppText>
            </View>
          ))}
        </Card>
        <PressableScale onPress={vm.openBackup} style={styles.keep}>
          <AppText variant="bodyRegular" color="textMuted">¿Quieres conservar una copia?</AppText>
          <AppText variant="label" color="accent">EXPORTAR RESPALDO</AppText>
        </PressableScale>
        <Field label={`Escribe ${CONFIRM_WORD} para confirmar`} value={vm.typed} onChangeText={vm.setTyped} placeholder={CONFIRM_WORD} maxLength={12} />
        {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Borrar todo" variant="dangerSolid" onPress={() => void vm.run()} disabled={!vm.confirmed || vm.busy} />
      </View>
    </ScreenTemplate>
  );
}
