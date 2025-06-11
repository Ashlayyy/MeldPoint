/* eslint-disable @typescript-eslint/return-await */
import { Request } from 'express';
import logger from '../helpers/loggerInstance';
import prisma from '../db/prismaClient';
import { extractResourceStructuredChanges, extractStructuredStateChanges } from '../utils/historyHelpers';
import EventEmitter from 'events';
import { responseEmitter } from './request-logger.middleware';

export const logEmitter = new EventEmitter();
logEmitter.setMaxListeners(100);

interface StandardRequestContext {
  requestId: string;
  correlationId?: string;
  userId: string | null;
  userEmail: string;
  userName: string;
  method: string;
  path: string;
  endpoint: string;
  ipAddress: string;
  userAgent: string;
  startTime: [number, number];
  executionTime?: number;
  statusCode?: number;
  responseSize?: number;
  action: string;
  resourceType: string;
  sessionId?: string;
  resourceId?: string;
  success: boolean;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
    code?: string | number;
  };
  metadata?: Record<string, any>;
  processingTime?: number;
  responseTime?: number;
}

export interface LogContext {
  action: string;
  resourceType: string;
  resourceId?: string;
  previousState?: any;
  newState?: any;
  changedFields?: string[];
  metadata?: {
    executionTime?: number;
    filters?: Record<string, any>;
    requestBody?: any;
    resultCount?: number;
    [key: string]: any;
  };
  error?: Error;
}

/**
 * Interface for user information from request
 */
interface UserInfo {
  id: string;
  email: string;
  name: string;
}

function extractUserInfo(req: Request): UserInfo {
  const user = req.user as any;

  return {
    id: user?.id || 'anonymous',
    email: user?.Email || 'anonymous',
    name: user?.Name || 'anonymous'
  };
}

function extractMetadata(req: Request): Record<string, any> {
  return {
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    requestId: req.headers['X-Request-ID']?.toString() || 'unknown',
    correlationId: req.headers['X-Correlation-ID']?.toString() || 'unknown',
    sessionId: req.sessionID || 'unknown'
  };
}

export default class HistoryLogger {
  static createStandardContext(req: Request, data: Partial<StandardRequestContext>): StandardRequestContext {
    const userInfo = extractUserInfo(req);
    const metadata = extractMetadata(req);
    const startTime = process.hrtime();

    return {
      requestId: metadata.requestId,
      correlationId: metadata.correlationId,
      userId: userInfo.id === 'anonymous' ? null : userInfo.id,
      userEmail: userInfo.email,
      userName: userInfo.name,
      method: req.method,
      path: req.path,
      endpoint: `${req.method} ${req.path}`,
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      sessionId: metadata.sessionId,
      startTime,
      action: data.action || 'unknown',
      resourceType: data.resourceType || 'unknown',
      resourceId: data.resourceId,
      success: data.success ?? false,
      metadata: {
        environment: process.env.NODE_ENV,
        version: process.env.API_VERSION || '1.0',
        ...data.metadata
      }
    };
  }

  static getHistoryForResource(resourceType: string, resourceId: string) {
    return prisma.systemLog.findMany({
      where: {
        resourceType,
        resourceId
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }

  static getUserActionHistory(userId: string) {
    return prisma.systemLog.findMany({
      where: {
        userId
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }

  static getFailedActions(options?: { startDate?: Date; endDate?: Date; resourceType?: string }) {
    return prisma.systemLog.findMany({
      where: {
        success: false,
        ...(options?.startDate && {
          timestamp: {
            gte: options.startDate
          }
        }),
        ...(options?.endDate && {
          timestamp: {
            lte: options.endDate
          }
        }),
        ...(options?.resourceType && {
          resourceType: options.resourceType
        })
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }
}

function initializeLogProcessor() {
  const queue: any[] = [];
  let processing = false;
  let consecutiveFailures = 0;
  const MAX_RETRIES = 5;
  const MAX_BATCH_SIZE = 100;

  async function processQueue() {
    if (processing || queue.length === 0) return;

    processing = true;

    queue.sort((a, b) => {
      if (!a.success && b.success) return -1;
      if (a.success && !b.success) return 1;
      return 0;
    });

    const batch = queue.splice(0, Math.min(MAX_BATCH_SIZE, queue.length));

    try {
      const dbRecords = batch.map((item) => {
        if (typeof item.changesData === 'object') {
          item.changesData = JSON.stringify(item.changesData);
        }

        if (item.changedFieldNames && !Array.isArray(item.changedFieldNames)) {
          try {
            item.changedFieldNames = JSON.parse(item.changedFieldNames);
          } catch (e) {
            item.changedFieldNames = item.changedFieldNames.split(',');
          }
        }

        return item;
      });

      await prisma.systemLog.createMany({
        data: dbRecords
      });

      consecutiveFailures = 0;
    } catch (error) {
      consecutiveFailures++;

      console.error(`Failed to write logs to database (attempt ${consecutiveFailures}):`, error);

      if (consecutiveFailures >= MAX_RETRIES) {
        console.error(`Discarding ${batch.length} log entries after ${MAX_RETRIES} failed attempts`);
      } else {
        queue.unshift(...batch);
      }
    } finally {
      processing = false;

      if (queue.length > 0) {
        const delay = consecutiveFailures > 0 ? Math.min(100 * Math.pow(2, consecutiveFailures - 1), 10000) : 0;
        setTimeout(processQueue, delay);
      }
    }
  }

  logEmitter.on('log', (logData) => {
    queue.push(logData);
    setTimeout(processQueue, 0);
  });

  setInterval(processQueue, 5000);

  process.on('SIGTERM', async () => {
    if (queue.length > 0) {
      logger.info(`Flushing ${queue.length} pending logs before shutdown`);
      await processQueue();
    }
  });
}

initializeLogProcessor();

// Add new interface for response data
interface ResponseData {
  req: Request;
  responseTime: number;
  statusCode: number;
  contentLength: number;
}

// Create a map to store pending logs
const pendingLogs = new Map<
  string,
  {
    logFunction: Function;
    args: any[];
    timestamp: number;
  }
>();

// Modify log functions to queue logs until response data is available
export function logSuccess(req: Request, context: LogContext): void {
  const requestId = req.headers['x-request-id']?.toString() || 'unknown';
  pendingLogs.set(requestId, {
    logFunction: _logSuccess,
    args: [req, context],
    timestamp: Date.now()
  });
}

export function logError(req: Request, context: LogContext & { error: Error }): void {
  const requestId = req.headers['x-request-id']?.toString() || 'unknown';
  pendingLogs.set(requestId, {
    logFunction: _logError,
    args: [req, context],
    timestamp: Date.now()
  });
}

export function logStateChange(req: Request, context: LogContext): void {
  const requestId = req.headers['x-request-id']?.toString() || 'unknown';
  pendingLogs.set(requestId, {
    logFunction: _logStateChange,
    args: [req, context],
    timestamp: Date.now()
  });
}

// Create internal logging functions that include response data
function _logSuccess(req: Request, context: LogContext, responseData: ResponseData): void {
  const { action, resourceType, resourceId, changedFields, metadata } = context;

  const standardContext = HistoryLogger.createStandardContext(req, {
    action,
    resourceType,
    resourceId,
    success: true,
    metadata: {
      ...metadata,
      responseTime: responseData.responseTime,
      statusCode: responseData.statusCode,
      contentLength: responseData.contentLength
    }
  });

  const structuredChanges = extractResourceStructuredChanges(req, resourceType);

  logEmitter.emit('log', {
    timestamp: new Date(),
    userId: standardContext.userId,
    userEmail: standardContext.userEmail,
    userName: standardContext.userName,
    action: standardContext.action,
    sessionId: standardContext.sessionId,
    resourceType: standardContext.resourceType,
    correlationID: standardContext.correlationId,
    resourceId: standardContext.resourceId,
    ipAddress: standardContext.ipAddress,
    userAgent: standardContext.userAgent,
    endpoint: standardContext.endpoint,
    method: standardContext.method,
    success: true as const,
    previousState: null,
    newState: null,
    changedFields: changedFields ? JSON.stringify(changedFields) : null,
    changesData: JSON.stringify(structuredChanges),
    changeCount: structuredChanges.length,
    changedFieldNames: structuredChanges.map((change) => change.key),
    requestBody: null,
    requestQuery: metadata?.filters ? JSON.stringify(metadata.filters) : null,
    metadata: {
      ...standardContext.metadata,
      structuredChanges
    }
  });
  if (process.env.NODE_ENV === 'development') {
    const changeText = structuredChanges.map((c) => `${c.displayName}: ${String(c.newValue)}`).join(', ');
    logger.info(`[LOG] ${action} - ${resourceType}${resourceId ? ` (${resourceId})` : ''}: ${changeText}`);
  }
}

function _logError(req: Request, context: LogContext & { error: Error }, responseData: ResponseData): void {
  const { action, resourceType, resourceId, error, metadata } = context;

  const standardContext = HistoryLogger.createStandardContext(req, {
    action,
    resourceType,
    resourceId,
    success: false,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    metadata
  });

  // Emit event instead of awaiting DB call
  logEmitter.emit('log', {
    timestamp: new Date(),
    userId: standardContext.userId,
    userEmail: standardContext.userEmail,
    userName: standardContext.userName,
    action: standardContext.action,
    correlationID: standardContext.correlationId,
    resourceType: standardContext.resourceType,
    resourceId: standardContext.resourceId,
    ipAddress: standardContext.ipAddress,
    userAgent: standardContext.userAgent,
    endpoint: standardContext.endpoint,
    method: standardContext.method,
    success: false,
    errorMessage: error.message,
    errorStack: process.env.NODE_ENV === 'development' ? error.stack : null,
    requestBody: null,
    requestQuery: metadata?.filters ? JSON.stringify(metadata.filters) : null,
    metadata: standardContext.metadata || null
  });

  logger.error(`[ERROR] ${action} - ${resourceType}${resourceId ? ` (${resourceId})` : ''}: ${error.message}`);
}

function _logStateChange(req: Request, context: LogContext, responseData: ResponseData): void {
  const { action, resourceType, resourceId, previousState, newState, metadata } = context;

  if (!previousState || !newState) {
    return logSuccess(req, context);
  }

  const structuredChanges = extractStructuredStateChanges(previousState, newState, resourceType);

  if (structuredChanges.length === 0) {
    return;
  }

  const standardContext = HistoryLogger.createStandardContext(req, {
    action,
    resourceType,
    resourceId,
    success: true,
    metadata
  });

  logEmitter.emit('log', {
    timestamp: new Date(),
    userId: standardContext.userId,
    userEmail: standardContext.userEmail,
    userName: standardContext.userName,
    action: standardContext.action,
    resourceType: standardContext.resourceType,
    correlationID: standardContext.correlationId,
    resourceId: standardContext.resourceId,
    ipAddress: standardContext.ipAddress,
    userAgent: standardContext.userAgent,
    endpoint: standardContext.endpoint,
    method: standardContext.method,
    success: true as const,
    previousState: JSON.stringify(previousState),
    newState: JSON.stringify(newState),
    changesData: JSON.stringify(structuredChanges),
    changeCount: structuredChanges.length,
    changedFieldNames: structuredChanges.map((change) => change.key),
    requestBody: null,
    requestQuery: metadata?.filters ? JSON.stringify(metadata.filters) : null,
    metadata: {
      ...standardContext.metadata,
      structuredChanges
    }
  });

  if (process.env.NODE_ENV === 'development') {
    const changeText = structuredChanges
      .map((c) => `${c.displayName}: ${c.oldValue || 'null'} → ${c.newValue || 'null'}`)
      .join(', ');
    logger.info(`[STATE] ${action} - ${resourceType}${resourceId ? ` (${resourceId})` : ''}: ${changeText}`);
  }
}

// Set up response completion listener
responseEmitter.on('response:complete', (responseData: ResponseData) => {
  const requestId = responseData.req.headers['x-request-id']?.toString() || 'unknown';
  const pendingLog = pendingLogs.get(requestId);

  if (pendingLog) {
    const { logFunction, args } = pendingLog;
    logFunction(...args, responseData);
    pendingLogs.delete(requestId);
  }
});

// Clean up old pending logs periodically
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  pendingLogs.forEach((value, key) => {
    if (value.timestamp < fiveMinutesAgo) {
      pendingLogs.delete(key);
    }
  });
}, 60 * 1000);
