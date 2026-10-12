import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DebtDirection } from '../../../utils/debts';
import { useDebtForm } from '../../../hooks/useDebtForm';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { CalendarSheet } from '../../shared/CalendarSheet';
import { Field } from '../../shared/Field';
import { Keypad } from '../../shared/Keypad';
import { OptionList } from '../../shared/OptionList';
import { Segmented } from '../../shared/Segmented';
import { SelectRow } from '../../shared/SelectRow';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function DeudaFormView({ id, direction }: { id: string; direction: DebtDirection }) {
  const vm = useDebtForm(id, direction);
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<'amount' | 'due' | 'account' | null>(null);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[16], gap: t.space[12] },
    footer: { paddingHorizontal: t.space[16], paddingBottom: Math.max(insets.bottom, 8) + t.space[8], paddingTop: t.space[8] },
  }));
  return (
    <ScreenTemplate title={vm.title} left="close" onLeft={vm.close}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Segmented options={vm.directionOptions} value={vm.direction} onChange={vm.setDirection} disabled={vm.locked} />
        <Field label={vm.direction === 'owed_to_me' ? 'Quién te debe' : 'A quién le debes'} value={vm.person} onChangeText={vm.setPerson} placeholder="Nombre" maxLength={60} autoFocus={vm.isNew} />
        <AppText variant="label" color="textMuted">Moneda</AppText>
        <Segmented options={[{ value: 'USD', label: 'USD' }, { value: 'VES', label: 'Bs' }]} value={vm.currency} onChange={vm.setCurrency} disabled={vm.locked} />
        <SelectRow label="Monto" value={vm.amountLabel} onPress={() => setSheet('amount')} />
        <SelectRow label="Vence" value={vm.dueLabel} onPress={() => setSheet('due')} />
        <Field label="Nota (opcional)" value={vm.note} onChangeText={vm.setNote} placeholder="Ej. Para el alquiler" maxLength={120} />
        {vm.isNew ? (
          <>
            <SelectRow label="Registrar en cuenta" value={vm.movement.label} onPress={() => setSheet('account')} />
            <AppText variant="small" color="textMuted">{vm.movementHint}</AppText>
          </>
        ) : null}
        {vm.locked ? <AppText variant="small" color="textMuted">El tipo y la moneda no se cambian después de crear la deuda.</AppText> : null}
        {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
      </ScrollView>
      <View style={styles.footer}><Button label="Guardar" onPress={() => void vm.save()} disabled={!vm.canSave} /></View>

      <SheetModal visible={sheet === 'amount'} title="MONTO" onClose={() => setSheet(null)}>
        <AppText variant="display" align="center" fit>{vm.amount.display}</AppText>
        <Keypad onKey={vm.amount.press} />
        <Button label="Listo" onPress={() => setSheet(null)} />
      </SheetModal>
      <SheetModal visible={sheet === 'account'} title="REGISTRAR EN CUENTA" onClose={() => setSheet(null)}>
        <View style={{ maxHeight: 320 }}>
          <OptionList
            options={vm.movement.options}
            selected={vm.movement.accountId ?? 'none'}
            onSelect={(v) => {
              vm.movement.setAccountId(v === 'none' ? null : v);
              setSheet(null);
            }}
          />
        </View>
      </SheetModal>
      <CalendarSheet
        visible={sheet === 'due'}
        selectedDay={vm.dueOn ?? vm.today}
        onSelect={(d) => {
          vm.setDueOn(d);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
    </ScreenTemplate>
  );
}
