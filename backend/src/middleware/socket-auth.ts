import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../helpers/loggerInstance';
import { apiKeyService } from '../services/apikey.service';
import { FindUserById } from '../modules/User/controller/UserController';

export interface AuthData {
  userId: string;
  deviceId: string;
}

const socketAuthData = new WeakMap<Socket, AuthData>();

export const getSocketAuth = (socket: Socket): AuthData | undefined => {
  return socketAuthData.get(socket);
};

export const validateSecurityToken = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
  const { securityToken, apiKey, type } = socket.handshake.auth;

  // Try API key authentication first
  if (apiKey) {
    try {
      const result = await apiKeyService.validateAPIKey(apiKey);
      if (result) {
        const user = await FindUserById(result.userId);
        if (user) {
          // Store auth data
          socketAuthData.set(socket, {
            userId: result.userId,
            deviceId: 'api-key' // Use a special deviceId for API key auth
          });

          // Log API key usage
          await apiKeyService.logAPIKeyUsage(
            result.keyId,
            'socket-connection',
            'CONNECT',
            true,
            socket.handshake.address,
            socket.handshake.headers['user-agent'] as string
          );

          logger.debug('Socket authenticated via API key');
          next();
          return;
        }
      }
    } catch (error) {
      logger.error(`API key socket authentication failed: ${error}`);
    }
  }

  // Fall back to security token authentication
  if (type === 'security') {
    if (!securityToken) {
      logger.warn('Security token missing for security connection');
      next(new Error('Security token required'));
      return;
    }

    try {
      const decoded = jwt.verify(securityToken, process.env.JWT_SECRET as string) as {
        deviceId: string;
        userId: string;
        type: string;
      };

      if (decoded.type !== 'security') {
        logger.warn('Invalid token type for security connection');
        next(new Error('Invalid token type'));
        return;
      }

      // Store decoded info in WeakMap
      socketAuthData.set(socket, {
        userId: decoded.userId,
        deviceId: decoded.deviceId
      });

      logger.debug('Security token validated successfully');
      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Security token validation failed: ${errorMessage}`);
      next(new Error('Invalid security token'));
    }
  } else {
    next();
  }
};

export default validateSecurityToken;
