import { RequestHandler } from 'express';
import handleError from '../../../utils/errorHandler';
import logger from '../../../utils/logger';
import * as EngagementService from '../service/engagement.service';

const extractIds = (req: any) => ({
  meldingId: req.params.meldingId,
  preventiefId: req.params.preventiefId,
  correctiefId: req.params.correctiefId
});

export const getTimelineController: RequestHandler = async (req, res) => {
  try {
    const ids = extractIds(req);
    logger.info('Engagement-Controller: Getting timeline data', { ids });
    const data = await EngagementService.getTimelineData(ids.meldingId, ids.preventiefId, ids.correctiefId);
    res.status(200).json({ data: data });
  } catch (error) {
    logger.error('Failed to get timeline data', error);
    handleError(error, res);
  }
};

export const getDepartmentViewsController: RequestHandler = async (req, res) => {
  try {
    const ids = extractIds(req);
    logger.info('Engagement-Controller: Getting department views data', { ids });
    const data = await EngagementService.getDepartmentViewsData(ids.meldingId, ids.preventiefId, ids.correctiefId);
    res.status(200).json({ data: data });
  } catch (error) {
    logger.error('Failed to get department views data', error);
    handleError(error, res);
  }
};

export const getEventTypesController: RequestHandler = async (req, res) => {
  try {
    const ids = extractIds(req);
    logger.info('Engagement-Controller: Getting event types data', { ids });
    const data = await EngagementService.getEventTypesData(ids.meldingId, ids.preventiefId, ids.correctiefId);
    res.status(200).json({ data: data });
  } catch (error) {
    logger.error('Failed to get event types data', error);
    handleError(error, res);
  }
};

export const getTopUsersController: RequestHandler = async (req, res) => {
  try {
    const ids = extractIds(req);
    logger.info('Engagement-Controller: Getting top users data', { ids });
    const data = await EngagementService.getTopUsersData(ids.meldingId, ids.preventiefId, ids.correctiefId);
    res.status(200).json({ data: data });
  } catch (error) {
    logger.error('Failed to get top users data', error);
    handleError(error, res);
  }
};

export const getActivityTimeController: RequestHandler = async (req, res) => {
  try {
    const ids = extractIds(req);
    logger.info('Engagement-Controller: Getting activity time data', { ids });
    const data = await EngagementService.getActivityTimeData(ids.meldingId, ids.preventiefId, ids.correctiefId);
    res.status(200).json({ data: data });
  } catch (error) {
    logger.error('Failed to get activity time data', error);
    handleError(error, res);
  }
};

export const getActivityDayController: RequestHandler = async (req, res) => {
  try {
    const ids = extractIds(req);
    logger.info('Engagement-Controller: Getting activity day data', { ids });
    const data = await EngagementService.getActivityDayData(ids.meldingId, ids.preventiefId, ids.correctiefId);
    res.status(200).json({ data: data });
  } catch (error) {
    logger.error('Failed to get activity day data', error);
    handleError(error, res);
  }
};

export const getTrendController: RequestHandler = async (req, res) => {
  try {
    const ids = extractIds(req);
    logger.info('Engagement-Controller: Getting trend data', { ids });
    const data = await EngagementService.getTrendData(ids.meldingId, ids.preventiefId, ids.correctiefId);
    res.status(200).json({ data: data });
  } catch (error) {
    logger.error('Failed to get trend data', error);
    handleError(error, res);
  }
};
