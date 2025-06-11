/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/return-await */
import { Request, Response, RequestHandler } from 'express';
import * as UserService from '../service/UserService';
import handleError from '../../../utils/errorHandler';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import logger from '../../../helpers/loggerInstance';

export const GetCurrentUser: RequestHandler = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

    logSuccess(req, {
      action: 'GET_CURRENT_USER',
      resourceType: 'USER',
      metadata: {
        endpoint: '/users/auth/current',
        executionTime: Number(executionTime),
        userId: req.user?.id,
        isAuthenticated: !!req.user,
        checkedAt: new Date().toISOString()
      }
    });

    res.status(200).json({ data: req.user || null });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Users-Routes: Failed to get current user - ${error}`);
    logError(req, {
      action: 'GET_CURRENT_USER',
      resourceType: 'USER',
      error
    });
    handleError(error, res);
  }
};

export const GetAuthStatus: RequestHandler = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

    logSuccess(req, {
      action: 'CHECK_AUTH_STATUS',
      resourceType: 'USER',
      metadata: {
        endpoint: '/users/auth/status',
        executionTime: Number(executionTime),
        isAuthenticated: req.isAuthenticated(),
        userId: req.user?.id,
        checkedAt: new Date().toISOString()
      }
    });

    if (req.isAuthenticated()) {
      res.status(200).json({
        data: {
          isAuthenticated: true,
          user: req.user
        }
      });
    } else {
      logger.error('Users-Routes: Not authenticated');
      res.status(401).json({ error: 'Not authenticated' });
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Users-Routes: Failed to check authentication status - ${error}`);
    logError(req, {
      action: 'CHECK_AUTH_STATUS',
      resourceType: 'USER',
      error
    });
    handleError(error, res);
  }
};

export const CreateUser: RequestHandler = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const result = await UserService.create(req.body);

    logSuccess(req, {
      action: 'CREATE_USER',
      resourceType: 'USER',
      resourceId: result.id,
      previousState: null,
      newState: result,
      changedFields: Object.keys(req.body),
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    res.status(200).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logError(req, {
      action: 'CREATE_USER',
      resourceType: 'USER',
      error
    });
    handleError(error, res);
  }
};

export const GetAllUsers: RequestHandler = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const { page, limit } = req.query;
    const result = await UserService.getAll(Number(page || 1), Number(limit || 150));

    logSuccess(req, {
      action: 'GET_ALL_USERS',
      resourceType: 'USER',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    res.status(200).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logError(req, {
      action: 'GET_ALL_USERS',
      resourceType: 'USER',
      error
    });
    handleError(error, res);
  }
};

export const FindUserByEmail = async (email: string) => {
  return await UserService.getByEmail(email);
};

export const FindUserById = async (id: string) => {
  return await UserService.getById(id);
};

export const UpdateUser = async (id: string, data: any) => {
  return UserService.update(id, data);
};

export const GetActiveUsers: RequestHandler = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const users = await UserService.getActive(req.params.id);

    logSuccess(req, {
      action: 'GET_ACTIVE_USERS',
      resourceType: 'USER',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        userCount: users.length
      }
    });

    res.status(200).json({ data: users });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logError(req, {
      action: 'GET_ACTIVE_USERS',
      resourceType: 'USER',
      error
    });
    handleError(error, res);
  }
};

export const GetAllUsersForFilter: RequestHandler = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const result = await UserService.getAllForFilter();

    logSuccess(req, {
      action: 'GET_ALL_USERS_FILTER',
      resourceType: 'USER',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    res.status(200).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logError(req, {
      action: 'GET_ALL_USERS_FILTER',
      resourceType: 'USER',
      error
    });
    handleError(error, res);
  }
};

export const GetUsersByRole: RequestHandler = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const { role } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const result = await UserService.getByRole(role, page, limit);

    logSuccess(req, {
      action: 'GET_USERS_BY_ROLE',
      resourceType: 'USER',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        role,
        page,
        limit
      }
    });

    res.status(200).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logError(req, {
      action: 'GET_USERS_BY_ROLE',
      resourceType: 'USER',
      error
    });
    handleError(error, res);
  }
};

export const GetUsersByDepartment: RequestHandler = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const { department } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const result = await UserService.getByDepartment(department, page, limit);

    logSuccess(req, {
      action: 'GET_USERS_BY_DEPARTMENT',
      resourceType: 'USER',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        department,
        page,
        limit
      }
    });

    res.status(200).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logError(req, {
      action: 'GET_USERS_BY_DEPARTMENT',
      resourceType: 'USER',
      error
    });
    handleError(error, res);
  }
};

export const SearchUsers: RequestHandler = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const filters = {
      query: req.query.q as string,
      role: req.query.role as string,
      department: req.query.department as string,
      status: req.query.status as string
    };
    const result = await UserService.search(filters);

    logSuccess(req, {
      action: 'SEARCH_USERS',
      resourceType: 'USER',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        filters
      }
    });

    res.status(200).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logError(req, {
      action: 'SEARCH_USERS',
      resourceType: 'USER',
      error
    });
    handleError(error, res);
  }
};

export const DeleteUser: RequestHandler = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const { userId } = req.params;
    const result = await UserService.remove(userId);

    logSuccess(req, {
      action: 'DELETE_USER',
      resourceType: 'USER',
      resourceId: userId,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    res.status(200).json({ data: result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logError(req, {
      action: 'DELETE_USER',
      resourceType: 'USER',
      error
    });
    handleError(error, res);
  }
};

export const Logout: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const startTime = process.hrtime();
  const userId = req.user?.id;

  try {
    req.logout((err) => {
      if (err) {
        throw err;
      }
      req.session.destroy(async (sessionErr) => {
        if (sessionErr) {
          throw sessionErr;
        }

        const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

        logSuccess(req, {
          action: 'LOGOUT',
          resourceType: 'USER',
          resourceId: userId,
          metadata: {
            endpoint: '/users/logout',
            executionTime: Number(executionTime),
            loggedOutAt: new Date().toISOString()
          }
        });

        res.clearCookie('connect.sid');
        res.clearCookie('jwt');
        res.status(200).json({ data: { message: 'Logged out successfully' } });
      });
    });
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error occurred');
    logger.error(`Users-Routes: Failed to logout - ${error}`);
    logError(req, {
      action: 'LOGOUT',
      resourceType: 'USER',
      resourceId: userId,
      error,
      metadata: {
        endpoint: '/users/logout',
        attemptedAt: new Date().toISOString()
      }
    });
    res.status(500).json({ error: 'Error during logout' });
  }
};
