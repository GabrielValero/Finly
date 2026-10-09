import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import migrations from './drizzle/migrations';
import { db } from './src/data/db';
import { useTheme, useThemedStyles } from './src/hooks/useTheme';

// Placeholder de Fase A/B: confirma BD, migraciones y tema en el teléfono.
export default function App() {
  const { success, error } = useMigrations(db, migrations);
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' },
    title: { color: t.colors.text, fontSize: 28, fontWeight: '700' },
    status: { color: t.colors.textMuted, marginTop: t.space[8] },
    dot: { color: t.colors.accent },
  }));
  const status = error ? `Error: ${error.message}` : success ? 'Base de datos lista' : 'Migrando…';

  return (
    <View style={styles.root}>
      <Text style={styles.title}>
        Finly<Text style={styles.dot}>.</Text>
      </Text>
      <Text style={styles.status}>{status}</Text>
      <StatusBar style={theme.kind === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}
