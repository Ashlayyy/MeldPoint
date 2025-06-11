import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import logger from '../helpers/loggerInstance';

const TRUSTED_PROXIES = process.env.TRUSTED_PROXIES?.split(',') || [];

const getIP = (req: Request): string => {
  if (TRUSTED_PROXIES.includes(req.ip || '')) {
    const forwardedFor = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for'];
    return forwardedFor || req.ip || req.socket.remoteAddress || 'unknown';
  }
  return req.ip || 'unknown';
};

interface RateLimitLogInfo {
  service: string;
  ip: string;
  path: string;
  method: string;
  userAgent?: string;
  timestamp: string;
}

const createRateLimitLogger = (name: string) => (req: Request) => {
  const logInfo: RateLimitLogInfo = {
    service: name,
    ip: getIP(req),
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  };
  logger.warn(`Rate limit exceeded - ${JSON.stringify(logInfo)}`);
};

const rateLimitConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getIP,
  skip: (req: Request) => process.env.NODE_ENV === 'development',
  trustProxy: true
};

const speedLimitConfig = {
  keyGenerator: getIP,
  skip: (req: Request) => process.env.NODE_ENV === 'development'
};

export const apiLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1000,
  max: 100000,
  handler: (req: Request, res: Response) => {
    createRateLimitLogger('API')(req);
    res.status(httpStatus.TOO_MANY_REQUESTS).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.',
      code: httpStatus.TOO_MANY_REQUESTS
    });
  }
});

export const authLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1000,
  max: 50000,
  handler: (req: Request, res: Response) => {
    createRateLimitLogger('Authentication')(req);
    res.status(httpStatus.TOO_MANY_REQUESTS).json({
      status: 'error',
      message: 'Too many login attempts from this IP, please try again later.',
      code: httpStatus.TOO_MANY_REQUESTS
    });
  }
});

export const speedLimiter = slowDown({
  ...speedLimitConfig,
  windowMs: 15 * 60 * 1000,
  delayAfter: 500000000,
  delayMs: (hits: number) => hits * 100,
  maxDelayMs: 2000
});

export const refreshTokenLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 60 * 1000,
  max: 10000,
  handler: (req: Request, res: Response) => {
    createRateLimitLogger('Token Refresh')(req);
    res.status(httpStatus.TOO_MANY_REQUESTS).json({
      status: 'error',
      message: 'Too many token refresh attempts from this IP, please try again later.',
      code: httpStatus.TOO_MANY_REQUESTS
    });
  }
});
