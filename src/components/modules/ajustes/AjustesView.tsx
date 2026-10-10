import { ScrollView } from 'react-native';
import { useAjustesScreen } from '../../../hooks/useAjustesScreen';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
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
        <AppText variant="label" color="textMuted">Tasas</AppText>
        <Card style={styles.card}>
          <SettingsRow label="Tasa de hoy" value={vm.rateValue} onPress={vm.openRates} />
          <SettingsRow label="Fuente por defecto" value={vm.sourceValue} onPress={vm.openRates} last />
        </Card>
        <AppText variant="label" color="textMuted">Datos</AppText>
        <Card style={styles.card}>
          <SettingsRow label="Cuentas" value={vm.accountsValue} onPress={vm.openAccounts} />
          <SettingsRow label="Categorías" value={vm.categoriesValue} onPress={vm.openCategories} />
          <SettingsRow label="Exportar respaldo" value="Próximamente" />
          <SettingsRow label="Restaurar respaldo" value="Próximamente" />
          <SettingsRow label="Importar datos" value="Próximamente" />
          <SettingsRow label="Borrar todos los datos" danger onPress={vm.openDeleteData} last />
        </Card>
        <AppText variant="label" color="textMuted">App</AppText>
        <Card style={styles.card}>
          <SettingsRow label="Moneda base" value="USD" />
          <SettingsRow label="Bloqueo con huella" value="Próximamente" />
          <SettingsRow label="Tema" value={vm.themeValue} onPress={vm.openTheme} last />
        </Card>
      </ScrollView>
    </ScreenTemplate>
  );
}
