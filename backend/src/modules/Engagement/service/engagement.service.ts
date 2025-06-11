import logger from '../../../helpers/loggerInstance';
import {
  getTimelineDataQuery,
  getDepartmentViewsDataQuery,
  getEventTypesDataQuery,
  getTopUsersDataQuery,
  getActivityTimeDataQuery,
  getActivityDayDataQuery,
  getTrendDataQuery
} from '../../../db/queries/specialized/engagementQueries';

const buildBaseWhereClause = (meldingId: string, preventiefId: string, correctiefId: string) => {
  const resourceIds = [meldingId, preventiefId, correctiefId].filter((id) => id && id !== 'null' && id !== 'undefined');

  if (resourceIds.length === 0) {
    logger.warn('Engagement Service: No valid resource IDs provided for filtering.');
    throw new Error('Valid resource IDs are required');
  }

  return {
    resourceId: {
      in: resourceIds
    }
  };
};

export const getTimelineData = async (meldingId: string, preventiefId: string, correctiefId: string) => {
  const where = buildBaseWhereClause(meldingId, preventiefId, correctiefId);
  return getTimelineDataQuery(where);
};

export const getDepartmentViewsData = async (meldingId: string, preventiefId: string, correctiefId: string) => {
  const where = buildBaseWhereClause(meldingId, preventiefId, correctiefId);
  logger.info('Fetching department views data with where clause:', where);
  return getDepartmentViewsDataQuery(where);
};

export const getEventTypesData = async (meldingId: string, preventiefId: string, correctiefId: string) => {
  const where = buildBaseWhereClause(meldingId, preventiefId, correctiefId);
  logger.info('Fetching event types data with where clause:', where);
  return getEventTypesDataQuery(where);
};

export const getTopUsersData = async (
  meldingId: string,
  preventiefId: string,
  correctiefId: string,
  limit: number = 10
) => {
  const where = buildBaseWhereClause(meldingId, preventiefId, correctiefId);
  logger.info('Fetching top users data with where clause:', where);
  return getTopUsersDataQuery(where, limit);
};

export const getActivityTimeData = async (meldingId: string, preventiefId: string, correctiefId: string) => {
  const where = buildBaseWhereClause(meldingId, preventiefId, correctiefId);
  logger.info('Fetching activity time data with where clause:', where);
  return getActivityTimeDataQuery(where);
};

export const getActivityDayData = async (meldingId: string, preventiefId: string, correctiefId: string) => {
  const where = buildBaseWhereClause(meldingId, preventiefId, correctiefId);
  logger.info('Fetching activity day data with where clause:', where);
  return getActivityDayDataQuery(where);
};

export const getTrendData = async (meldingId: string, preventiefId: string, correctiefId: string) => {
  const where = buildBaseWhereClause(meldingId, preventiefId, correctiefId);
  logger.info('Fetching trend data with where clause:', where);
  return getTrendDataQuery(where);
};
