import { z } from 'zod';

// Base schemas
export const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

// Theme and language enums
const ThemeEnum = z.enum(['light', 'dark']);
const LanguageEnum = z.enum(['en', 'nl']);

// Settings update schema
export const settingsUpdateBodySchema = z
  .object({
    theme: ThemeEnum.optional(),
    language: LanguageEnum.optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one setting must be provided'
  });

// Combined schemas for routes
export const updateSettingsSchema = z.object({
  params: userIdParamSchema,
  body: settingsUpdateBodySchema
});

export const userParamsSchema = z.object({
  params: userIdParamSchema
});

// Type exports
export type UserIdParams = z.infer<typeof userIdParamSchema>;
export type SettingsUpdateBody = z.infer<typeof settingsUpdateBodySchema>;
export type UpdateSettingsSchema = z.infer<typeof updateSettingsSchema>;
