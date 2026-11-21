import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCenterAction } from '../../hooks/useCenterAction';
import { useThemedStyles } from '../../hooks/useTheme';
import { splitTabRoutes } from '../../utils/tabBar';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, string> = { index: 'list', cuentas: 'wallet', presupuesto: 'pie', reportes: 'chart' };
const TITLES: Record<string, string> = { index: 'Movimientos', cuentas: 'Cuentas', presupuesto: 'Presupuesto', reportes: 'Reportes' };

/** Barra inferior: dos pestañas, botón central "+" elevado y dos pestañas más. */
export function TabBar({ state, navigation }: TabBarProps) {
  const openCenterAction = useCenterAction();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((t) => ({
    bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.bg, borderTopWidth: 1, borderTopColor: t.colors.border, paddingTop: t.space[24], paddingHorizontal: t.space[8] },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[4], height: 48 },
    slot: { width: 80, alignItems: 'center' },
    fab: { width: 64, height: 64, borderRadius: t.radius.full, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: -t.space[32], elevation: 8, shadowColor: t.colors.accent, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  }));

  const routes = state.routes.filter((r: (typeof state.routes)[number]) => r.name in ICONS);
  const { left, right } = splitTabRoutes(routes);

  const renderTab = (route: (typeof routes)[number]) => {
    const focused = state.routes[state.index]?.key === route.key;
    const title = TITLES[route.name] ?? route.name;
    const color = focused ? 'accent' : 'textMuted';
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };
    return (
      <PressableScale key={route.key} onPress={onPress} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={title}>
        <Icon name={ICONS[route.name] ?? 'list'} size={22} color={color} />
        <AppText variant="caption" color={color} numberOfLines={1}>{title}</AppText>
      </PressableScale>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {left.map(renderTab)}
      <View style={styles.slot}>
        <PressableScale
          onPress={openCenterAction}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Nuevo movimiento"
        >
          <Icon name="plus" size={30} color="onAccent" />
        </PressableScale>
      </View>
      {right.map(renderTab)}
    </View>
  );
}
