import { RequestHandler } from 'express';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import handleError from '../../../utils/errorHandler';
import logger from '../../../utils/logger';
import * as DepartmentService from '../service/DepartmentService';

export const GetAllDepartments: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    logger.info('Department-Controller: Fetching all departments');
    const result = await DepartmentService.getAllDepartments();

    logSuccess(req, {
      action: 'GET_ALL_DEPARTMENTS',
      resourceType: 'DEPARTMENT',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        resultCount: result?.length || 0
      }
    });

    logger.info(`Department-Controller: Successfully retrieved ${result?.length || 0} departments`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_ALL_DEPARTMENTS',
        resourceType: 'DEPARTMENT',
        error
      });
    }
    logger.error('Failed to get all departments:', error);
    handleError(error, res);
  }
};

export const GetDepartmentById: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params;

  try {
    logger.info(`Department-Controller: Fetching department ${id}`);
    const result = await DepartmentService.getDepartmentById(id);

    if (!result) {
      throw new Error(`Department with ID ${id} not found`);
    }

    logSuccess(req, {
      action: 'GET_DEPARTMENT',
      resourceType: 'DEPARTMENT',
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info(`Department-Controller: Successfully retrieved department ${id}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_DEPARTMENT',
        resourceType: 'DEPARTMENT',
        resourceId: id,
        error
      });
    }
    logger.error(`Failed to get department ${id}:`, error);
    handleError(error, res);
  }
};

export const CreateDepartment: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    logger.info('Department-Controller: Creating new department');
    const result = await DepartmentService.createDepartment(req.body);

    logSuccess(req, {
      action: 'CREATE_DEPARTMENT',
      resourceType: 'DEPARTMENT',
      resourceId: result.id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info(`Department-Controller: Successfully created department ${result.id}`);
    res.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'CREATE_DEPARTMENT',
        resourceType: 'DEPARTMENT',
        error,
        metadata: {
          data: req.body
        }
      });
    }
    logger.error('Failed to create department:', error);
    handleError(error, res);
  }
};

export const UpdateDepartment: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params;

  try {
    logger.info(`Department-Controller: Updating department ${id}`);
    const result = await DepartmentService.updateDepartment(id, req.body);

    logSuccess(req, {
      action: 'UPDATE_DEPARTMENT',
      resourceType: 'DEPARTMENT',
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info(`Department-Controller: Successfully updated department ${id}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'UPDATE_DEPARTMENT',
        resourceType: 'DEPARTMENT',
        resourceId: id,
        error,
        metadata: {
          data: req.body
        }
      });
    }
    logger.error(`Failed to update department ${id}:`, error);
    handleError(error, res);
  }
};

export const DeleteDepartment: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params;

  try {
    logger.info(`Department-Controller: Deleting department ${id}`);
    await DepartmentService.deleteDepartment(id);

    logSuccess(req, {
      action: 'DELETE_DEPARTMENT',
      resourceType: 'DEPARTMENT',
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info(`Department-Controller: Successfully deleted department ${id}`);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'DELETE_DEPARTMENT',
        resourceType: 'DEPARTMENT',
        resourceId: id,
        error
      });
    }
    logger.error(`Failed to delete department ${id}:`, error);
    handleError(error, res);
  }
};

export const AssignUserToDepartment: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { userId } = req.params;
  const { department } = req.body;

  try {
    logger.info(`Department-Controller: Assigning user ${userId} to department ${department}`);
    const result = await DepartmentService.assignUserToDepartment(userId, department);

    logSuccess(req, {
      action: 'ASSIGN_USER_TO_DEPARTMENT',
      resourceType: 'DEPARTMENT',
      resourceId: department,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        userId
      }
    });

    logger.info(`Department-Controller: Successfully assigned user ${userId} to department ${department}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'ASSIGN_USER_TO_DEPARTMENT',
        resourceType: 'DEPARTMENT',
        resourceId: department,
        error,
        metadata: {
          userId
        }
      });
    }
    logger.error(`Failed to assign user ${userId} to department ${department}:`, error);
    handleError(error, res);
  }
};
