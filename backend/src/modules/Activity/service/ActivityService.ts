import { Request } from 'express';
import logger from '../../../helpers/loggerInstance';
import { ActivityPayload, PageViewMetadata, FeatureMetadata } from '../types';

const trackActivity = async (req: Request, payload: ActivityPayload): Promise<void> => {
  const userId = req.user?.id;
  const timestamp = new Date();

  logger.info(`ActivityService: Tracking ${payload.action} for user ${userId}`);
  logger.debug(`ActivityService: Activity details - Feature: ${payload.feature}, Timestamp: ${timestamp}`);

  // Here you would typically save to database
  // For now, we just log
  logger.info(`ActivityService: Activity tracked successfully`, {
    userId,
    timestamp,
    ...payload
  });
};

export const trackFeatureUsage = async (req: Request, feature: string, metadata: FeatureMetadata): Promise<void> => {
  try {
    await trackActivity(req, {
      action: 'FEATURE_USAGE',
      feature,
      metadata
    });
  } catch (error) {
    logger.error(`ActivityService: Failed to track feature usage - ${error}`);
    throw error;
  }
};

export const trackPageView = async (req: Request, page: string, metadata: PageViewMetadata): Promise<void> => {
  try {
    await trackActivity(req, {
      action: 'PAGE_VIEW',
      feature: page,
      metadata
    });
  } catch (error) {
    logger.error(`ActivityService: Failed to track page view - ${error}`);
    throw error;
  }
};
