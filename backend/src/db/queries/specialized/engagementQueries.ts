import prisma from '../../prismaClient';
import logger from '../../../helpers/loggerInstance';

interface BaseFilter {
  resourceId: { in: string[] };
}

export const getEventTypesDataQuery = async (baseWhere: BaseFilter) => {
  logger.info('Executing getEventTypesDataQuery with where clause:', baseWhere);
  try {
    const eventTypes = await prisma.systemLog.groupBy({
      by: ['action'],
      where: baseWhere,
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      }
    });

    return eventTypes.map((item) => ({
      type: item.action,
      count: item._count.action
    }));
  } catch (error) {
    logger.error('Error in getEventTypesDataQuery:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

export const getTopUsersDataQuery = async (
  baseWhere: BaseFilter,
  limit: number = 10
): Promise<{ userId: string | null; name: string | null; email: string | null; count: number }[]> => {
  const resourceIds = baseWhere.resourceId.in;
  logger.info('Executing getTopUsersDataQuery (aggregateRaw)', { resourceIds, limit });

  try {
    const pipeline = [
      {
        $match: {
          resourceId: { $in: resourceIds },
          userId: { $ne: null }
        }
      },
      {
        $addFields: {
          userIdString: { $toString: '$userId' }
        }
      },
      {
        $group: {
          _id: '$userIdString',
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          count: -1
        }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'User',
          let: { userIdStr: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$userIdStr' }]
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'userDetails'
        }
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$userDetails.Name',
          email: '$userDetails.Email',
          count: '$count'
        }
      }
    ];

    const results = (await prisma.systemLog.aggregateRaw({
      pipeline: pipeline
    })) as unknown as any[];

    return results.map((item) => ({
      userId: item.userId ?? null,
      name: item.name ?? null,
      email: item.email ?? null,
      count: item.count ?? 0
    }));
  } catch (error) {
    logger.error(
      'Error in getTopUsersDataQuery (aggregateRaw):',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
};

export const getDepartmentViewsDataQuery = async (baseWhere: BaseFilter) => {
  const viewActions = [
    'GET_SINGLE_REPORT',
    'GET_SINGLE_REPORT_BY_VOLGNUMMER',
    'GET_CORRECTIEF',
    'GET_SINGLE_PREVENTIEF',
    'GET_SYSTEM_LOGS'
  ];

  const whereClause = {
    ...baseWhere,
    action: { in: viewActions },
    userId: { not: null }
  };

  logger.info('Executing getDepartmentViewsDataQuery with where clause:');
  console.log(whereClause);

  try {
    const logs = await prisma.systemLog.findMany({
      where: whereClause,
      include: {
        User: {
          include: {
            Department: true
          }
        }
      }
    });

    const departmentCounts: Record<string, number> = {};
    for (const log of logs) {
      const deptName = log.User?.Department?.name ?? 'Unknown Department';
      departmentCounts[deptName] = (departmentCounts[deptName] || 0) + 1;
    }

    return Object.entries(departmentCounts)
      .map(([department, count]) => ({
        department,
        count
      }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    logger.error('Error in getDepartmentViewsDataQuery:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

export const getTimelineDataQuery = async (baseWhere: BaseFilter) => {
  const resourceIds = baseWhere.resourceId.in;

  logger.info('Executing getTimelineDataQuery (MongoDB) for resource IDs:', resourceIds);

  try {
    const pipeline = [
      {
        $match: {
          resourceId: { $in: resourceIds }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            action: '$action'
          },

          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.date': 1,
          count: -1
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          action: '$_id.action',
          count: '$count'
        }
      }
    ];

    const rawResult = await prisma.systemLog.aggregateRaw({
      pipeline: pipeline
    });

    const intermediateResult = rawResult as unknown as { date: string; action: string; count: number }[];

    return intermediateResult.map((item) => ({
      date: item.date,
      type: item.action,
      count: item.count
    }));
  } catch (error) {
    logger.error('Error in getTimelineDataQuery (MongoDB):', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

export const getActivityTimeDataQuery = async (baseWhere: BaseFilter) => {
  const resourceIds = baseWhere.resourceId.in;
  logger.info('Executing getActivityTimeDataQuery (MongoDB) for resource IDs:', resourceIds);

  try {
    const pipeline = [
      {
        $match: {
          resourceId: { $in: resourceIds }
        }
      },
      {
        $group: {
          _id: { hour: { $hour: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.hour': 1
        }
      },
      {
        $project: {
          _id: 0,
          hour: '$_id.hour',
          count: '$count'
        }
      }
    ];

    const result = await prisma.systemLog.aggregateRaw({ pipeline });
    return result as unknown as { hour: number; count: number }[];
  } catch (error) {
    logger.error(
      'Error in getActivityTimeDataQuery (MongoDB):',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
};

export const getActivityDayDataQuery = async (baseWhere: BaseFilter) => {
  const resourceIds = baseWhere.resourceId.in;
  logger.info('Executing getActivityDayDataQuery (MongoDB) for resource IDs:', resourceIds);

  try {
    const pipeline = [
      {
        $match: {
          resourceId: { $in: resourceIds }
        }
      },
      {
        $group: {
          _id: { dayOfWeek: { $dayOfWeek: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.dayOfWeek': 1
        }
      },
      {
        $project: {
          _id: 0,
          dayOfWeek: '$_id.dayOfWeek',
          count: '$count'
        }
      }
    ];

    const result = await prisma.systemLog.aggregateRaw({ pipeline });
    return result as unknown as { dayOfWeek: number; count: number }[];
  } catch (error) {
    logger.error(
      'Error in getActivityDayDataQuery (MongoDB):',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
};

export const getTrendDataQuery = async (baseWhere: BaseFilter) => {
  const resourceIds = baseWhere.resourceId.in;
  logger.info('Executing getTrendDataQuery (MongoDB) for resource IDs:', resourceIds);

  try {
    const pipeline = [
      {
        $match: {
          resourceId: { $in: resourceIds }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.date': 1
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          count: '$count'
        }
      }
    ];

    const result = await prisma.systemLog.aggregateRaw({ pipeline });
    return result as unknown as { date: string; count: number }[];
  } catch (error) {
    logger.error('Error in getTrendDataQuery (MongoDB):', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};
