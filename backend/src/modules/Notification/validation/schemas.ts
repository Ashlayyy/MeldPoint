import { z } from 'zod';

// Enums
const NotificationTypeEnum = z.enum(['system', 'toast']);

// Base notification schema
const baseNotificationSchema = {
  type: NotificationTypeEnum,
  message: z.string().min(1, 'Message is required'),
  userId: z.string().optional(),
  data: z.any().optional(),
  url: z.string().url().optional()
};

// Test notification
export const testNotificationSchema = z.object({
  body: z.object(baseNotificationSchema)
});

// Todo test notification
export const todoNotificationSchema = z.object({
  body: z.object({
    ...baseNotificationSchema,
    todoItem: z.string().min(1, 'Todo item is required')
  })
});

// Broadcast notification (uses same schema as test notification)
export const broadcastNotificationSchema = testNotificationSchema;

// Type exports
export type TestNotificationSchema = z.infer<typeof testNotificationSchema>;
export type TodoNotificationSchema = z.infer<typeof todoNotificationSchema>;
export type BroadcastNotificationSchema = z.infer<typeof broadcastNotificationSchema>;

export const markNotificationsReadSchema = {
  body: z.object({
    notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required')
  })
};
