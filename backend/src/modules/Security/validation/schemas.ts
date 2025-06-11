import { z } from 'zod';

// Base schemas
const deviceIdParam = z.object({
  deviceId: z.string().min(1, 'Device ID is required')
});

// Device Registration
const deviceRegistrationBodySchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  deviceName: z.string().min(1, 'Device name is required'),
  browser: z.string().min(1, 'Browser information is required'),
  os: z.string().min(1, 'Operating system information is required')
});

export const deviceRegistrationSchema = z.object({
  body: deviceRegistrationBodySchema
});

// Device Status Update
const deviceStatusUpdateBodySchema = z.object({
  currentlyActive: z.boolean()
});

export const deviceStatusUpdateSchema = z.object({
  params: deviceIdParam,
  body: deviceStatusUpdateBodySchema
});

// Device Removal
export const deviceRemovalSchema = z.object({
  params: deviceIdParam
});

// Type exports
export type DeviceRegistrationSchema = z.infer<typeof deviceRegistrationSchema>;
export type DeviceStatusUpdateSchema = z.infer<typeof deviceStatusUpdateSchema>;
export type DeviceRemovalSchema = z.infer<typeof deviceRemovalSchema>;
