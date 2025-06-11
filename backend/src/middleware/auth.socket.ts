import { Socket } from 'socket.io';
import prisma from '../db/prismaClient';
import logger from '../helpers/loggerInstance';
import { apiKeyService } from '../services/apikey.service';

export default async function isAuthenticated(socket: Socket): Promise<boolean> {
  const userId = socket.handshake.auth?.userId;
  const deviceId = socket.handshake.auth?.deviceId;
  const initialRegistration = socket.handshake.auth?.initialRegistration;
  const apiKey = socket.handshake.auth?.apiKey;
  const type = socket.handshake.auth?.type;

  logger.debug(
    `Authentication attempt - Socket: ${socket.id}, Type: ${type}, UserId: ${userId}, DeviceId: ${deviceId}, InitialReg: ${initialRegistration}, HasAPIKey: ${!!apiKey}`
  );

  // Try API key authentication first
  if (apiKey) {
    try {
      const result = await apiKeyService.validateAPIKey(apiKey);
      if (result) {
        // Log API key usage
        await apiKeyService.logAPIKeyUsage(
          result.keyId,
          'socket-auth',
          'AUTHENTICATE',
          true,
          socket.handshake.address,
          socket.handshake.headers['user-agent'] as string
        );

        logger.debug(`Socket authenticated via API key - UserId: ${result.userId}, Socket: ${socket.id}`);
        return true;
      }
    } catch (error) {
      logger.error(`API key socket authentication failed: ${error}`);
    }
  }

  // Fall back to regular authentication
  if (!userId) {
    logger.warn(`Missing userId - Socket: ${socket.id}`);
    return false;
  }

  try {
    // Check if user exists
    logger.debug(`Looking up user - UserId: ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      logger.warn(`User not found - UserId: ${userId}, Socket: ${socket.id}`);
      return false;
    }
    logger.debug(`User found - UserId: ${userId}, Socket: ${socket.id}`);

    // For notifications, only verify user exists
    if (type === 'notifications') {
      logger.debug(`Notification connection authenticated - UserId: ${userId}, Socket: ${socket.id}`);
      return true;
    }

    // For security connections, need deviceId
    if (!deviceId) {
      logger.warn(`Missing deviceId for security connection - Socket: ${socket.id}`);
      return false;
    }

    // If this is an initial registration, we only need to verify the user exists
    if (initialRegistration) {
      logger.info(
        `Initial device registration, bypassing device check - UserId: ${userId}, DeviceId: ${deviceId}, Socket: ${socket.id}`
      );
      return true;
    }

    // For existing security connections, verify the device exists and is active
    logger.debug(`Checking existing device - UserId: ${userId}, DeviceId: ${deviceId}`);
    const device = await prisma.userDevice.findFirst({
      where: {
        userId,
        deviceId,
        currentlyActive: true
      }
    });

    const authenticated = !!device;
    logger.info(
      `Authentication result: ${authenticated} - UserId: ${userId}, DeviceId: ${deviceId}, Socket: ${socket.id}, DeviceFound: ${!!device}, DeviceActive: ${device?.currentlyActive}`
    );

    return authenticated;
  } catch (error) {
    logger.error(
      `Error checking authentication - UserId: ${userId}, DeviceId: ${deviceId}, Socket: ${socket.id}, Error: ${error}`
    );
    return false;
  }
}
