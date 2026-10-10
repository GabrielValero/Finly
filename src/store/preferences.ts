import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_THEME_ID, type ThemeSeed } from '../utils/theme';

/** Solo estado de UI y preferencias. Nunca datos financieros. */
interface PreferencesState {
  themeId: string;
  /** Temas del usuario, guardados como semilla. Se validan con zod al leerlos (hooks/useTheme). */
  customThemes: ThemeSeed[];
  /** Última cuenta usada al capturar (comodidad de UI). */
  lastAccountId: string | null;
  setLastAccountId: (id: string) => void;
  setThemeId: (id: string) => void;
  saveCustomTheme: (seed: ThemeSeed) => void;
  removeCustomTheme: (id: string) => void;
}

// kv-store de expo-sqlite es síncrono: el tema se hidrata antes del primer render (sin parpadeo).
const syncStorage = createJSONStorage(() => ({
  getItem: (key: string) => Storage.getItemSync(key),
  setItem: (key: string, value: string) => Storage.setItemSync(key, value),
  removeItem: (key: string) => Storage.removeItemSync(key),
}));

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      customThemes: [],
      lastAccountId: null,
      setLastAccountId: (lastAccountId) => set({ lastAccountId }),
      setThemeId: (themeId) => set({ themeId }),
      saveCustomTheme: (seed) =>
        set((s) => ({ customThemes: [...s.customThemes.filter((t) => t.id !== seed.id), seed] })),
      removeCustomTheme: (id) =>
        set((s) => ({
          customThemes: s.customThemes.filter((t) => t.id !== id),
          themeId: s.themeId === id ? DEFAULT_THEME_ID : s.themeId,
        })),
    }),
    { name: 'finly-preferences', version: 1, storage: syncStorage },
  ),
);
