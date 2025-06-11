import logger from '../../../helpers/loggerInstance';
import { channelManager } from '../../../server';
import prisma from '../../../db/prismaClient';

export interface NotificationPayload {
  type: 'system' | 'toast';
  message: string;
  userId?: string;
  data?: Record<string, any>;
  url?: string;
  needTodo: boolean;
  todoItem?: string;
}

export interface NotificationResult {
  success: boolean;
  message?: string;
}

export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  logger.info('Notification-Service: Getting notification channel');
  const notificationChannel = channelManager.getNotificationChannel();

  if (!notificationChannel) {
    logger.error('Notification-Service: Notification service not available');
    throw new Error('Notification service not available');
  }

  logger.info(`Notification-Service: Sending notification${payload.userId ? ` to user ${payload.userId}` : ''}`);

  const result = await notificationChannel.sendNotification({
    type: payload.type,
    message: payload.message,
    userId: payload.userId,
    data: payload.data,
    url: payload.url,
    needTodo: payload.needTodo,
    todoItem: payload.todoItem || ''
  });

  if (!result) {
    logger.error('Notification-Service: Failed to send notification');
    throw new Error('Failed to send notification');
  }

  return {
    success: true,
    message: 'Notification sent successfully'
  };
}

export async function sendTodoNotification(payload: NotificationPayload): Promise<NotificationResult> {
  if (!payload.todoItem) {
    logger.error('Notification-Service: Todo item is required for todo notifications');
    throw new Error('Todo item is required for todo notifications');
  }

  return sendNotification({
    ...payload,
    needTodo: true
  });
}

export async function sendBroadcastNotification(
  payload: Omit<NotificationPayload, 'userId' | 'needTodo'>
): Promise<NotificationResult> {
  return sendNotification({
    ...payload,
    needTodo: false
  });
}

export class NotificationService {
  static async markNotificationsAsRead(notificationIds: string[], userId: string): Promise<void> {
    try {
      logger.info(`[Notification Service] Marking notifications as read`, {
        count: notificationIds.length,
        userId
      });

      // Update all notifications in a single transaction
      await prisma.$transaction(async (tx) => {
        // First verify all notifications belong to the user
        const notifications = await tx.notification.findMany({
          where: {
            id: { in: notificationIds },
            userId
          }
        });

        if (notifications.length !== notificationIds.length) {
          logger.warn(`[Notification Service] Some notifications were not found or don't belong to the user`, {
            requested: notificationIds.length,
            found: notifications.length,
            userId
          });
        }

        // Update only the notifications that belong to the user
        await tx.notification.updateMany({
          where: {
            id: { in: notifications.map((n) => n.id) },
            userId
          },
          data: {
            read: true
          }
        });

        logger.info(`[Notification Service] Successfully marked notifications as read`, {
          count: notifications.length,
          userId
        });
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error('[Notification Service] Error marking notifications as read:', err);
      throw err;
    }
  }
}
