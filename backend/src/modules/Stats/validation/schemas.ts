import { z } from 'zod';

// Query parameter schemas
export const periodQuerySchema = z.object({
  period: z
    .string()
    .optional()
    .refine((val) => !val || ['day', 'week', 'month', 'year'].includes(val), {
      message: 'Period must be one of: day, week, month, year'
    })
});

export const daysQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => !val || (Number.isInteger(val) && val > 0), { message: 'Days must be a positive integer' })
});

// Type exports
export type PeriodQuery = z.infer<typeof periodQuerySchema>;
export type DaysQuery = z.infer<typeof daysQuerySchema>;
