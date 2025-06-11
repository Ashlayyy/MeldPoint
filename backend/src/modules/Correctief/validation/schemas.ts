import { z } from 'zod';

export const correctiefSchema = z.object({
  Deadline: z.string({
    required_error: 'Deadline is required',
    invalid_type_error: 'Deadline must be a string'
  }),
  Oplossing: z.string({
    required_error: 'Oplossing is required',
    invalid_type_error: 'Oplossing must be a string'
  }),
  Faalkosten: z
    .number({
      invalid_type_error: 'Faalkosten must be a number'
    })
    .nullable()
    .optional(),
  AkoordOPS: z
    .boolean({
      invalid_type_error: 'AkoordOPS must be a boolean'
    })
    .nullable()
    .optional(),
  TIMER: z
    .number({
      invalid_type_error: 'TIMER must be a number'
    })
    .nullable()
    .optional(),
  StatusID: z
    .string({
      invalid_type_error: 'StatusID must be a string'
    })
    .nullable()
    .optional(),
  userId: z
    .string({
      invalid_type_error: 'userId must be a string'
    })
    .nullable()
    .optional()
});

export const updateCorrectiefSchema = correctiefSchema.partial();

export const correctiefParamsSchema = z.object({
  id: z.string({
    required_error: 'ID is required',
    invalid_type_error: 'ID must be a string'
  })
});

export const correctiefQuerySchema = z.object({
  StatusID: z.string().optional(),
  userId: z.string().optional(),
  search: z.string().optional()
});

export type CreateCorrectiefInput = z.infer<typeof correctiefSchema>;
export type UpdateCorrectiefInput = z.infer<typeof updateCorrectiefSchema>;
export type CorrectiefParams = z.infer<typeof correctiefParamsSchema>;
export type CorrectiefQuery = z.infer<typeof correctiefQuerySchema>;
