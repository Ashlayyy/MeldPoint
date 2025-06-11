import { Request, Response } from 'express';
import prisma from '../../../db/prismaClient';
import {
  sendNotification,
  sendTodoNotification,
  sendBroadcastNotification as sendBroadcastNotificationService,
  NotificationService
} from '../service/NotificationService';
import handleError from '../../../utils/errorHandler';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import logger from '../../../helpers/loggerInstance';

export async function sendTestNotification(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const result = await sendNotification({
      ...req.body,
      needTodo: false
    });

    logSuccess(req, {
      action: 'SEND_TEST_NOTIFICATION',
      resourceType: 'NOTIFICATION',
      resourceId: req.body.userId,
      newState: result,
      changedFields: Object.keys(req.body),
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info('Notification-Controller: Successfully sent test notification');
    res.status(200).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Notification-Controller: Failed to send test notification - ${error}`);
    logError(req, {
      action: 'SEND_TEST_NOTIFICATION',
      resourceType: 'NOTIFICATION',
      resourceId: req.body?.userId,
      error
    });
    handleError(error, res);
  }
}

export async function sendTodoTestNotification(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const result = await sendTodoNotification(req.body);

    logSuccess(req, {
      action: 'SEND_TODO_NOTIFICATION',
      resourceType: 'NOTIFICATION',
      resourceId: req.body.userId,
      newState: result,
      changedFields: Object.keys(req.body),
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info('Notification-Controller: Successfully sent todo notification');
    res.status(200).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Notification-Controller: Failed to send todo notification - ${error}`);
    logError(req, {
      action: 'SEND_TODO_NOTIFICATION',
      resourceType: 'NOTIFICATION',
      resourceId: req.body?.userId,
      error
    });
    handleError(error, res);
  }
}

export async function sendBroadcastNotification(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const result = await sendBroadcastNotificationService(req.body);

    logSuccess(req, {
      action: 'SEND_BROADCAST_NOTIFICATION',
      resourceType: 'NOTIFICATION',
      newState: result,
      changedFields: Object.keys(req.body),
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info('Notification-Controller: Successfully sent broadcast notification');
    res.status(200).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Notification-Controller: Failed to send broadcast notification - ${error}`);
    logError(req, {
      action: 'SEND_BROADCAST_NOTIFICATION',
      resourceType: 'NOTIFICATION',
      error
    });
    handleError(error, res);
  }
}

export async function getNotifications(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [{ userId }, { isBroadcast: true }],
        read: false,
        archived: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    logSuccess(req, {
      action: 'GET_NOTIFICATIONS',
      resourceType: 'NOTIFICATION',
      resourceId: userId,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    res.status(200).json({ data: notifications });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Notification-Controller: Failed to fetch notifications - ${error}`);
    logError(req, {
      action: 'GET_NOTIFICATIONS',
      resourceType: 'NOTIFICATION',
      error
    });
    handleError(error, res);
  }
}

export const markNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    logger.info(`[Notification] Marking notifications as read for user ${userId}`, {
      notificationIds,
      userId
    });

    await NotificationService.markNotificationsAsRead(notificationIds, userId);

    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    logger.error(`[Notification] Error marking notifications as read: ${error}`);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
};
