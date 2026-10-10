import { Geist_400Regular, Geist_500Medium, Geist_700Bold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium, GeistMono_700Bold } from '@expo-google-fonts/geist-mono';
import { useFonts } from 'expo-font';

/** Carga las fuentes de la app. Devuelve true cuando están listas (o si fallaron: se usa la del sistema). */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_700Bold,
  });
  return loaded || error !== null;
}
