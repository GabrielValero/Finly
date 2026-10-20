import { View } from 'react-native';
import { useCalculator } from '../../../hooks/useCalculator';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Icon } from '../../shared/Icon';
import { Keypad } from '../../shared/Keypad';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SheetModal } from '../../shared/SheetModal';

/** Convierte USD ⇄ Bs sin registrar nada. El botón central invierte el sentido. */
export function CalculadoraSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const vm = useCalculator();
  const styles = useThemedStyles((t) => ({
    box: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], paddingHorizontal: t.space[16], paddingVertical: t.space[12], gap: t.space[4] },
    swapRow: { alignItems: 'center', marginVertical: -t.space[12], zIndex: 1 },
    swap: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: t.colors.bg },
    clear: { alignItems: 'center', paddingVertical: t.space[4] },
  }));
  return (
    <SheetModal visible={visible} title="CALCULADORA" onClose={onClose}>
      <View style={styles.box}>
        <AppText variant="label" color="textMuted">{vm.from === 'USD' ? 'Dólares' : 'Bolívares'}</AppText>
        <AppText variant="display" fit>{vm.inputPrefix} {vm.amount.display}</AppText>
      </View>
      <View style={styles.swapRow}>
        <PressableScale onPress={vm.swap} style={styles.swap} accessibilityLabel="Invertir conversión">
          <Icon name="swap" size={20} color="onAccent" />
        </PressableScale>
      </View>
      <View style={styles.box}>
        <AppText variant="label" color="textMuted">{vm.to === 'USD' ? 'Dólares' : 'Bolívares'}</AppText>
        <AppText variant="display" fit>{vm.resultLabel}</AppText>
      </View>
      {vm.rate ? (
        <>
          {vm.sourceOptions.length > 1 ? <Segmented options={vm.sourceOptions} value={vm.source} onChange={vm.setSource} /> : null}
          <AppText variant="small" color="textMuted" align="center">{vm.rateLabel}</AppText>
        </>
      ) : (
        <AppText variant="small" color="expense" align="center">Aún no hay una tasa registrada. Añade una en Tasas para convertir.</AppText>
      )}
      <Keypad onKey={vm.amount.press} />
      <PressableScale onPress={vm.clear} style={styles.clear} accessibilityLabel="Limpiar">
        <AppText variant="label" color="accent">Limpiar</AppText>
      </PressableScale>
    </SheetModal>
  );
}
