import { z } from 'zod';
import { currencySchema } from './transaction';

export const accountInputSchema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre').max(40),
  currency: currencySchema,
  icon: z.string().min(1),
  color: z.string().nullable().default(null),
  openingMinor: z.number().int().default(0),
});

export type AccountInput = z.infer<typeof accountInputSchema>;
