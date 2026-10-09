import { z } from 'zod';
import { rateSourceSchema } from './transaction';

export const rateInputSchema = z.object({
  source: rateSourceSchema,
  rateScaled: z.number().int().positive(),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type RateInput = z.infer<typeof rateInputSchema>;
