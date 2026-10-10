import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { FatalError } from '../components/template/FatalError';
import { useAppFonts } from '../hooks/useAppFonts';
import { useAutoUpdate } from '../hooks/useAutoUpdate';
import { useBootstrap } from '../hooks/useBootstrap';
import { useTheme } from '../hooks/useTheme';

// El splash nativo se mantiene hasta tener fuentes, migraciones y datos iniciales.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useTheme();
  const fontsReady = useAppFonts();
  const { ready, error } = useBootstrap();
  useAutoUpdate();

  const done = (fontsReady && ready) || error !== null;
  useEffect(() => {
    if (done) SplashScreen.hide();
  }, [done]);

  if (error) return <FatalError message={error.message} />;
  if (!done) return null;

  return (
    <>
      <StatusBar style={theme.kind === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="capture" options={{ presentation: 'modal' }} />
        <Stack.Screen name="rate" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="transfer" options={{ presentation: 'modal' }} />
        <Stack.Screen name="category/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="categories/index" />
        <Stack.Screen name="movement/[id]" />
      </Stack>
    </>
  );
}
