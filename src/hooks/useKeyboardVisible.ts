import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/**
 * Si el teclado del sistema está a la vista. Sigue al teclado de verdad (no al foco del campo):
 * en Android el botón Atrás lo oculta sin quitarle el foco al campo, así que `onBlur` no basta.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}
