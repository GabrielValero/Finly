import { ScrollView } from 'react-native';
import { useAjustesScreen } from '../../../hooks/useAjustesScreen';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Banner } from '../../shared/Banner';
import { Card } from '../../shared/Card';
import { SettingsRow } from '../../shared/SettingsRow';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function AjustesView() {
  const vm = useAjustesScreen();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[8] },
    card: { paddingVertical: 0, paddingHorizontal: t.space[16], borderRadius: t.radius[24] },
    section: { marginTop: t.space[8] },
  }));
  return (
    <ScreenTemplate title="Ajustes" titleStyle="large">
      <ScrollView contentContainerStyle={styles.scroll}>
        {vm.backupBanner ? <Banner text={vm.backupBanner} action="RESPALDAR" onPress={vm.openBackup} /> : null}
        <AppText variant="label" color="textMuted">Tasas</AppText>
        <Card style={styles.card}>
          <SettingsRow label="Tasa de hoy" value={vm.rateValue} onPress={vm.openRates} />
          <SettingsRow label="Fuente por defecto" value={vm.sourceValue} onPress={vm.openRates} last />
        </Card>
        <AppText variant="label" color="textMuted">Datos</AppText>
        <Card style={styles.card}>
          <SettingsRow label="Cuentas" value={vm.accountsValue} onPress={vm.openAccounts} />
          <SettingsRow label="Categorías" value={vm.categoriesValue} onPress={vm.openCategories} />
          <SettingsRow label="Respaldo" value={vm.backupValue} onPress={vm.openBackup} />
          <SettingsRow label="Importar datos" value="Próximamente" />
          <SettingsRow label="Borrar todos los datos" danger onPress={vm.openDeleteData} last />
        </Card>
        <AppText variant="label" color="textMuted">App</AppText>
        <Card style={styles.card}>
          <SettingsRow label="Moneda base" value="USD" />
          <SettingsRow label="Bloqueo con huella" value={vm.lockValue} onPress={vm.toggleLock} />
          <SettingsRow label="Tema" value={vm.themeValue} onPress={vm.openTheme} />
          <SettingsRow label="Ícono de la app" value={vm.iconValue} onPress={vm.openAppIcon} last />
        </Card>
        {vm.lockError ? <AppText variant="small" color="expense">{vm.lockError}</AppText> : null}
      </ScrollView>
    </ScreenTemplate>
  );
}
