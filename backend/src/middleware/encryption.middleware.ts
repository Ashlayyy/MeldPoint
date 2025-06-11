/* eslint-disable func-names */
import { Request, Response, NextFunction } from 'express';
import { encrypt, decrypt } from '../utils/encryption';
import logger from '../helpers/loggerInstance';

interface EncryptedRequest extends Request {
  decryptedBody?: any;
}

const encryptionMiddleware = {
  decrypt: async (req: EncryptedRequest, res: Response, next: NextFunction) => {
    if (process.env.ENABLE_ENCRYPTION === 'false') {
      if (req.body && typeof req.body === 'object' && 'encryptedData' in req.body) {
        req.body = JSON.parse(req.body.encryptedData);
      }
      next();
      return;
    }

    try {
      if (req.body?.encryptedData) {
        req.body = await decrypt(req.body.encryptedData);
      }
      next();
    } catch (error) {
      logger.error(`Encryption-Middleware: Invalid encrypted data - ${error}`);
      res.status(400).json({ error: 'Invalid encrypted data' });
    }
  },

  encrypt: (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    if (process.env.ENABLE_ENCRYPTION === 'false') {
      res.json = function (body: any) {
        return originalJson.call(res, body);
      };
      next();
      return;
    }

    res.json = function (body: any) {
      if (typeof body === 'object' && 'encryptedData' in body) {
        return originalJson.call(res, body);
      }

      Promise.resolve()
        .then(() => encrypt(body))
        .then((encryptedData) => originalJson.call(res, { encryptedData }))
        .catch((error) => {
          logger.error(`Encryption-Middleware: Encryption failed - ${error}`);
          return originalJson.call(res, { error: 'Encryption failed' });
        });
      return this;
    };

    next();
  }
};

export default encryptionMiddleware;
