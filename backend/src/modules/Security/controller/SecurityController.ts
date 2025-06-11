import { RequestHandler } from 'express';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import handleError from '../../../utils/errorHandler';
import logger from '../../../utils/logger';
import * as SecurityService from '../service/SecurityService';

export const RegisterDevice: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const userId = req.user?.id;

  try {
    logger.info('Security-Controller: Registering device');
    if (!userId) {
      throw new Error('User ID is required');
    }
    const result = await SecurityService.registerDevice(userId, req.body);

    logSuccess(req, {
      action: 'REGISTER_DEVICE',
      resourceType: 'DEVICE',
      resourceId: result.device.id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        deviceId: result.device.deviceId,
        isNewDevice: result.isNewDevice
      }
    });

    logger.info(`Security-Controller: Successfully registered device ${result.device.deviceId}`);
    res.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'REGISTER_DEVICE',
        resourceType: 'DEVICE',
        error,
        metadata: {
          data: req.body
        }
      });
    }
    logger.error('Failed to register device:', error);
    handleError(error, res);
  }
};

export const GetDevices: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const userId = req.user?.id;

  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    logger.info('Security-Controller: Fetching user devices');
    const result = await SecurityService.getDevices(userId);

    logSuccess(req, {
      action: 'GET_DEVICES',
      resourceType: 'DEVICE',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        resultCount: result?.length || 0
      }
    });

    logger.info(`Security-Controller: Successfully retrieved ${result?.length || 0} devices`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_DEVICES',
        resourceType: 'DEVICE',
        error
      });
    }
    logger.error('Failed to get devices:', error);
    handleError(error, res);
  }
};

export const UpdateDeviceStatus: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const userId = req.user?.id;
  const { deviceId, isActive } = req.body;

  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    logger.info(`Security-Controller: Updating device status for ${deviceId}`);
    const result = await SecurityService.updateDeviceStatus(userId, deviceId, isActive);

    logSuccess(req, {
      action: 'UPDATE_DEVICE_STATUS',
      resourceType: 'DEVICE',
      resourceId: result.id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        deviceId,
        isActive
      }
    });

    logger.info(`Security-Controller: Successfully updated device status for ${deviceId}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'UPDATE_DEVICE_STATUS',
        resourceType: 'DEVICE',
        error,
        metadata: {
          deviceId,
          isActive
        }
      });
    }
    logger.error(`Failed to update device status for ${deviceId}:`, error);
    handleError(error, res);
  }
};

export const RemoveDevice: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const userId = req.user?.id;
  const { deviceId } = req.params;

  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    logger.info(`Security-Controller: Removing device ${deviceId}`);
    const result = await SecurityService.removeDevice(userId, deviceId);

    logSuccess(req, {
      action: 'REMOVE_DEVICE',
      resourceType: 'DEVICE',
      resourceId: result.id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        deviceId
      }
    });

    logger.info(`Security-Controller: Successfully removed device ${deviceId}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'REMOVE_DEVICE',
        resourceType: 'DEVICE',
        error,
        metadata: {
          deviceId
        }
      });
    }
    logger.error(`Failed to remove device ${deviceId}:`, error);
    handleError(error, res);
  }
};
