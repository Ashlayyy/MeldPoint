/* eslint-disable no-underscore-dangle */
import { withDatabaseRetry } from '../../../helpers/databaseRetry';
import prisma from '../../prismaClient';

export interface DashboardStats {
  totalUsers: number;
  totalMeldingen: number;
  totalPreventiefs: number;
  totalCorrectief: number;
}

export interface DepartmentStats {
  name: string;
  userCount: number;
}

export interface RoleStats {
  name: string;
  userCount: number;
}

export interface ActivityStats {
  date: Date;
  user: string;
  action: string;
  feature: string;
}

export interface GrowthStats {
  date: Date;
  name: string;
  department: string | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return withDatabaseRetry(async () => {
    const [totalUsers, totalMeldingen, totalPreventiefs, totalCorrectief] = await Promise.all([
      prisma.user.count(),
      prisma.melding.count(),
      prisma.preventief.count(),
      prisma.correctief.count()
    ]);

    return {
      totalUsers,
      totalMeldingen,
      totalPreventiefs,
      totalCorrectief
    };
  });
}

export async function getDepartmentStats(): Promise<DepartmentStats[]> {
  return withDatabaseRetry(async () => {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    return departments.map((dept) => ({
      name: dept.name,
      userCount: dept._count.users
    }));
  });
}

export async function getRoleStats(): Promise<RoleStats[]> {
  return withDatabaseRetry(async () => {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });

    return roles.map((role) => ({
      name: role.name,
      userCount: role._count.userRoles
    }));
  });
}

export async function getActivityStats(days: number): Promise<ActivityStats[]> {
  return withDatabaseRetry(async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.userActivity.findMany({
      where: {
        timestamp: {
          gte: startDate
        }
      },
      select: {
        timestamp: true,
        action: true,
        feature: true,
        userId: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Get user names in a separate query since there's no direct relation
    const userIds = [...new Set(activities.map((a) => a.userId))];
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        Name: true
      }
    });

    const userMap = new Map(users.map((u) => [u.id, u.Name]));

    return activities.map((activity) => ({
      date: activity.timestamp,
      user: userMap.get(activity.userId) || 'Unknown',
      action: activity.action,
      feature: activity.feature
    }));
  });
}

export async function getGrowthStats(period: number): Promise<GrowthStats[]> {
  return withDatabaseRetry(async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const users = await prisma.user.findMany({
      where: {
        CreatedAt: {
          gte: startDate
        }
      },
      orderBy: {
        CreatedAt: 'asc'
      }
    });

    return users.map((user) => ({
      date: user.CreatedAt,
      name: user.Name,
      department: user.departmentId
    }));
  });
}
