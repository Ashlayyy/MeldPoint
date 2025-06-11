/* eslint-disable consistent-return */
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import logger from '../helpers/loggerInstance';

export default function verifyToken(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-api-request-secret'] === process.env.API_REQUEST_SECRET) {
    return next();
  }

  const token = req.cookies.jwt;
  if (!token) {
    logger.error(`Token-Middleware: No token provided`);
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      iat: number;
    };

    // Add decoded token data to request object for use in subsequent middleware/routes
    req.tokenData = decoded;
    next();
  } catch (err) {
    logger.error(`Token-Middleware: Invalid or expired token - ${err}`);
    // Clear the invalid cookie
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
