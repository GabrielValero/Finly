const MAX_TAG = 30;

/** "  #Semana Santa " -> "semana-santa". null si queda vacío. */
export function normalizeTagName(raw: string): string | null {
  const clean = raw
    .trim()
    .replace(/^#+/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .slice(0, MAX_TAG);
  return clean.length > 0 ? clean : null;
}
