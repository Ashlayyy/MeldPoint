import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../helpers/loggerInstance';
import EventEmitter from 'events';

export const responseEmitter = new EventEmitter();
responseEmitter.setMaxListeners(100);

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const startTime = process.hrtime();

  // Create initial context for this request
  const requestContext = {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    userId: (req.user as any)?.id,
    correlationId: req.get('x-correlation-id') || requestId
  };

  // Set up context for the entire request lifecycle
  logger
    .createRequestContext(
      {
        ...requestContext,
        source: 'http_request'
      },
      async () => {
        // Log request start
        logger.info(`[HTTP] ${req.method} ${req.url} STARTED`, requestContext);

        // Capture response
        const originalSend = res.send;
        res.send = function sendWithLogging(body: any): Response {
          const diff = process.hrtime(startTime);
          const responseTime = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds

          // Emit response completion event with all necessary data
          responseEmitter.emit('response:complete', {
            req,
            responseTime,
            statusCode: res.statusCode,
            contentLength: Buffer.byteLength(body, 'utf8')
          });

          // Log response
          logger.info(`[HTTP] ${req.method} ${req.url} COMPLETED ${res.statusCode} ${responseTime.toFixed(2)}ms`, {
            ...requestContext,
            statusCode: res.statusCode,
            responseTime,
            contentLength: Buffer.byteLength(body, 'utf8')
          });

          return originalSend.call(this, body);
        };

        // Handle errors
        const errorHandler = (err: Error) => {
          console.log('error', err);
          logger.error(`[HTTP] ${req.method} ${req.url} FAILED - ${err.name}: ${err.message}`, err, {
            ...requestContext,
            errorName: err.name,
            errorMessage: err.message
          });
        };

        res.on('error', errorHandler);
        req.on('error', errorHandler);

        res.setHeader('X-Request-ID', requestId);
        if (requestContext.correlationId) {
          res.setHeader('X-Correlation-ID', requestContext.correlationId);
        }

        next();
      }
    )
    .catch(next);
};

export default requestLogger;
