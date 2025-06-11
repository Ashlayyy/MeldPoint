/* eslint-disable class-methods-use-this */
import { Request } from 'express';
import prisma from '../db/prismaClient';
import { logSuccess } from '../middleware/handleHistory';

export default class ActivityTrackingService {
  async trackUserActivity(
    req: Request,
    data: {
      action: string;
      feature: string;
      metadata?: Record<string, any>;
    }
  ) {
    const startTime = process.hrtime();

    await prisma.userActivity.create({
      data: {
        userId: req.user?.id as string,
        action: data.action,
        feature: data.feature,
        timestamp: new Date(),
        sessionId: req.sessionID,
        ipAddress: req.ip as string,
        userAgent: req.headers['user-agent'] as string
      }
    });

    logSuccess(req, {
      action: 'TRACK_USER_ACTIVITY',
      resourceType: 'USER',
      resourceId: req.user?.id as string,
      metadata: {
        ...data,
        trackingType: 'USER_ACTIVITY'
      }
    });
  }
}
