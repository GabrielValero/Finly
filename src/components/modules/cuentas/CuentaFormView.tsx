import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { accountKindLabel } from '../../../utils/accounts';
import { useAccountForm } from '../../../hooks/useAccountForm';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { ACCOUNT_ICON_KEYS, Icon } from '../../shared/Icon';
import { IconBadge } from '../../shared/IconBadge';
import { Keypad } from '../../shared/Keypad';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SettingsRow } from '../../shared/SettingsRow';
import { SheetModal } from '../../shared/SheetModal';
import { SwitchRow } from '../../shared/SwitchRow';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function CuentaFormView({ id }: { id?: string }) {
  const vm = useAccountForm(id);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [keypad, setKeypad] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[16], gap: t.space[12] },
    preview: { flexDirection: 'row', alignItems: 'center', gap: t.space[16] },
    texts: { flex: 1, gap: t.space[4], minWidth: 0 },
    right: { alignItems: 'flex-end', gap: t.space[4], maxWidth: '45%' },
    box: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.space[16], paddingVertical: t.space[12], gap: t.space[4] },
    input: { color: t.colors.text, fontFamily: t.font.sans.medium, fontSize: 18, padding: 0 },
    icons: { flexDirection: 'row', gap: t.space[8] },
    iconBtn: { flex: 1, aspectRatio: 1, borderRadius: t.radius[16], backgroundColor: t.colors.surface2, borderWidth: 2, borderColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    iconSelected: { borderColor: t.colors.accent },
    list: { paddingVertical: 0, paddingHorizontal: t.space[16] },
    switchBox: { paddingVertical: t.space[12] },
    footer: { paddingHorizontal: t.space[16], paddingBottom: t.space[16] + insets.bottom, paddingTop: t.space[8] },
  }));

  return (
    <ScreenTemplate title={vm.title} titleBold left="close" onLeft={vm.close}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={styles.preview}>
            <IconBadge icon={vm.icon} />
            <View style={styles.texts}>
              <AppText variant="heading" numberOfLines={1}>{vm.previewName}</AppText>
              <AppText variant="caption" color="textMuted">{vm.currency}</AppText>
            </View>
            <View style={styles.right}>
              <AppText variant="amount" fit>{vm.balanceLabel}</AppText>
              <AppText variant="caption" color="textMuted">Vista previa</AppText>
            </View>
          </View>
        </Card>

        <View style={styles.box}>
          <AppText variant="label" color="textMuted">Nombre</AppText>
          <TextInput value={vm.name} onChangeText={vm.setName} placeholder="Ej. Efectivo USD" placeholderTextColor={theme.colors.textMuted} style={styles.input} maxLength={40} />
        </View>

        <AppText variant="label" color="textMuted">Moneda</AppText>
        <Segmented options={[{ value: 'USD', label: 'USD' }, { value: 'VES', label: 'VES' }]} value={vm.currency} onChange={vm.setCurrency} disabled={vm.currencyLocked} />
        <AppText variant="small" color="textMuted">{vm.currencyLocked ? 'No se puede cambiar: la cuenta ya tiene movimientos.' : 'No se podrá cambiar cuando tenga movimientos.'}</AppText>

        <AppText variant="label" color="textMuted">Ícono</AppText>
        <View style={styles.icons}>
          {ACCOUNT_ICON_KEYS.map((k) => (
            <PressableScale key={k} onPress={() => vm.setIcon(k)} style={[styles.iconBtn, k === vm.icon ? styles.iconSelected : null]} accessibilityLabel={accountKindLabel(k) ?? k} accessibilityState={{ selected: k === vm.icon }}>
              <Icon name={k} size={22} color={k === vm.icon ? 'accent' : 'text'} />
            </PressableScale>
          ))}
        </View>

        <PressableScale onPress={() => setKeypad(true)} style={styles.box} accessibilityLabel="Editar saldo actual">
          <AppText variant="label" color="textMuted">Saldo actual</AppText>
          <AppText variant="balance" fit>{`${vm.currency === 'USD' ? '$ ' : 'Bs '}${vm.balance.display}`}</AppText>
        </PressableScale>

        <Card style={styles.list}>
          <View style={styles.switchBox}>
            <SwitchRow label="Incluir en el balance total" value={vm.includeInTotal} onChange={vm.setIncludeInTotal} />
          </View>
        </Card>

        {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}

        {vm.canArchive ? (
          <>
            <AppText variant="label" color="textMuted">Zona de peligro</AppText>
            <Card style={styles.list}>
              {vm.canDeleteMovements ? <SettingsRow label="Eliminar movimientos" value={String(vm.movementCount)} danger onPress={vm.confirmDeleteMovements} /> : null}
              <SettingsRow label="Archivar cuenta" danger onPress={vm.confirmArchive} last />
            </Card>
            <AppText variant="small" color="textMuted">Eliminar movimientos deja la cuenta con su saldo inicial. La cuenta y su configuración se conservan.</AppText>
          </>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label={vm.submitLabel} onPress={() => void vm.save()} disabled={!vm.canSave} />
      </View>

      <SheetModal visible={keypad} title="SALDO ACTUAL" onClose={() => setKeypad(false)}>
        <AppText variant="display" align="center">{vm.balance.display}</AppText>
        <Keypad onKey={vm.pressBalance} allowNegative />
        <Button label="Listo" onPress={() => setKeypad(false)} />
      </SheetModal>
    </ScreenTemplate>
  );
}
