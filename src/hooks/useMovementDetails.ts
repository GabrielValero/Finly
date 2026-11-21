import { useState } from 'react';
import { dateChipLabel, dateChoice } from '../utils/captureChips';
import { dayOf, formatDayShort, shiftDay, toLocalIso, withDay } from '../utils/dates';

/**
 * Concepto + fecha de un movimiento (compartido por captura y transferencia).
 * La hora no se edita en la UI: se conserva la guardada (ahora si es nuevo, la original al editar).
 */
export function useMovementDetails() {
  const [concept, setConcept] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => toLocalIso(new Date()));
  const nowIso = toLocalIso(new Date());
  const today = dayOf(nowIso);
  const day = dayOf(occurredAt);

  return {
    concept,
    setConcept,
    occurredAt,
    setOccurredAt,
    day,
    setDay: (next: string) => setOccurredAt((iso) => withDay(iso, next)),
    /** Etiqueta corta del chip de fecha: «Hoy», «Ayer», «12 nov». */
    dateChip: dateChipLabel(day, today),
    /** Cuál de «Hoy / Ayer / Elegir fecha» corresponde a la fecha actual. */
    dateChoice: dateChoice(day, today),
    /** «12 nov 2026» para la fila de fecha. */
    dateLong: formatDayShort(day),
    pickToday: () => setOccurredAt((iso) => withDay(iso, today)),
    pickYesterday: () => setOccurredAt((iso) => withDay(iso, dayOf(shiftDay(nowIso, -1)))),
  };
}
