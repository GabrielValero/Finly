import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { StyleSheet, Text, View } from 'react-native';
import migrations from './drizzle/migrations';
import { db } from './src/data/db';

// Placeholder de Fase A: solo confirma que la BD y las migraciones corren en el teléfono.
export default function App() {
  const { success, error } = useMigrations(db, migrations);
  const status = error ? `Error: ${error.message}` : success ? 'Base de datos lista' : 'Migrando…';

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Finly</Text>
      <Text style={styles.status}>{status}</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0B', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#F5F5F6', fontSize: 28, fontWeight: '700' },
  status: { color: '#9A9AA3', marginTop: 8 },
});
