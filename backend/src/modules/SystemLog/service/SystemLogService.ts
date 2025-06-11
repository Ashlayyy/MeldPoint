import { Response } from 'express';
import logger from '../../../helpers/loggerInstance';
import prisma from '../../../db/prismaClient';
import { SystemLog, SystemLogParams } from '../types';
import handlePrismaError from '../../../helpers/handlePrismaError';

const transformPrismaLog = (log: any): SystemLog => ({
  ...log,
  id: log.id || undefined,
  userId: log.userId || undefined,
  userEmail: log.userEmail || undefined,
  userName: log.userName || undefined,
  userRole: log.userRole || undefined,
  department: log.department || undefined,
  ipAddress: log.ipAddress || undefined,
  userAgent: log.userAgent || undefined,
  endpoint: log.endpoint || undefined,
  method: log.method || undefined,
  previousState: log.previousState || undefined,
  newState: log.newState || undefined,
  changedFields: log.changedFields || undefined,
  metadata: typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata || undefined,
  errorMessage: log.errorMessage || undefined,
  sessionId: log.sessionId || undefined,
  requestBody: log.requestBody || undefined,
  requestQuery: log.requestQuery || undefined,
  requestParams: log.requestParams || undefined
});

const getSystemLogsByMeldingId = async (params: SystemLogParams): Promise<SystemLog[]> => {
  const { meldingId, preventiefId, correctiefId } = params;

  try {
    logger.debug(`SystemLogService: Fetching system logs: ${meldingId}, ${preventiefId}, ${correctiefId}`);

    const logs = await prisma.systemLog.findMany({
      where: {
        OR: [{ resourceId: meldingId }, { resourceId: preventiefId }, { resourceId: correctiefId }]
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    logger.info(`SystemLogService: Successfully retrieved ${logs.length} logs`);
    logger.debug('SystemLogService: Retrieved logs', { count: logs.length });

    return logs.map(transformPrismaLog);
  } catch (error) {
    logger.error(`SystemLogService: Failed to fetch system logs - ${error}`);
    if (error instanceof Error) {
      throw handlePrismaError(error, {} as Response);
    }
    throw error;
  }
};

export default getSystemLogsByMeldingId;
