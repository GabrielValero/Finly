import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransferForm } from '../../../hooks/useTransferForm';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Icon } from '../../shared/Icon';
import { Keypad } from '../../shared/Keypad';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';
import { DetallesModal } from '../captura/DetallesModal';

export function TransferenciaView() {
  const vm = useTransferForm();
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const styles = useThemedStyles((t) => ({
    body: { flex: 1, paddingHorizontal: t.space[16], gap: t.space[12] },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    close: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    kind: { height: 36, paddingHorizontal: t.space[16], borderRadius: t.radius.full, backgroundColor: t.colors.surface, justifyContent: 'center' },
    box: { backgroundColor: t.colors.surface, borderRadius: t.radius[20], borderWidth: 1, borderColor: t.colors.border, padding: t.space[16], gap: t.space[8] },
    boxActive: { borderColor: t.colors.accent, borderWidth: 2 },
    boxHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[12] },
    selector: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], flexShrink: 1, minWidth: 0 },
    swapRow: { alignItems: 'center', marginVertical: -t.space[4] },
    swap: { width: 36, height: 36, borderRadius: t.radius.full, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    rateBox: { backgroundColor: t.colors.surface2, borderRadius: t.radius[16], padding: t.space[16], gap: t.space[4] },
    rateHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    optional: { height: 44, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.space[16] },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[16], padding: t.space[24] },
    scroll: { gap: t.space[12] },
  }));

  if (!vm.hasEnoughAccounts) {
    return (
      <ScreenTemplate title="TRANSFERENCIA" left="close" onLeft={vm.close}>
        <View style={styles.empty}>
          <AppText variant="bodyRegular" color="textMuted" align="center">Necesitas al menos dos cuentas para transferir.</AppText>
          <Button label="Crear cuenta" onPress={vm.openNewAccount} />
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate>
      <View style={[styles.body, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.topRow}>
          <PressableScale onPress={vm.close} style={styles.close} accessibilityLabel="Cerrar"><Icon name="close" size={20} /></PressableScale>
          <View style={styles.kind}><AppText variant="label">TRANSFERENCIA</AppText></View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <PressableScale onPress={() => vm.setActive('from')} style={[styles.box, vm.active === 'from' ? styles.boxActive : null]}>
            <View style={styles.boxHead}>
              <AppText variant="label" color="textMuted">DESDE</AppText>
              <PressableScale onPress={() => setPicker('from')} style={styles.selector}>
                <AppText variant="heading" numberOfLines={1}>{vm.fromLabel}</AppText>
                <Icon name="chevronDown" size={16} color="textMuted" />
              </PressableScale>
            </View>
            <AppText variant="display" fit>{vm.fromAmount}</AppText>
          </PressableScale>

          <View style={styles.swapRow}>
            <PressableScale onPress={vm.swap} style={styles.swap} accessibilityLabel="Invertir"><Icon name="swap" size={18} color="accent" /></PressableScale>
          </View>

          <PressableScale onPress={() => vm.setActive('to')} style={[styles.box, vm.active === 'to' && !vm.sameCurrency ? styles.boxActive : null]}>
            <View style={styles.boxHead}>
              <AppText variant="label" color="textMuted">HACIA</AppText>
              <PressableScale onPress={() => setPicker('to')} style={styles.selector}>
                <AppText variant="heading" numberOfLines={1}>{vm.toLabel}</AppText>
                <Icon name="chevronDown" size={16} color="textMuted" />
              </PressableScale>
            </View>
            <AppText variant="display" fit>{vm.toAmount}</AppText>
            {vm.convertHint ? <AppText variant="caption" color="textMuted">{vm.convertHint}</AppText> : null}
          </PressableScale>

          {vm.rateCard ? (
            <View style={styles.rateBox}>
              <View style={styles.rateHead}>
                <AppText variant="label" color="textMuted">TASA OBTENIDA</AppText>
                <AppText variant="amount" color="accent" numberOfLines={1}>{vm.rateCard.value}</AppText>
              </View>
              <AppText variant="caption" color="textMuted">{vm.rateCard.note}</AppText>
            </View>
          ) : null}

          <PressableScale onPress={() => setDetailsOpen(true)} style={styles.optional}>
            <AppText variant="bodyRegular" color="textMuted" numberOfLines={1}>{vm.detailsLabel}</AppText>
          </PressableScale>

          {vm.warning ? <AppText variant="small" color="warning">{vm.warning}</AppText> : null}
          {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
          <Button label="Transferir" onPress={() => void vm.save()} disabled={!vm.canSave} />
        </ScrollView>

        <Keypad onKey={vm.pressKey} />
      </View>

      <SheetModal visible={picker !== null} title={picker === 'from' ? 'DESDE' : 'HACIA'} onClose={() => setPicker(null)}>
        <OptionList
          options={picker === 'from' ? vm.fromOptions : vm.toOptions}
          selected={picker === 'from' ? vm.fromId : vm.toId}
          onSelect={(id) => {
            if (picker === 'from') vm.selectFrom(id);
            else vm.selectTo(id);
            setPicker(null);
          }}
        />
      </SheetModal>
      <DetallesModal visible={detailsOpen} onClose={() => setDetailsOpen(false)} details={vm.details} />
    </ScreenTemplate>
  );
}
