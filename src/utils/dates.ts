/** Fechas locales como texto ("YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss"). Sin zonas horarias ni Intl. */

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const pad = (n: number) => n.toString().padStart(2, '0');

export function toLocalIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

export function monthOf(isoOrDate: string): string {
  return isoOrDate.slice(0, 7);
}

function parseDay(day: string): { y: number; m: number; d: number } {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return { y, m, d };
}

const dayNumber = (day: string) => {
  const { y, m, d } = parseDay(day);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};

/** Días de `a` a `b` (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round(dayNumber(b) - dayNumber(a));
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

/** Rango [from, to) para filtrar `occurred_at` por comparación de texto. */
export function monthBounds(month: string): { from: string; to: string } {
  return { from: `${month}-01T00:00:00`, to: `${addMonths(month, 1)}-01T00:00:00` };
}

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

/** "Hoy · 9 oct", "Ayer · 8 oct", "Mié · 7 oct". */
export function formatDayLabel(day: string, today: string): string {
  const { m, d, y } = parseDay(day);
  const short = `${d} ${MONTHS_SHORT[m - 1]}`;
  const diff = daysBetween(day, today);
  if (diff === 0) return `Hoy · ${short}`;
  if (diff === 1) return `Ayer · ${short}`;
  const weekday = WEEKDAYS_SHORT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday} · ${short}`;
}

/** "9 oct 2026 · 8:14 a. m." */
export function formatDateTimeLong(iso: string): string {
  const { y, m, d } = parseDay(dayOf(iso));
  const hour24 = Number(iso.slice(11, 13));
  const minute = iso.slice(14, 16);
  const suffix = hour24 >= 12 ? 'p. m.' : 'a. m.';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${d} ${MONTHS_SHORT[m - 1]} ${y} · ${hour12}:${minute} ${suffix}`;
}

/** Los últimos `count` meses terminando en `current`, del más reciente al más antiguo. */
export function recentMonths(current: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addMonths(current, -i));
}

/** Mueve la fecha `delta` días conservando la hora. */
export function shiftDay(iso: string, delta: number): string {
  const { y, m, d } = parseDay(dayOf(iso));
  const date = new Date(Date.UTC(y, m - 1, d + delta));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}${iso.slice(10)}`;
}

/** "HH:mm" válido (24 h). */
export function isValidTime(text: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text);
}

/** Cambia la hora de un ISO local ("HH:mm"); segundos a 00. */
export function withTime(iso: string, time: string): string {
  return `${dayOf(iso)}T${time}:00`;
}

export function timeOf(iso: string): string {
  return iso.slice(11, 16);
}
