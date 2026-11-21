import { Tabs } from 'expo-router';
import { TabBar } from '../../components/shared/TabBar';
import { useTheme } from '../../hooks/useTheme';

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Movimientos' }} />
      <Tabs.Screen name="cuentas" options={{ title: 'Cuentas' }} />
      <Tabs.Screen name="presupuesto" options={{ title: 'Presupuesto' }} />
      <Tabs.Screen name="reportes" options={{ title: 'Reportes' }} />
    </Tabs>
  );
}
