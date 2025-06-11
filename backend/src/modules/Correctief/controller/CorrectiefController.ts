/* eslint-disable @typescript-eslint/return-await */
import { Correctief, Status } from '@prisma/client';
import { RequestHandler } from 'express';
import logger from '../../../helpers/loggerInstance';
import { logSuccess, logError, logStateChange } from '../../../middleware/handleHistory';
import handleError from '../../../utils/errorHandler';
import { getCorrectief, getAllCorrectief, createCorrectief, updateCorrectief } from '../service/CorrectiefService';
import { CreateCorrectiefInput, UpdateCorrectiefInput, CorrectiefParams, CorrectiefQuery } from '../validation/schemas';
import { TaskService } from '../../Task/service/TaskService';
import {
  handleCorrectiefTaskCreationCorrectiefSide,
  handleCorrectiefTaskUpdate
} from '../../../utils/handleCorrectiefTasks';
import { recordChange } from '../../../services/versionHistory.service';

// Define a type that includes the optional Status relation
type CorrectiefWithStatusMaybe = Correctief & { Status?: Status };

export const GetCorrectief: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params as CorrectiefParams;
  try {
    logger.info(`Correctief-Controller: Getting correctief record ${id}`);
    const result = await getCorrectief(id);

    logSuccess(req, {
      action: 'GET_CORRECTIEF',
      resourceType: 'CORRECTIEF',
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: result.data });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Correctief-Controller: Get correctief failed - ${err}`);

    logError(req, {
      action: 'GET_CORRECTIEF',
      resourceType: 'CORRECTIEF',
      resourceId: id,
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const GetAllCorrectief: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const filters = req.query as CorrectiefQuery;
    logger.info('Correctief-Controller: Getting all correctief records', { filters });
    const result = await getAllCorrectief(filters);

    logSuccess(req, {
      action: 'GET_ALL_CORRECTIEF',
      resourceType: 'CORRECTIEF',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        resultCount: result.data.length,
        filters,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: result.data, meta: result.meta });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Correctief-Controller: Get all correctief failed - ${err}`);

    logError(req, {
      action: 'GET_ALL_CORRECTIEF',
      resourceType: 'CORRECTIEF',
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const Create: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    if (!req.user) {
      throw new Error('User is not authenticated');
    }
    logger.info('Correctief-Controller: Creating new correctief record');
    const payload = req.body as CreateCorrectiefInput;
    const result = await createCorrectief(payload, req.user.id);

    logSuccess(req, {
      action: 'CREATE_CORRECTIEF',
      resourceType: 'CORRECTIEF',
      resourceId: result.data.id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(201).json({ data: result.data });
    handleCorrectiefTaskCreationCorrectiefSide(result.data);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Correctief-Controller: Create failed - ${err}`);

    logError(req, {
      action: 'CREATE_CORRECTIEF',
      resourceType: 'CORRECTIEF',
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const Update: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params as CorrectiefParams;
  try {
    const payload = req.body as UpdateCorrectiefInput;
    logger.info(`Correctief-Controller: Updating correctief record ${id}`);

    // Fetch existing record (already present)
    const existingCorrectief = await getCorrectief(id);
    const oldVersion = existingCorrectief.data; // Use existing data
    const oldStatusName = (oldVersion as CorrectiefWithStatusMaybe).Status?.StatusNaam;

    // Perform update (already present)
    const result = await updateCorrectief(id, payload);
    const newVersion = result.data; // Use existing result data
    const newStatusName = (newVersion as CorrectiefWithStatusMaybe).Status?.StatusNaam;

    logger.debug(`Correctief-Controller: Calling Version History Service for correctief ${id}`);
    const userId = req.user?.id;
    recordChange('Correctief', id, oldVersion, newVersion, userId)
      .then(() => {
        logger.debug(`Correctief-Controller: Version History Service for correctief ${id} completed`);
      })
      .catch((error) => {
        logger.error(`Correctief-Controller: Version History Service for correctief ${id} failed:`, error);
      });

    handleCorrectiefTaskUpdate(newVersion, payload);

    // TODO: Ask if this is really needed
    if (newStatusName === 'Afgerond' && oldStatusName !== 'Afgerond') {
      logger.info(`Correctief-Controller: Status changed to Afgerond, updating related tasks`);
      TaskService.updateTasksByFilter(
        { correctiefId: id, finished: false },
        { finished: true, completedAt: new Date() }
      )
        .then((updatedCount) => {
          logger.info(`Correctief-Controller: Updated ${updatedCount} tasks to finished for correctief ${id}`);
        })
        .catch((error) => {
          logger.error(`Correctief-Controller: Failed to update tasks for correctief ${id}:`, error);
        });
    } else if (oldStatusName === 'Afgerond' && newStatusName !== 'Afgerond') {
      logger.info(`Correctief-Controller: Status changed from Afgerond, reverting related tasks to unfinished`);
      TaskService.updateTasksByFilter({ correctiefId: id, finished: true }, { finished: false, completedAt: null })
        .then((updatedCount) => {
          logger.info(`Correctief-Controller: Reverted ${updatedCount} tasks to unfinished for correctief ${id}`);
        })
        .catch((error) => {
          logger.error(`Correctief-Controller: Failed to revert tasks for correctief ${id}:`, error);
        });
    }

    logStateChange(req, {
      action: 'UPDATE_CORRECTIEF',
      resourceType: 'CORRECTIEF',
      resourceId: id,
      previousState: existingCorrectief.data as CorrectiefWithStatusMaybe, // Assert type here too for consistency
      newState: result.data as CorrectiefWithStatusMaybe, // Assert type here too for consistency
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: newVersion });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Correctief-Controller: Update failed - ${err}`);

    logError(req, {
      action: 'UPDATE_CORRECTIEF',
      resourceType: 'CORRECTIEF',
      resourceId: id,
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};
