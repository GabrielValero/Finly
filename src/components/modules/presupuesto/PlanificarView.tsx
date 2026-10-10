import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBudgetItemForm } from '../../../hooks/useBudgetItemForm';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { Icon } from '../../shared/Icon';
import { Keypad } from '../../shared/Keypad';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SettingsRow } from '../../shared/SettingsRow';
import { SheetModal } from '../../shared/SheetModal';
import { SwitchRow } from '../../shared/SwitchRow';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function PlanificarView({ id, month }: { id: string; month: string }) {
  const vm = useBudgetItemForm({ id, month });
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState(false);
  const [keypad, setKeypad] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[16], gap: t.space[12] },
    box: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.space[16], paddingVertical: t.space[12], gap: t.space[4] },
    boxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[8] },
    flex: { flex: 1, minWidth: 0 },
    list: { paddingVertical: 0, paddingHorizontal: t.space[16] },
    footer: { paddingHorizontal: t.space[16], paddingBottom: t.space[16] + insets.bottom, gap: t.space[12] },
  }));
  if (vm.notFound) {
    return (
      <ScreenTemplate title={vm.title} left="close" onLeft={vm.close}>
        <View style={styles.scroll}><AppText variant="small" color="textMuted">Esta partida ya no existe.</AppText></View>
      </ScreenTemplate>
    );
  }
  return (
    <ScreenTemplate title={vm.title} left="close" onLeft={vm.close}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AppText variant="label" color="textMuted">{vm.monthLabel}</AppText>
        <PressableScale onPress={() => (vm.categoryLocked ? undefined : setPicker(true))} style={styles.box}>
          <AppText variant="label" color="textMuted">Categoría</AppText>
          <View style={styles.boxRow}>
            <View style={styles.flex}>
              <AppText variant="body" color={vm.selectedLabel ? 'text' : 'textMuted'} numberOfLines={1}>{vm.selectedLabel ?? 'Elegir categoría'}</AppText>
            </View>
            {vm.categoryLocked ? null : <Icon name="chevronRight" size={18} color="textMuted" />}
          </View>
        </PressableScale>

        {vm.categoryLocked ? null : (
          <>
            <AppText variant="label" color="textMuted">Tipo</AppText>
            <Segmented options={[{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }]} value={vm.kind} onChange={vm.changeKind} />
          </>
        )}
        <AppText variant="small" color="textMuted">Se presupuesta en USD: no cambia con la tasa.</AppText>

        <PressableScale onPress={() => setKeypad(true)} style={styles.box}>
          <AppText variant="label" color="textMuted">Monto planificado (USD)</AppText>
          <AppText variant="balance" fit>{vm.amountLabel}</AppText>
        </PressableScale>

        {vm.kind === 'expense' ? (
          <>
            <Card style={styles.list}>
              <SwitchRow label="Gasto fijo" value={vm.isFixed} onChange={vm.setIsFixed} />
              {vm.categoryLocked ? <SettingsRow label="Quitar del presupuesto" danger onPress={vm.confirmDelete} last /> : null}
            </Card>
            <AppText variant="small" color="textMuted">Los gastos fijos muestran PAGADO, PARCIAL o PENDIENTE; los variables, cuánto llevas del límite.</AppText>
          </>
        ) : vm.categoryLocked ? (
          <Card style={styles.list}><SettingsRow label="Quitar del presupuesto" danger onPress={vm.confirmDelete} last /></Card>
        ) : null}
        {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Guardar" onPress={() => void vm.save()} disabled={!vm.canSave} />
      </View>

      <SheetModal visible={picker} title="CATEGORÍA" onClose={() => setPicker(false)}>
        {vm.options.length === 0 ? (
          <AppText variant="small" color="textMuted">Ya planificaste todas las categorías de este tipo.</AppText>
        ) : (
          <OptionList
            options={vm.options}
            selected={null}
            onSelect={(c) => {
              vm.selectCategory(c);
              setPicker(false);
            }}
          />
        )}
      </SheetModal>
      <SheetModal visible={keypad} title="MONTO PLANIFICADO (USD)" onClose={() => setKeypad(false)}>
        <AppText variant="display" align="center">{vm.amount.display}</AppText>
        <Keypad onKey={vm.amount.press} />
        <Button label="Listo" onPress={() => setKeypad(false)} />
      </SheetModal>
    </ScreenTemplate>
  );
}
