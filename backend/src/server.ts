/* eslint-disable class-methods-use-this */
/* eslint-disable no-new */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './routes/index.routes';
import logger from './helpers/loggerInstance';
import { initializePrisma } from './db/prismaClient';
import ChannelManager from './services/socket/ChannelManager';
import validateSecurityToken from './middleware/socket-auth';
import startNotificationsScheduler from './utils/notifications-scheduler';
import NotificationChannel from './services/socket/channels/NotificationChannel';
import { SchedulerManager } from './modules/Scheduler/core/SchedulerManager';

export default class Server {
  private io!: SocketServer;

  private channelManager!: ChannelManager;

  constructor() {
    logger.debug('Server: Initializing server');
    this.initialize();
  }

  private async initialize() {
    initializePrisma();
    const httpServer = createServer(app);
    this.io = new SocketServer(httpServer, {
      cors: {
        origin:
          process.env.NODE_ENV === 'development'
            ? ['http://localhost:5173', 'http://127.0.0.1:5173']
            : process.env.FRONTEND_URL_PRODUCTION,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
      },
      allowEIO3: true,
      pingTimeout: 120000,
      pingInterval: 30000,
      connectTimeout: 45000,
      maxHttpBufferSize: 1e8,
      transports: ['websocket', 'polling'],
      allowUpgrades: true,
      perMessageDeflate: {
        threshold: 2048
      }
    });

    this.io.use(validateSecurityToken);

    this.channelManager = new ChannelManager(this.io);
    logger.debug('Server: ChannelManager initialized');

    logger.debug('Server: Starting server');
    this.startServer(httpServer);
  }

  public getIO(): SocketServer {
    return this.io;
  }

  public getChannelManager(): ChannelManager {
    return this.channelManager;
  }

  startServer = async (httpServer: any) => {
    try {
      const inDev = process.env.NODE_ENV === 'development';
      const enableNotificationsTest = process.env.ENABLE_NOTIFICATIONS_TEST === 'true' || false;
      const PORT = process.env.PORT || 4000;

      httpServer.listen(PORT, () => {
        logger.info(`✅ Server is running on port ${PORT} in ${inDev ? 'development' : 'production'} mode`);
        logger.info('✅ Socket.IO server initialized');
      });

      const notificationChannel = this.channelManager.getNotificationChannel() as NotificationChannel;

      // Initialize scheduler manager
      await SchedulerManager.getInstance().initialize(notificationChannel);
      logger.info('✅ Scheduler Manager initialized');

      // Remove the test notifications scheduler as it's no longer needed
    } catch (error: any) {
      logger.error(error);
    }
  };
}

const server = new Server();
export const io = server.getIO();
export const channelManager = server.getChannelManager();
