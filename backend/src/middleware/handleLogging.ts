/* eslint-disable @typescript-eslint/return-await */
import logger from '../helpers/loggerInstance';
import prisma from '../db/prismaClient';

interface LoggingData {
  userId: string;
  action: string;
  resourceType: string;
  success: boolean;
  metadata?: Record<string, any>;
}

export default async function handleLogging(data: LoggingData) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { Email: true, Name: true, Department: true }
    });

    logger.debug(`HandleLogging-Middleware: Logging permission request`);

    return await prisma.permissionLog.create({
      data: {
        userId: data.userId,
        userEmail: user?.Email || 'unknown',
        userName: user?.Name || 'unknown',
        department: JSON.stringify(user?.Department) || null,
        action: data.action,
        resourceType: data.resourceType,
        success: data.success,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error(`HandleLogging-Middleware: Permission logging error - ${error}`);
    return null;
  }
}
