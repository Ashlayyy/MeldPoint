import { z } from 'zod';

export const batchArchiveSchema = z.object({
  ids: z
    .array(z.string(), {
      required_error: 'IDs array is required',
      invalid_type_error: 'IDs must be an array of strings'
    })
    .nonempty({
      message: 'At least one ID is required'
    }),
  archived: z.boolean({
    required_error: 'Archived status is required',
    invalid_type_error: 'Archived must be a boolean'
  })
});

export type BatchArchiveInput = z.infer<typeof batchArchiveSchema>;
