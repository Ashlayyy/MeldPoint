import { Request, Response, RequestHandler } from 'express';
import { ResourceType } from '@prisma/client';
import { z } from 'zod';
import { ParsedQs } from 'qs';
import logger from '../../../helpers/loggerInstance';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import handleError from '../../../utils/errorHandler';
import * as LoginHistoryService from '../service/LoginHistoryService';
import { UserIdParams, PaginationQuery, DeviceIdParams } from '../validation/schemas';

export const GetUserLoginHistory: RequestHandler<UserIdParams, unknown, unknown, ParsedQs> = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const { userId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    logger.info('LoginHistory-Controller: Fetching login history', { userId });
    const result = await LoginHistoryService.getUserLoginHistory(userId, { page, limit });

    logSuccess(req, {
      action: 'GET_LOGIN_HISTORY',
      resourceType: ResourceType.MELDING,
      resourceId: userId,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        filters: { userId, page, limit }
      }
    });

    logger.info('LoginHistory-Controller: Successfully retrieved login history', { userId });
    res.status(200).json({ data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }

    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    logger.error('LoginHistory-Controller: Failed to get login history', error);

    logError(req, {
      action: 'GET_LOGIN_HISTORY',
      resourceType: ResourceType.MELDING,
      resourceId: req.params.userId,
      error,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    handleError(error, res);
  }
};

export const GetUserDevices: RequestHandler<UserIdParams> = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const { userId } = req.params;
    logger.info('LoginHistory-Controller: Fetching user devices', { userId });

    const result = await LoginHistoryService.getUserDevices(userId);

    logSuccess(req, {
      action: 'GET_USER_DEVICES',
      resourceType: ResourceType.MELDING,
      resourceId: userId,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info('LoginHistory-Controller: Successfully retrieved user devices', { userId });
    res.status(200).json(result);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error('LoginHistory-Controller: Failed to get user devices', err);

    logError(req, {
      action: 'GET_USER_DEVICES',
      resourceType: ResourceType.MELDING,
      resourceId: req.params.userId,
      error: err,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    handleError(err, res);
  }
};

export const RevokeDevice: RequestHandler<DeviceIdParams> = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const { userId, deviceId } = req.params;
    logger.info('LoginHistory-Controller: Revoking device', { userId, deviceId });

    await LoginHistoryService.revokeDevice(userId, deviceId);

    logSuccess(req, {
      action: 'REVOKE_DEVICE',
      resourceType: ResourceType.MELDING,
      resourceId: deviceId,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        userId
      }
    });

    logger.info('LoginHistory-Controller: Successfully revoked device', { userId, deviceId });
    res.status(200).json({ status: 'success', message: 'Device revoked successfully' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error('LoginHistory-Controller: Failed to revoke device', err);

    logError(req, {
      action: 'REVOKE_DEVICE',
      resourceType: ResourceType.MELDING,
      resourceId: req.params.deviceId,
      error: err,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        userId: req.params.userId
      }
    });

    handleError(err, res);
  }
};

export const RevokeAllDevices: RequestHandler<UserIdParams> = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const { userId } = req.params;
    const currentDeviceId = req.headers['x-device-id'] as string;

    if (!currentDeviceId) {
      throw new Error('Current device ID is required');
    }

    logger.info('LoginHistory-Controller: Revoking all devices', { userId, currentDeviceId });

    await LoginHistoryService.revokeAllDevicesExcept(userId, currentDeviceId);

    logSuccess(req, {
      action: 'REVOKE_ALL_DEVICES',
      resourceType: ResourceType.MELDING,
      resourceId: userId,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        currentDeviceId
      }
    });

    logger.info('LoginHistory-Controller: Successfully revoked all devices', { userId });
    res.status(200).json({ status: 'success', message: 'All devices revoked successfully' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error('LoginHistory-Controller: Failed to revoke all devices', err);

    logError(req, {
      action: 'REVOKE_ALL_DEVICES',
      resourceType: ResourceType.MELDING,
      resourceId: req.params.userId,
      error: err,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    handleError(err, res);
  }
};
