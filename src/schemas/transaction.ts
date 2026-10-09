import { z } from 'zod';
import { needsRate } from '../utils/rates';

export const currencySchema = z.enum(['VES', 'USD']);
export const rateSourceSchema = z.enum(['bcv', 'manual']);

const id = z.string().min(1);

/** Entrada de un gasto/ingreso desde el formulario. `amountMinor` es magnitud positiva. */
export const transactionInputSchema = z
  .object({
    accountId: id,
    accountCurrency: currencySchema,
    kind: z.enum(['income', 'expense']),
    amountMinor: z.number().int().positive(),
    occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/),
    categoryId: id,
    concept: z.string().trim().max(120).default(''),
    note: z.string().trim().max(500).nullable().default(null),
    tagIds: z.array(id).default([]),
    listedAmountMinor: z.number().int().positive().nullable().default(null),
    listedCurrency: currencySchema.nullable().default(null),
    rateScaled: z.number().int().positive().nullable().default(null),
    rateSource: rateSourceSchema.nullable().default(null),
  })
  .superRefine((v, ctx) => {
    if ((v.listedAmountMinor === null) !== (v.listedCurrency === null)) {
      ctx.addIssue({ code: 'custom', path: ['listedAmountMinor'], message: 'Monto y moneda listados van juntos' });
    }
    if ((v.rateScaled === null) !== (v.rateSource === null)) {
      ctx.addIssue({ code: 'custom', path: ['rateSource'], message: 'Tasa y fuente van juntas' });
    }
    const required = needsRate(v.accountCurrency, v.listedCurrency);
    if (required && v.rateScaled === null) {
      ctx.addIssue({ code: 'custom', path: ['rateScaled'], message: 'Falta la tasa' });
    }
    if (!required && v.rateScaled !== null) {
      ctx.addIssue({ code: 'custom', path: ['rateScaled'], message: 'Este movimiento no usa tasa' });
    }
  });

export type TransactionInput = z.infer<typeof transactionInputSchema>;
