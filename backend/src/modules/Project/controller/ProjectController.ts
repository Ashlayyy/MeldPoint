/* eslint-disable @typescript-eslint/return-await */
import { Request, Response, RequestHandler } from 'express';
import * as ProjectService from '../service/ProjectService';
import handleError from '../../../utils/errorHandler';
import logger from '../../../utils/logger';
import { logSuccess, logError } from '../../../middleware/handleHistory';

export const GetAllProjects: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    logger.info('Project-Controller: Fetching all projects');
    const result = await ProjectService.getAllProjects();

    logSuccess(req, {
      action: 'GET_ALL_PROJECTS',
      resourceType: 'PROJECT',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        resultCount: result?.length || 0
      }
    });

    logger.info(`Project-Controller: Successfully retrieved ${result?.length || 0} projects`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_ALL_PROJECTS',
        resourceType: 'PROJECT',
        error
      });
    }
    logger.error('Failed to get all projects:', error);
    handleError(error, res);
  }
};

export const GetProjectById: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params;
  const type = (req.query.type as 'id' | 'number') || 'id';

  try {
    logger.info(`Project-Controller: Fetching project ${id} by ${type}`);
    const result = await ProjectService.getProjectById(id, type);

    if (!result) {
      throw new Error(`Project with ${type} ${id} not found`);
    }

    logSuccess(req, {
      action: 'GET_PROJECT',
      resourceType: 'PROJECT',
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info(`Project-Controller: Successfully retrieved project ${id}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_PROJECT',
        resourceType: 'PROJECT',
        resourceId: id,
        error
      });
    }
    logger.error(`Failed to get project ${id}:`, error);
    handleError(error, res);
  }
};

export const CreateProject: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    logger.info('Project-Controller: Creating new project');
    const result = await ProjectService.createProject(req.body);

    logSuccess(req, {
      action: 'CREATE_PROJECT',
      resourceType: 'PROJECT',
      resourceId: result.id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info(`Project-Controller: Successfully created project ${result.id}`);
    res.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'CREATE_PROJECT',
        resourceType: 'PROJECT',
        error,
        metadata: {
          data: req.body
        }
      });
    }
    logger.error('Failed to create project:', error);
    handleError(error, res);
  }
};

export const UpdateProject: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params;

  try {
    logger.info(`Project-Controller: Updating project ${id}`);
    const result = await ProjectService.updateProject(id, req.body);

    logSuccess(req, {
      action: 'UPDATE_PROJECT',
      resourceType: 'PROJECT',
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info(`Project-Controller: Successfully updated project ${id}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'UPDATE_PROJECT',
        resourceType: 'PROJECT',
        resourceId: id,
        error,
        metadata: {
          data: req.body
        }
      });
    }
    logger.error(`Failed to update project ${id}:`, error);
    handleError(error, res);
  }
};

export const AddDeelorder: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { projectId, deelorderId } = req.body;

  try {
    logger.info(`Project-Controller: Adding deelorder ${deelorderId} to project ${projectId}`);
    const result = await ProjectService.addDeelorder(projectId, deelorderId);

    logSuccess(req, {
      action: 'ADD_DEELORDER',
      resourceType: 'PROJECT',
      resourceId: projectId,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        deelorderId
      }
    });

    logger.info(`Project-Controller: Successfully added deelorder ${deelorderId} to project ${projectId}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'ADD_DEELORDER',
        resourceType: 'PROJECT',
        resourceId: projectId,
        error,
        metadata: {
          deelorderId
        }
      });
    }
    logger.error(`Failed to add deelorder ${deelorderId} to project ${projectId}:`, error);
    handleError(error, res);
  }
};

export const RemoveDeelorder: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { projectId, deelorderId } = req.body;

  try {
    logger.info(`Project-Controller: Removing deelorder ${deelorderId} from project ${projectId}`);
    const result = await ProjectService.removeDeelorder(projectId, deelorderId);

    logSuccess(req, {
      action: 'REMOVE_DEELORDER',
      resourceType: 'PROJECT',
      resourceId: projectId,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        deelorderId
      }
    });

    logger.info(`Project-Controller: Successfully removed deelorder ${deelorderId} from project ${projectId}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'REMOVE_DEELORDER',
        resourceType: 'PROJECT',
        resourceId: projectId,
        error,
        metadata: {
          deelorderId
        }
      });
    }
    logger.error(`Failed to remove deelorder ${deelorderId} from project ${projectId}:`, error);
    handleError(error, res);
  }
};

export const DeleteProject: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: 'Project ID is required' });
    return;
  }

  try {
    logger.info(`Project-Controller: Deleting project ${id}`);
    await ProjectService.deleteProject(id);

    logSuccess(req, {
      action: 'DELETE_PROJECT',
      resourceType: 'PROJECT',
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info(`Project-Controller: Successfully deleted project ${id}`);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'DELETE_PROJECT',
        resourceType: 'PROJECT',
        resourceId: id,
        error
      });
    }
    logger.error(`Failed to delete project ${id}:`, error);
    handleError(error, res);
  }
};
