import { z } from 'zod';
import { THEME_COLOR_KEYS } from '../utils/theme';

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Usa el formato #RRGGBB')
  .transform((v) => v.toUpperCase());

const overrides = z
  .object(Object.fromEntries(THEME_COLOR_KEYS.map((k) => [k, hex.optional()])) as Record<(typeof THEME_COLOR_KEYS)[number], z.ZodOptional<typeof hex>>)
  .strict();

/** Formato de tema de usuario (importable/exportable como JSON). */
export const themeSeedSchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().trim().min(1).max(40),
  kind: z.enum(['dark', 'light']),
  bg: hex,
  text: hex,
  accent: hex,
  income: hex,
  expense: hex,
  warning: hex,
  overrides: overrides.optional(),
});
