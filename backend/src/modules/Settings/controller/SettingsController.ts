import { Request, Response } from 'express';
import { getSettings as getSettingsService, update, reset } from '../service/SettingsService';
import handleError from '../../../utils/errorHandler';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import logger from '../../../helpers/loggerInstance';

export async function getSettings(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const { userId } = req.params;
    const settings = await getSettingsService(userId);

    logSuccess(req, {
      action: 'GET_SETTINGS',
      resourceType: 'SETTINGS',
      resourceId: userId,
      metadata: {
        found: settings !== null,
        requestedAt: new Date().toISOString(),
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    if (!settings) {
      res.status(404).json({ error: 'Settings not found' });
      return;
    }

    res.status(200).json({ data: settings });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Settings-Controller: Failed to get settings - ${error}`);
    logError(req, {
      action: 'GET_SETTINGS',
      resourceType: 'SETTINGS',
      resourceId: req.params.userId,
      error
    });
    handleError(error, res);
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const { userId } = req.params;
    const previousState = await getSettingsService(userId);
    const settings = await update(userId, req.body);

    logSuccess(req, {
      action: 'UPDATE_SETTINGS',
      resourceType: 'SETTINGS',
      resourceId: userId,
      previousState,
      newState: settings,
      changedFields: Object.keys(req.body),
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    res.status(200).json({ data: settings });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Settings-Controller: Failed to update settings - ${error}`);
    logError(req, {
      action: 'UPDATE_SETTINGS',
      resourceType: 'SETTINGS',
      resourceId: req.params.userId,
      error,
      metadata: { requestBody: req.body }
    });
    handleError(error, res);
  }
}

export async function resetSettings(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const { userId } = req.params;
    const previousState = await getSettingsService(userId);
    const settings = await reset(userId);

    logSuccess(req, {
      action: 'RESET_SETTINGS',
      resourceType: 'SETTINGS',
      resourceId: userId,
      previousState,
      newState: settings,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    res.status(200).json({ data: settings });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Settings-Controller: Failed to reset settings - ${error}`);
    logError(req, {
      action: 'RESET_SETTINGS',
      resourceType: 'SETTINGS',
      resourceId: req.params.userId,
      error
    });
    handleError(error, res);
  }
}
