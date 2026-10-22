import { useCaptureForm } from '../../../hooks/useCaptureForm';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Keypad } from '../../shared/Keypad';
import { Segmented } from '../../shared/Segmented';
import { SheetModal } from '../../shared/SheetModal';

type Sheet = ReturnType<typeof useCaptureForm>['rateSheet'];

/** Tasa de este movimiento: la vigente del día o una manual que solo aplica a él. */
export function CaptureRateSheet({ sheet }: { sheet: Sheet }) {
  return (
    <SheetModal visible={sheet.open} title="TASA DE ESTE MOVIMIENTO" onClose={sheet.close}>
      <Segmented options={[{ value: 'auto', label: 'Del día' }, { value: 'manual', label: 'Manual' }]} value={sheet.mode} onChange={sheet.setMode} />
      {sheet.mode === 'auto' ? (
        <AppText variant="small" color="textMuted">{sheet.autoLabel}.</AppText>
      ) : (
        <>
          <AppText variant="display" align="center">{sheet.manual.display}</AppText>
          <Keypad onKey={sheet.manual.press} />
          <AppText variant="small" color="textMuted">Bs por USD. Solo se usa en este movimiento; no cambia la tasa del día.</AppText>
        </>
      )}
      <Button label="Usar esta tasa" onPress={sheet.apply} disabled={!sheet.canApply} />
    </SheetModal>
  );
}
