import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

/**
 * Pide confirmación al salir de una pantalla con datos sin guardar (botón atrás, gesto o cerrar).
 * Llama a `allowExit()` justo antes de navegar a propósito (al guardar o al cambiar de pantalla).
 */
export function useDiscardGuard(dirty: boolean, copy: { title: string; message: string }) {
  const navigation = useNavigation();
  const allowed = useRef(false);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const copyRef = useRef(copy);
  copyRef.current = copy;

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (allowed.current || !dirtyRef.current) return;
      e.preventDefault();
      Alert.alert(copyRef.current.title, copyRef.current.message, [
        { text: 'Seguir aquí', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [navigation]);

  return useCallback(() => {
    allowed.current = true;
  }, []);
}
