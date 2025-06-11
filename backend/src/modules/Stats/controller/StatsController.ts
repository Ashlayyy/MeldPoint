import { Request, Response } from 'express';
import logger from '../../../helpers/loggerInstance';
import {
  getDashboardStatsData,
  getDepartmentStatsData,
  getRoleStatsData,
  getActivityStatsData,
  getGrowthStatsData
} from '../service/StatsService';
import handleError from '../../../utils/errorHandler';

export async function getDashboardStats(req: Request, res: Response) {
  const startTime = process.hrtime();
  try {
    const stats = await getDashboardStatsData();
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
    logger.info('Stats-Controller: Successfully retrieved dashboard stats', { executionTime });
    res.json({ data: stats });
  } catch (error) {
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
    logger.error('Stats-Controller: Failed to get dashboard stats', error as Error, { executionTime });
    handleError(error, res);
  }
}

export async function getDepartmentStats(req: Request, res: Response) {
  const startTime = process.hrtime();
  try {
    const stats = await getDepartmentStatsData();
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
    logger.info('Stats-Controller: Successfully retrieved department stats', { executionTime });
    res.json({ data: stats });
  } catch (error) {
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
    logger.error('Stats-Controller: Failed to get department stats', error as Error, { executionTime });
    handleError(error, res);
  }
}

export async function getRoleStats(req: Request, res: Response) {
  const startTime = process.hrtime();
  try {
    const stats = await getRoleStatsData();
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
    logger.info('Stats-Controller: Successfully retrieved role stats', { executionTime });
    res.json({ data: stats });
  } catch (error) {
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
    logger.error('Stats-Controller: Failed to get role stats', error as Error, { executionTime });
    handleError(error, res);
  }
}

export async function getActivityStats(req: Request, res: Response) {
  const startTime = process.hrtime();
  try {
    const days = parseInt(req.query.days as string, 10) || 30;
    const stats = await getActivityStatsData(days);
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
    logger.info('Stats-Controller: Successfully retrieved activity stats', { executionTime, days });
    res.json({ data: stats });
  } catch (error) {
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
    logger.error('Stats-Controller: Failed to get activity stats', error as Error, { executionTime });
    handleError(error, res);
  }
}

export async function getGrowthStats(req: Request, res: Response) {
  const startTime = process.hrtime();
  try {
    const period = parseInt(req.query.period as string, 10) || 30;
    const stats = await getGrowthStatsData(period);
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
    logger.info('Stats-Controller: Successfully retrieved growth stats', { executionTime, period });
    res.json({ data: stats });
  } catch (error) {
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
    logger.error('Stats-Controller: Failed to get growth stats', error as Error, { executionTime });
    handleError(error, res);
  }
}
