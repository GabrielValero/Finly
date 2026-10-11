import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LockScreen } from '../components/template/LockScreen';
import { FatalError } from '../components/template/FatalError';
import { useAppFonts } from '../hooks/useAppFonts';
import { useAppLock } from '../hooks/useAppLock';
import { useAutoRate } from '../hooks/useAutoRate';
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
  useAutoRate(ready);
  const lock = useAppLock();

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
        <Stack.Screen name="budget/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="categories/index" />
        <Stack.Screen name="list-form/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="list-item/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="list/[id]" />
        <Stack.Screen name="movement/[id]" />
        <Stack.Screen name="account-movements/[id]" />
        <Stack.Screen name="budget-movements/[id]" />
        <Stack.Screen name="settings/delete-data" />
        <Stack.Screen name="settings/rates" />
        <Stack.Screen name="settings/backup" />
        <Stack.Screen name="settings/theme" />
        <Stack.Screen name="settings/app-icon" />
      </Stack>
      {lock.locked ? <LockScreen onUnlock={() => void lock.unlock()} busy={lock.checking} /> : null}
    </>
  );
}
