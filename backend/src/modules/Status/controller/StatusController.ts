/* eslint-disable @typescript-eslint/return-await */
import { Request, Response } from 'express';
import { getAll, getById, create, update, remove } from '../service/StatusService';
import handleError from '../../../utils/errorHandler';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import logger from '../../../helpers/loggerInstance';

export async function getStatuses(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const result = await getAll();

    logSuccess(req, {
      action: 'GET_ALL_STATUS',
      resourceType: 'STATUS',
      metadata: {
        resultCount: result?.length || 0,
        filters: req.query,
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    const statuses = result.filter((status) => status.StatusType === 'all');

    res.status(200).json({ data: statuses });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Status-Controller: Failed to get all statuses - ${error}`);
    logError(req, {
      action: 'GET_ALL_STATUS',
      resourceType: 'STATUS',
      error,
      metadata: { filters: req.query }
    });
    handleError(error, res);
  }
}

export async function getStatus(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const { id } = req.params;
    const status = await getById(id);

    logSuccess(req, {
      action: 'GET_STATUS',
      resourceType: 'STATUS',
      resourceId: id,
      metadata: {
        found: status !== null,
        requestedAt: new Date().toISOString(),
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    if (!status) {
      res.status(404).json({ error: 'Status not found' });
      return;
    }

    res.status(200).json({ data: status });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Status-Controller: Failed to get status - ${error}`);
    logError(req, {
      action: 'GET_STATUS',
      resourceType: 'STATUS',
      resourceId: req.params.id,
      error
    });
    handleError(error, res);
  }
}

export async function createStatus(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const result = await create(req.body);

    logSuccess(req, {
      action: 'CREATE_STATUS',
      resourceType: 'STATUS',
      resourceId: result.id,
      newState: result,
      changedFields: Object.keys(req.body),
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    res.status(201).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Status-Controller: Failed to create status - ${error}`);
    logError(req, {
      action: 'CREATE_STATUS',
      resourceType: 'STATUS',
      error,
      metadata: { requestBody: req.body }
    });
    handleError(error, res);
  }
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const { id } = req.params;
    const previousState = await getById(id);
    const status = await update(id, req.body);

    logSuccess(req, {
      action: 'UPDATE_STATUS',
      resourceType: 'STATUS',
      resourceId: id,
      previousState,
      newState: status,
      changedFields: Object.keys(req.body),
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    if (!status) {
      res.status(404).json({ error: 'Status not found' });
      return;
    }

    res.status(200).json({ data: status });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Status-Controller: Failed to update status - ${error}`);
    logError(req, {
      action: 'UPDATE_STATUS',
      resourceType: 'STATUS',
      resourceId: req.params.id,
      error,
      metadata: { requestBody: req.body }
    });
    handleError(error, res);
  }
}

export async function deleteStatus(req: Request, res: Response): Promise<void> {
  const startTime = process.hrtime();
  try {
    const { id } = req.params;
    const previousState = await getById(id);
    const status = await remove(id);

    logSuccess(req, {
      action: 'DELETE_STATUS',
      resourceType: 'STATUS',
      resourceId: id,
      previousState,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    if (!status) {
      res.status(404).json({ error: 'Status not found' });
      return;
    }

    res.status(200).json({ data: status });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Status-Controller: Failed to delete status - ${error}`);
    logError(req, {
      action: 'DELETE_STATUS',
      resourceType: 'STATUS',
      resourceId: req.params.id,
      error
    });
    handleError(error, res);
  }
}
