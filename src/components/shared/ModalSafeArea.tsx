import type { ReactNode } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

/**
 * Los `Modal` de React Native viven en su propia ventana nativa: en Android los márgenes seguros
 * (barra de navegación de 3 botones, gestos) deben medirse dentro de esa ventana, no heredarse.
 * Todo contenido de un Modal que use `useSafeAreaInsets` va envuelto en esto.
 */
export function ModalSafeArea({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={initialWindowMetrics}>{children}</SafeAreaProvider>;
}
