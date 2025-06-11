import { Request, Response } from 'express';
import { logError } from '../../../middleware/handleHistory';
import logger from '../../../helpers/loggerInstance';
import { trackFeatureUsage, trackPageView } from '../service/ActivityService';
import { FeatureMetadata, PageViewMetadata } from '../types';

const calculateExecutionTime = (startTime: [number, number]): string => {
  return (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);
};

export const trackFeature = async (req: Request, res: Response): Promise<void> => {
  const startTime = process.hrtime();
  try {
    const { feature, metadata } = req.body as { feature: string; metadata: FeatureMetadata };

    await trackFeatureUsage(req, feature, metadata);

    const executionTime = calculateExecutionTime(startTime);
    res.status(200).json({ success: true, executionTime });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Activity-Controller: Failed to track feature usage - ${err}`);

    logError(req, {
      action: 'TRACK_FEATURE_USAGE',
      resourceType: 'ACTIVITY',
      error: err,
      metadata: { feature: req.body?.feature }
    });

    res.status(500).json({ error: 'Failed to track feature usage' });
  }
};

export const trackPage = async (req: Request, res: Response): Promise<void> => {
  const startTime = process.hrtime();
  try {
    const { page, path, duration, referrer } = req.body;
    const metadata: PageViewMetadata = { path, duration, referrer };

    await trackPageView(req, page, metadata);

    const executionTime = calculateExecutionTime(startTime);
    res.status(200).json({ success: true, executionTime });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Activity-Controller: Failed to track page view - ${err}`);

    logError(req, {
      action: 'TRACK_PAGE_VIEW',
      resourceType: 'ACTIVITY',
      error: err,
      metadata: { page: req.body?.page }
    });

    res.status(500).json({ error: 'Failed to track page view' });
  }
};
