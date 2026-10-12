import { type ListRateEditor } from '../../../hooks/useListRate';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Keypad } from '../../shared/Keypad';
import { Segmented } from '../../shared/Segmented';
import { SheetModal } from '../../shared/SheetModal';

/** Hoja para elegir la tasa de la lista: BCV (en vivo) o una manual. */
export function ListRateSheet({ editor }: { editor: ListRateEditor }) {
  return (
    <SheetModal visible={editor.open} title="TASA DE LA LISTA" onClose={editor.close}>
      <Segmented options={[{ value: 'bcv', label: 'BCV' }, { value: 'manual', label: 'Manual' }]} value={editor.mode} onChange={editor.setMode} />
      {editor.mode === 'bcv' ? (
        <AppText variant="small" color="textMuted">{editor.bcvLabel}. Se actualiza sola.</AppText>
      ) : (
        <>
          <AppText variant="display" align="center">{editor.manual.display}</AppText>
          <Keypad onKey={editor.manual.press} />
        </>
      )}
      <AppText variant="small" color="textMuted">Afecta a todos los productos en Bs de esta lista.</AppText>
      <Button label="Usar esta tasa" onPress={() => void editor.save()} disabled={!editor.canSave} />
    </SheetModal>
  );
}
