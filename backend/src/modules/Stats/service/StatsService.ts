import logger from '../../../helpers/loggerInstance';
import {
  getDashboardStats as getDashboardStatsQuery,
  getDepartmentStats as getDepartmentStatsQuery,
  getRoleStats as getRoleStatsQuery,
  getActivityStats as getActivityStatsQuery,
  getGrowthStats as getGrowthStatsQuery,
  type DashboardStats,
  type DepartmentStats,
  type RoleStats,
  type ActivityStats,
  type GrowthStats
} from '../../../db/queries/specialized/statsQueries';

export async function getDashboardStatsData(): Promise<DashboardStats> {
  try {
    logger.info('Stats-Service: Getting dashboard stats');
    return await getDashboardStatsQuery();
  } catch (error) {
    logger.error('Stats-Service: Failed to get dashboard stats', error as Error);
    throw error;
  }
}

export async function getDepartmentStatsData(): Promise<DepartmentStats[]> {
  try {
    logger.info('Stats-Service: Getting department stats');
    return await getDepartmentStatsQuery();
  } catch (error) {
    logger.error('Stats-Service: Failed to get department stats', error as Error);
    throw error;
  }
}

export async function getRoleStatsData(): Promise<RoleStats[]> {
  try {
    logger.info('Stats-Service: Getting role stats');
    return await getRoleStatsQuery();
  } catch (error) {
    logger.error('Stats-Service: Failed to get role stats', error as Error);
    throw error;
  }
}

export async function getActivityStatsData(days: number): Promise<ActivityStats[]> {
  try {
    logger.info('Stats-Service: Getting activity stats', { days });
    return await getActivityStatsQuery(days);
  } catch (error) {
    logger.error('Stats-Service: Failed to get activity stats', error as Error);
    throw error;
  }
}

export async function getGrowthStatsData(period: number): Promise<GrowthStats[]> {
  try {
    logger.info('Stats-Service: Getting growth stats', { period });
    return await getGrowthStatsQuery(period);
  } catch (error) {
    logger.error('Stats-Service: Failed to get growth stats', error as Error);
    throw error;
  }
}
