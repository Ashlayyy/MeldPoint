import { Request, Response } from 'express';
import { apiKeyService } from '../../../services/apikey.service';
import handleError from '../../../utils/errorHandler';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import logger from '../../../helpers/loggerInstance';

export const CreateAPIKey = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const { name, expiresAt } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User ID is required');
    }

    const { apiKey, keyData } = await apiKeyService.createAPIKey({
      userId,
      name,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

    logSuccess(req, {
      action: 'CREATE_API_KEY',
      resourceType: 'API_KEY',
      resourceId: keyData.id,
      metadata: {
        executionTime: Number(executionTime),
        name,
        expiresAt
      }
    });

    // Only return the API key in the initial response
    res.status(201).json({
      data: {
        ...keyData,
        key: apiKey // Include the actual key only in the creation response
      }
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Failed to create API key: ${error}`);
    logError(req, {
      action: 'CREATE_API_KEY',
      resourceType: 'API_KEY',
      error
    });
    handleError(error, res);
  }
};

export const ListAPIKeys = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User ID is required');
    }

    const keys = await apiKeyService.listAPIKeys(userId);
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

    logSuccess(req, {
      action: 'LIST_API_KEYS',
      resourceType: 'API_KEY',
      metadata: {
        executionTime: Number(executionTime),
        count: keys.length
      }
    });

    res.status(200).json({ data: keys });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Failed to list API keys: ${error}`);
    logError(req, {
      action: 'LIST_API_KEYS',
      resourceType: 'API_KEY',
      error
    });
    handleError(error, res);
  }
};

export const RevokeAPIKey = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const userId = req.user?.id;
    const { keyId } = req.params;

    if (!userId) {
      throw new Error('User ID is required');
    }

    await apiKeyService.revokeAPIKey(userId, keyId);
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

    logSuccess(req, {
      action: 'REVOKE_API_KEY',
      resourceType: 'API_KEY',
      resourceId: keyId,
      metadata: {
        executionTime: Number(executionTime)
      }
    });

    res.status(200).json({ data: { message: 'API key revoked successfully' } });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Failed to revoke API key: ${error}`);
    logError(req, {
      action: 'REVOKE_API_KEY',
      resourceType: 'API_KEY',
      error
    });
    handleError(error, res);
  }
};

export const UpdateAPIKey = async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  try {
    const userId = req.user?.id;
    const { keyId } = req.params;
    const { name, expiresAt } = req.body;

    if (!userId) {
      throw new Error('User ID is required');
    }

    const updatedKey = await apiKeyService.updateAPIKey(userId, keyId, {
      name,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

    logSuccess(req, {
      action: 'UPDATE_API_KEY',
      resourceType: 'API_KEY',
      resourceId: keyId,
      metadata: {
        executionTime: Number(executionTime),
        updatedFields: Object.keys(req.body)
      }
    });

    res.status(200).json({ data: updatedKey });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error(`Failed to update API key: ${error}`);
    logError(req, {
      action: 'UPDATE_API_KEY',
      resourceType: 'API_KEY',
      error
    });
    handleError(error, res);
  }
};
