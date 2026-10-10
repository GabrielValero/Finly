import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONFIRM_WORD, useDeleteAllData } from '../../../hooks/useDeleteAllData';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { Field } from '../../shared/Field';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function BorrarDatosView() {
  const vm = useDeleteAllData();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[16], gap: t.space[12] },
    warning: { borderRadius: t.radius[20], borderWidth: 1, borderColor: t.colors.expense, backgroundColor: t.colors.surface, padding: t.space[16], gap: t.space[8] },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: t.space[8] },
    footer: { paddingHorizontal: t.space[16], paddingBottom: t.space[16] + insets.bottom },
  }));
  return (
    <ScreenTemplate title="BORRAR DATOS" left="back" onLeft={vm.back}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.warning}>
          <AppText variant="label" color="expense">Esto no se puede deshacer</AppText>
          <AppText variant="body">Se eliminarán de este teléfono todas tus cuentas, movimientos, etiquetas, presupuestos y tasas. Las categorías vuelven a las iniciales.</AppText>
        </View>
        <Card>
          {vm.rows.map((r) => (
            <View key={r.label} style={styles.row}>
              <AppText variant="body">{r.label}</AppText>
              <AppText variant="caption" color="textMuted">{r.value}</AppText>
            </View>
          ))}
        </Card>
        <Field label={`Escribe ${CONFIRM_WORD} para confirmar`} value={vm.typed} onChangeText={vm.setTyped} placeholder={CONFIRM_WORD} maxLength={12} />
        {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Borrar todo" variant="danger" onPress={() => void vm.run()} disabled={!vm.confirmed || vm.busy} />
      </View>
    </ScreenTemplate>
  );
}
