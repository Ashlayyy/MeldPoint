import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { CsrfRequest } from '../types/request';

const generateToken = (req: CsrfRequest, res: Response, next: NextFunction): void => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  req.csrfToken = () => req.session.csrfToken as string;
  next();
};

const validateToken = (req: CsrfRequest, res: Response, next: NextFunction): void => {
  if (req.method === 'GET' || process.env.ENABLE_CSRF === 'false') {
    next();
    return;
  }

  const token = req.headers['x-csrf-token'] || req.body.csrfToken;
  if (!token || token !== req.session.csrfToken) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }

  next();
};

export default {
  generateToken,
  validateToken
};
