import { z } from 'zod';

export const trackFeatureSchema = z.object({
  feature: z.string({
    required_error: 'Feature name is required',
    invalid_type_error: 'Feature name must be a string'
  }),
  metadata: z.any({
    required_error: 'Metadata is required'
  })
});

export const trackPageViewSchema = z.object({
  page: z.string({
    required_error: 'Page name is required',
    invalid_type_error: 'Page name must be a string'
  }),
  path: z.string({
    required_error: 'Path is required',
    invalid_type_error: 'Path must be a string'
  }),
  duration: z.number({
    required_error: 'Duration is required',
    invalid_type_error: 'Duration must be a number'
  }),
  referrer: z.string({
    required_error: 'Referrer is required',
    invalid_type_error: 'Referrer must be a string'
  })
});

// Types inferred from schemas
export type TrackFeatureInput = z.infer<typeof trackFeatureSchema>;
export type TrackPageViewInput = z.infer<typeof trackPageViewSchema>;
