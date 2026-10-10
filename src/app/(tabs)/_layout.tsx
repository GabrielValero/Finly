import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/shared/Icon';
import { useTheme } from '../../hooks/useTheme';

const TABS = [
  { name: 'index', title: 'Movimientos', icon: 'list' },
  { name: 'cuentas', title: 'Cuentas', icon: 'wallet' },
  { name: 'presupuesto', title: 'Presupuesto', icon: 'pie' },
  { name: 'ajustes', title: 'Ajustes', icon: 'sliders' },
] as const;

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { backgroundColor: theme.colors.bg, borderTopColor: theme.colors.border, height: 64 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom },
        tabBarLabelStyle: { fontFamily: theme.font.sans.medium, fontSize: 12 },
        sceneStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => <Icon name={tab.icon} size={22} color={focused ? 'accent' : 'textMuted'} />,
          }}
        />
      ))}
    </Tabs>
  );
}
