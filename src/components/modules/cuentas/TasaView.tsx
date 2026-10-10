import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRateForm } from '../../../hooks/useRateForm';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Keypad } from '../../shared/Keypad';
import { Segmented } from '../../shared/Segmented';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function TasaView() {
  const vm = useRateForm();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((t) => ({
    body: { flex: 1, paddingHorizontal: t.space[16], gap: t.space[16], paddingBottom: insets.bottom + t.space[8] },
    center: { alignItems: 'center', gap: t.space[8], paddingVertical: t.space[16] },
    seg: { width: 180, alignSelf: 'center' },
    keypad: { marginTop: 'auto' },
  }));
  return (
    <ScreenTemplate title="TASA DEL DÍA" left="close" onLeft={vm.close}>
      <View style={styles.body}>
        <View style={styles.seg}>
          <Segmented options={[{ value: 'bcv', label: 'BCV' }, { value: 'manual', label: 'Manual' }]} value={vm.source} onChange={vm.setSource} />
        </View>
        <View style={styles.center}>
          <AppText variant="label" color="textMuted">Bs por 1 USD</AppText>
          <AppText variant="display">{vm.amount.display}</AppText>
          <AppText variant="caption" color="textMuted">{vm.latestLabel}</AppText>
        </View>
        {vm.error ? <AppText variant="small" color="expense" align="center">{vm.error}</AppText> : null}
        <Button label="Guardar tasa" onPress={() => void vm.save()} disabled={!vm.canSave} />
        <View style={styles.keypad}>
          <Keypad onKey={vm.amount.press} />
        </View>
      </View>
    </ScreenTemplate>
  );
}
