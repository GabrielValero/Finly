import { useState } from 'react';
import { ScrollView, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNewAccountForm } from '../../../hooks/useNewAccountForm';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { ACCOUNT_ICON_KEYS, Icon } from '../../shared/Icon';
import { IconBadge } from '../../shared/IconBadge';
import { Keypad } from '../../shared/Keypad';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function NuevaCuentaView() {
  const vm = useNewAccountForm();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [keypad, setKeypad] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32] + insets.bottom, gap: t.space[12] },
    preview: { flexDirection: 'row', alignItems: 'center', gap: t.space[16] },
    texts: { flex: 1, gap: t.space[4] },
    right: { alignItems: 'flex-end', gap: t.space[4] },
    field: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.accent, padding: t.space[16], gap: t.space[4] },
    input: { color: t.colors.text, fontFamily: t.font.sans.medium, fontSize: 18, padding: 0 },
    icons: { flexDirection: 'row', gap: t.space[8] },
    iconBtn: { width: 52, height: 52, borderRadius: t.radius[16], backgroundColor: t.colors.surface2, borderWidth: 2, borderColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    iconSelected: { borderColor: t.colors.accent },
    balanceBox: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, padding: t.space[16], gap: t.space[8] },
    toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  }));

  return (
    <ScreenTemplate title="NUEVA CUENTA" left="close" onLeft={vm.close}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={styles.preview}>
            <IconBadge icon={vm.icon} />
            <View style={styles.texts}>
              <AppText variant="heading" numberOfLines={1}>{vm.previewName}</AppText>
              <AppText variant="caption" color="textMuted">{vm.currency}</AppText>
            </View>
            <View style={styles.right}>
              <AppText variant="amount">{vm.balanceLabel}</AppText>
              <AppText variant="caption" color="textMuted">Vista previa</AppText>
            </View>
          </View>
        </Card>

        <View style={styles.field}>
          <AppText variant="label" color="textMuted">Nombre</AppText>
          <TextInput value={vm.name} onChangeText={vm.setName} placeholder="Ej. Efectivo USD" placeholderTextColor={theme.colors.textMuted} style={styles.input} maxLength={40} />
        </View>

        <AppText variant="label" color="textMuted">Moneda</AppText>
        <Segmented options={[{ value: 'USD', label: 'USD' }, { value: 'VES', label: 'VES' }]} value={vm.currency} onChange={vm.setCurrency} />
        <AppText variant="small" color="textMuted">No se puede cambiar cuando ya tiene movimientos.</AppText>

        <AppText variant="label" color="textMuted">Ícono</AppText>
        <View style={styles.icons}>
          {ACCOUNT_ICON_KEYS.map((k) => (
            <PressableScale key={k} onPress={() => vm.setIcon(k)} style={[styles.iconBtn, k === vm.icon ? styles.iconSelected : null]} accessibilityLabel={k}>
              <Icon name={k} size={24} color={k === vm.icon ? 'accent' : 'text'} />
            </PressableScale>
          ))}
        </View>

        <PressableScale onPress={() => setKeypad(true)} style={styles.balanceBox}>
          <AppText variant="label" color="textMuted">Saldo actual de la cuenta</AppText>
          <AppText variant="balance">{vm.currency === 'USD' ? '$ ' : 'Bs '}{vm.balance.display}</AppText>
        </PressableScale>

        <View style={styles.toggle}>
          <AppText variant="body">Incluir en el balance total</AppText>
          <Switch
            value={vm.includeInTotal}
            onValueChange={vm.setIncludeInTotal}
            trackColor={{ false: theme.colors.surface2, true: theme.colors.accent }}
            thumbColor={theme.colors.text}
          />
        </View>

        {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
        <Button label="Crear cuenta" onPress={() => void vm.save()} disabled={!vm.canSave} />
      </ScrollView>

      <SheetModal visible={keypad} title="SALDO ACTUAL" onClose={() => setKeypad(false)}>
        <AppText variant="display" align="center">{vm.balance.display}</AppText>
        <Keypad onKey={vm.balance.press} />
        <Button label="Listo" onPress={() => setKeypad(false)} />
      </SheetModal>
    </ScreenTemplate>
  );
}
