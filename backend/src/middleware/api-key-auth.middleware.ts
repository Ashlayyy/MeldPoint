import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../services/apikey.service';
import logger from '../helpers/loggerInstance';
import { FindUserById } from '../modules/User/controller/UserController';

declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        userId: string;
      };
    }
  }
}

export const authenticateWithAPIKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    // If no API key is present, continue to next auth middleware
    return next();
  }

  try {
    const result = await apiKeyService.validateAPIKey(apiKey);

    if (!result) {
      // Invalid API key, but we'll let the request continue to other auth methods
      return next();
    }

    // Get the user associated with the API key
    const user = await FindUserById(result.userId);
    if (!user) {
      logger.error(`API key authentication failed: User ${result.userId} not found`);
      return next();
    }

    // Log the API key usage
    await apiKeyService.logAPIKeyUsage(result.keyId, req.path, req.method, true, req.ip, req.headers['user-agent']);

    // Transform user object to match expected type
    const transformedUser = {
      ...user,
      departmentId: user.Department?.id || null,
      permissionIds: user.userPermissions?.map((up) => up.permission.id) || [],
      roleIds: user.userRoles?.map((ur) => ur.role.id) || [],
      groupIds: user.userGroups?.map((ug) => ug.group.id) || []
    };

    // Attach the transformed user to the request
    req.user = transformedUser;

    req.apiKey = {
      id: result.keyId,
      userId: result.userId
    };

    // Override isAuthenticated for API key auth
    const originalIsAuthenticated = req.isAuthenticated;
    req.isAuthenticated = function (this: Request): this is Request & { user: NonNullable<Request['user']> } {
      return true;
    };
    next();
    res.on('finish', () => {
      req.isAuthenticated = originalIsAuthenticated;
    });
  } catch (error) {
    logger.error(`API key authentication error: ${error}`);
    next();
  }
};
