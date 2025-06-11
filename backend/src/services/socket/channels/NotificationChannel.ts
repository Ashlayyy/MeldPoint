/* eslint-disable class-methods-use-this */
import { Server, Socket } from 'socket.io';
import { BaseChannel } from './BaseChannel';
import prisma from '../../../db/prismaClient';
import logger from '../../../helpers/loggerInstance';
import { withDatabaseRetry } from '../../../helpers/databaseRetry';

interface NotificationPayload {
  type: 'system' | 'toast';
  userId?: string;
  message: string;
  needTodo: boolean;
  todoItem?: string;
  data?: any;
  url?: string;
}

export default class NotificationChannel extends BaseChannel {
  private readonly CLEANUP_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(io: Server) {
    super(io, {
      namespace: 'notifications',
      requireAuth: true,
      rateLimit: {
        maxRequests: 50,
        timeWindow: 30000
      }
    });

    this.setupCleanupInterval();
  }

  private setupCleanupInterval(): void {
    const CLEANUP_INTERVAL = 72 * 60 * 60 * 1000;
    setInterval(() => {
      this.cleanupOldNotifications().catch((error) => {
        logger.error(`Failed to cleanup notifications: ${error}`);
      });
    }, CLEANUP_INTERVAL);
  }

  private async cleanupOldNotifications(): Promise<void> {
    const cleanupDate = new Date(Date.now() - this.CLEANUP_AGE);

    await withDatabaseRetry(() =>
      prisma.notification.deleteMany({
        where: {
          read: true,
          createdAt: { lt: cleanupDate }
        }
      })
    );

    logger.info('Completed notifications cleanup');
  }

  public async sendNotification(notification: NotificationPayload): Promise<boolean> {
    try {
      if (!notification.userId) {
        logger.debug('NotificationChannel: Broadcasting notification to all users');
        logger.info('Broadcasting notification to all connected users');

        const savedNotification = await withDatabaseRetry(() =>
          prisma.notification.create({
            data: {
              type: notification.type,
              message: notification.message,
              data: notification.data ? JSON.stringify(notification.data) : null,
              url: notification.url,
              isBroadcast: true
            }
          })
        );

        this.emitToRoom('notifications', notification.type, {
          id: savedNotification.id,
          type: notification.type,
          message: notification.message,
          data: notification.data,
          url: notification.url,
          createdAt: savedNotification.createdAt.toISOString(),
          isBroadcast: true
        });

        logger.info(`Broadcast notification sent with ID: ${savedNotification.id}`);
        return true;
      }

      logger.debug(`NotificationChannel: Sending ${notification.type} notification to user ${notification.userId}`);

      const savedNotification = await withDatabaseRetry(() =>
        prisma.notification.create({
          data: {
            type: notification.type,
            userId: notification.userId,
            message: notification.message,
            data: notification.data ? JSON.stringify(notification.data) : null,
            url: notification.url,
            isBroadcast: false
          }
        })
      );

      logger.debug(`NotificationChannel: Saved notification with ID ${savedNotification.id}`);

      if (notification.needTodo && notification.todoItem) {
        //await todoService.createTodo(notification.todoItem, notification.userId, notification.url);
        //logger.debug(`NotificationChannel: Created todo item for user ${notification.userId}`);
        logger.debug('SKIPPED DUE TO MISIMPLIMENTATION');
      }

      const userRoom = `user:${notification.userId}`;
      logger.debug(`NotificationChannel: Emitting to room ${userRoom}`);

      this.emitToRoom(userRoom, notification.type, {
        id: savedNotification.id,
        type: notification.type,
        message: notification.message,
        data: notification.data,
        url: notification.url,
        createdAt: savedNotification.createdAt.toISOString(),
        isBroadcast: false
      });

      logger.debug(`NotificationChannel: Successfully emitted ${notification.type} notification to room ${userRoom}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send notification: ${error}`);
      return false;
    }
  }

  private markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      await withDatabaseRetry(() =>
        prisma.notification.update({
          where: {
            id: notificationId
          },
          data: { read: true }
        })
      );
      return true;
    } catch (error) {
      logger.error(`Failed to mark notification as read: ${error}`);
      return false;
    }
  };

  public initialize(): void {
    this.io.on('connection', async (socket: Socket) => {
      logger.debug(`NotificationChannel: New socket connection ${socket.id}`);

      const { isAuthorized, userId } = await this.checkAuth(socket);
      if (!isAuthorized || !userId) {
        logger.debug(`NotificationChannel: Unauthorized connection attempt from socket ${socket.id}`);
        socket.disconnect();
        return;
      }

      // Join user-specific room and notifications room
      const userRoom = `user:${userId}`;
      this.joinRoom(socket, userRoom);
      this.joinRoom(socket, 'notifications');

      logger.debug(`NotificationChannel: Socket ${socket.id} joined rooms: user:${userId}, notifications`);

      socket.on('notification:read', async (notificationId: string) => {
        logger.debug(`NotificationChannel: Received notification:read event for ID ${notificationId}`);
        const result = await this.markAsRead(notificationId);
        logger.debug(`NotificationChannel: Mark as read result: ${result}`);
      });

      socket.on('disconnect', () => {
        logger.debug(`NotificationChannel: Socket ${socket.id} disconnected from rooms: ${userRoom}, notifications`);
        this.leaveRoom(socket, userRoom);
        this.leaveRoom(socket, 'notifications');
      });
    });
  }
}
