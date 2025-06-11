import { z } from 'zod';

export const UserIdSchema = z.object({
  userId: z.string()
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10)
});

export const DeviceIdSchema = z.object({
  userId: z.string(),
  deviceId: z.string()
});

export const DeviceSchema = z.object({
  deviceId: z.string(),
  deviceName: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  lastActive: z.date().optional(),
  currentlyActive: z.boolean().optional()
});

// Type exports
export type UserIdParams = z.infer<typeof UserIdSchema>;
export type PaginationQuery = z.infer<typeof PaginationSchema>;
export type DeviceIdParams = z.infer<typeof DeviceIdSchema>;
export type Device = z.infer<typeof DeviceSchema>;
