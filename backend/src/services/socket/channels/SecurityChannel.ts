import { Server, Socket } from 'socket.io';
import { BaseChannel } from './BaseChannel';
import prisma from '../../../db/prismaClient';
import logger from '../../../helpers/loggerInstance';

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  currentlyActive: boolean;
  userId: string;
}

interface LoginHistoryFilters {
  page?: number;
  limit?: number;
  status?: string;
}

export default class SecurityChannel extends BaseChannel {
  constructor(io: Server) {
    super(io, { namespace: 'security' });
  }

  initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.debug(`Security channel: Client connected ${socket.id}`);

      // Device Management
      socket.on('security:device:register', (data: DeviceInfo) => this.handleDeviceRegister(socket, data));
      socket.on('security:device:update', (data: DeviceInfo) => this.handleDeviceUpdate(socket, data));
      socket.on('security:device:list', () => this.handleDeviceList(socket));
      socket.on('security:device:revoke', (data: { deviceId: string }) => this.handleDeviceRevoke(socket, data));
      socket.on('security:revoke-all', () => this.handleRevokeAllDevices(socket));

      // Login History
      socket.on('security:login-history', (filters: LoginHistoryFilters) => this.handleLoginHistory(socket, filters));

      socket.on('disconnect', () => {
        logger.info(`Security channel: Client disconnected ${socket.id}`);
      });
    });
    logger.debug('SecurityChannel: Initialized');
  }

  private async handleDeviceRegister(socket: Socket, deviceInfo: DeviceInfo) {
    const { isAuthorized, userId } = await this.checkAuth(socket);
    if (!isAuthorized || !userId) return;

    try {
      const existingDevice = await prisma.userDevice.findUnique({
        where: { deviceId: deviceInfo.deviceId }
      });

      this.joinRoom(socket, `device:${deviceInfo.deviceId}`);
      this.joinRoom(socket, `user:${deviceInfo.userId}`);

      if (existingDevice) {
        const device = await prisma.userDevice.update({
          where: { deviceId: deviceInfo.deviceId },
          data: {
            lastActive: new Date(),
            currentlyActive: deviceInfo.currentlyActive,
            deviceName: deviceInfo.deviceName,
            browser: deviceInfo.browser,
            os: deviceInfo.os
          }
        });

        this.emitToSocket(socket, 'device:already:registered', { device });
        return;
      }

      const device = await prisma.userDevice.create({
        data: {
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          lastActive: new Date(),
          currentlyActive: deviceInfo.currentlyActive,
          userId: deviceInfo.userId
        }
      });

      await prisma.loginHistory.create({
        data: {
          userId: deviceInfo.userId,
          deviceId: deviceInfo.deviceId,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ipAddress: socket.handshake.address,
          status: 'success'
        }
      });

      this.emitToSocket(socket, 'device:registered:success', { device });
    } catch (error) {
      logger.error(`Device registration failed: ${error}`);
      this.emitError(socket, 'Failed to register device');
    }
  }

  private async handleDeviceUpdate(socket: Socket, deviceInfo: DeviceInfo) {
    const { isAuthorized, userId } = await this.checkAuth(socket);
    if (!isAuthorized || !userId) return;

    try {
      const device = await prisma.userDevice.update({
        where: { deviceId: deviceInfo.deviceId },
        data: {
          lastActive: new Date(),
          currentlyActive: deviceInfo.currentlyActive,
          deviceName: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os
        }
      });

      this.emitToSocket(socket, 'device:updated', { device });
    } catch (error) {
      logger.error(`Device update failed: ${error}`);
      this.emitError(socket, 'Failed to update device');
    }
  }

  private async handleDeviceList(socket: Socket) {
    const { isAuthorized, userId } = await this.checkAuth(socket);
    if (!isAuthorized || !userId) return;

    try {
      const devices = await prisma.userDevice.findMany({
        where: { userId },
        orderBy: { lastActive: 'desc' }
      });

      this.emitToSocket(socket, 'device:list:response', { devices });
    } catch (error) {
      logger.error(`Device list retrieval failed: ${error}`);
      this.emitError(socket, 'Failed to list devices');
    }
  }

  private async handleDeviceRevoke(socket: Socket, { deviceId }: { deviceId: string }) {
    const { isAuthorized, userId } = await this.checkAuth(socket);
    if (!isAuthorized || !userId) return;

    try {
      const device = await prisma.userDevice.findFirst({
        where: { deviceId, userId }
      });

      if (!device) {
        this.emitError(socket, 'Device not found or not authorized');
        return;
      }

      await prisma.userDevice.delete({
        where: { deviceId }
      });

      const deviceSockets = await this.io.in(`device:${deviceId}`).fetchSockets();
      deviceSockets.forEach((deviceSocket: any) => {
        this.emitToSocket(deviceSocket, 'device:revoked', null);
        deviceSocket.disconnect();
      });

      this.emitToSocket(socket, 'device:revoked:success', { deviceId });
    } catch (error) {
      logger.error(`Device revocation failed: ${error}`);
      this.emitError(socket, 'Failed to revoke device');
    }
  }

  private async handleLoginHistory(socket: Socket, filters: LoginHistoryFilters) {
    const { isAuthorized, userId } = await this.checkAuth(socket);
    if (!isAuthorized || !userId) return;

    try {
      const { page = 1, limit = 10, status } = filters;
      const skip = (page - 1) * limit;

      const where = {
        userId,
        ...(status && { status })
      };

      const [total, history] = await Promise.all([
        prisma.loginHistory.count({ where }),
        prisma.loginHistory.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        })
      ]);

      this.emitToSocket(socket, 'login-history:response', {
        history,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error(`Login history retrieval failed: ${error}`);
      this.emitError(socket, 'Failed to fetch login history');
    }
  }

  private async handleRevokeAllDevices(socket: Socket) {
    const { isAuthorized, userId } = await this.checkAuth(socket);
    if (!isAuthorized || !userId) return;

    try {
      const currentDeviceId = socket.handshake.auth?.deviceId;

      const devices = await prisma.userDevice.findMany({
        where: {
          userId,
          deviceId: { not: currentDeviceId }
        }
      });

      await prisma.userDevice.deleteMany({
        where: {
          userId,
          deviceId: { not: currentDeviceId }
        }
      });

      await Promise.all(
        devices.map(async (device) => {
          const deviceSockets = await this.io.in(`device:${device.deviceId}`).fetchSockets();
          deviceSockets.forEach((deviceSocket: any) => {
            this.emitToSocket(deviceSocket, 'device:revoked', null);
            deviceSocket.disconnect();
          });
        })
      );

      this.emitToSocket(socket, 'devices:revoked:all:success', {
        revokedCount: devices.length
      });
    } catch (error) {
      logger.error(`Revoke all devices failed: ${error}`);
      this.emitError(socket, 'Failed to revoke all devices');
    }
  }
}
