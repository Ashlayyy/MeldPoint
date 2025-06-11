import { Request, Response } from 'express';
import { ResourceType } from '@prisma/client';
import { z } from 'zod';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import logger from '../../../helpers/loggerInstance';
import { ProjectLeiderSchema, ProjectLeiderParamsSchema } from '../validation/schemas';
import * as ProjectLeiderService from '../service/ProjectLeiderService';

export const getAllProjectLeiders = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    logger.info('ProjectLeider-Controller: Fetching all project leaders');
    const result = await ProjectLeiderService.getAllProjectLeiders();

    logSuccess(req, {
      action: 'GET_ALL_PROJECTLEIDERS',
      resourceType: ResourceType.PROJECTLEIDER,
      metadata: {
        executionTime: Number(
          (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2)
        ),
        resultCount: result?.length || 0
      }
    });

    logger.info(`ProjectLeider-Controller: Successfully retrieved ${result?.length || 0} project leaders`);
    res.status(200).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    logger.error('ProjectLeider-Controller: Failed to fetch all project leaders -', error);
    logError(req, {
      action: 'GET_ALL_PROJECTLEIDERS',
      resourceType: ResourceType.PROJECTLEIDER,
      error
    });
    res.status(500).json({ error: 'Failed to fetch project leaders' });
  }
};

export const getSingleProjectLeider = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const { id } = req.params;
    logger.info(`ProjectLeider-Controller: Fetching project leader ${id}`);

    const result = await ProjectLeiderService.getSingleProjectLeider(id);

    logSuccess(req, {
      action: 'GET_PROJECTLEIDER',
      resourceType: ResourceType.PROJECTLEIDER,
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2))
      }
    });

    logger.info(`ProjectLeider-Controller: Successfully retrieved project leader ${id}`);
    res.status(200).json({ data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }

    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    logger.error('ProjectLeider-Controller: Failed to fetch project leader -', error);
    logError(req, {
      action: 'GET_PROJECTLEIDER',
      resourceType: ResourceType.PROJECTLEIDER,
      resourceId: req.params.id,
      error
    });

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch project leader' });
    }
  }
};

export const createProjectLeider = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const data = req.body;
    logger.info('ProjectLeider-Controller: Creating new project leader');

    const result = await ProjectLeiderService.createProjectLeider(data);

    logSuccess(req, {
      action: 'CREATE_PROJECTLEIDER',
      resourceType: ResourceType.PROJECTLEIDER,
      resourceId: result.id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2))
      }
    });

    logger.info(`ProjectLeider-Controller: Successfully created project leader ${result.id}`);
    res.status(201).json({ data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }

    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    logger.error('ProjectLeider-Controller: Failed to create project leader -', error);
    logError(req, {
      action: 'CREATE_PROJECTLEIDER',
      resourceType: ResourceType.PROJECTLEIDER,
      error,
      metadata: {
        data: req.body
      }
    });
    res.status(500).json({ error: 'Failed to create project leader' });
  }
};

export const updateProjectLeider = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const { id } = req.params;
    const data = req.body;

    logger.info(`ProjectLeider-Controller: Updating project leader ${id}`);
    const result = await ProjectLeiderService.updateProjectLeider(id, data);

    logSuccess(req, {
      action: 'UPDATE_PROJECTLEIDER',
      resourceType: ResourceType.PROJECTLEIDER,
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2))
      }
    });

    logger.info(`ProjectLeider-Controller: Successfully updated project leader ${id}`);
    res.status(200).json({ data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }

    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    logger.error('ProjectLeider-Controller: Failed to update project leader -', error);
    logError(req, {
      action: 'UPDATE_PROJECTLEIDER',
      resourceType: ResourceType.PROJECTLEIDER,
      resourceId: req.params.id,
      error,
      metadata: {
        data: req.body
      }
    });

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update project leader' });
    }
  }
};

export const deleteProjectLeider = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const { id } = req.params;
    logger.info(`ProjectLeider-Controller: Deleting project leader ${id}`);

    const result = await ProjectLeiderService.deleteProjectLeider(id);

    logSuccess(req, {
      action: 'DELETE_PROJECTLEIDER',
      resourceType: ResourceType.PROJECTLEIDER,
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2))
      }
    });

    logger.info(`ProjectLeider-Controller: Successfully deleted project leader ${id}`);
    res.status(200).json({ data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }

    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    logger.error('ProjectLeider-Controller: Failed to delete project leader -', error);
    logError(req, {
      action: 'DELETE_PROJECTLEIDER',
      resourceType: ResourceType.PROJECTLEIDER,
      resourceId: req.params.id,
      error
    });

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete project leader' });
    }
  }
};
