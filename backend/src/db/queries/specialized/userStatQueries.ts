import prisma from '../../prismaClient';

// Get user count by department
export async function getUserCountByDepartment() {
  const departmentStats = await prisma.user.groupBy({
    by: ['departmentId'],
    _count: true,
    orderBy: {
      departmentId: 'asc'
    }
  });

  return departmentStats;
}

// Get user count by role
export async function getUserCountByRole() {
  const roleStats = await prisma.usersOnRoles.groupBy({
    by: ['roleId'],
    _count: true,
    orderBy: {
      roleId: 'asc'
    }
  });

  const roleDetails = await prisma.role.findMany({
    where: {
      id: {
        in: roleStats.map((stat) => stat.roleId)
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  return roleStats.map((stat) => ({
    ...stat,
    roleName: roleDetails.find((role) => role.id === stat.roleId)?.name
  }));
}

// Get user activity statistics
export async function getUserActivityStats(days: number = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  const [activeUsers, totalUsers, loginStats] = await prisma.$transaction([
    prisma.user.count({
      where: {
        lastLogin: {
          gte: date
        }
      }
    }),
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['lastLogin'],
      where: {
        lastLogin: {
          gte: date
        }
      },
      _count: true,
      orderBy: {
        lastLogin: 'asc'
      }
    })
  ]);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    activityByDate: loginStats
  };
}

// Get user growth statistics
export async function getUserGrowthStats(period: number = 30) {
  const date = new Date();
  date.setDate(date.getDate() - period);

  return prisma.user.groupBy({
    by: ['CreatedAt'],
    where: {
      CreatedAt: {
        gte: date
      }
    },
    _count: true,
    orderBy: {
      CreatedAt: 'asc'
    }
  });
}

// Get comprehensive dashboard statistics
export async function getDashboardStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalUsers, activeUsers, departmentStats, roleStats, newUsersThisMonth, microsoftUsers] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.user.groupBy({
        by: ['departmentId'],
        _count: true,
        orderBy: {
          departmentId: 'asc'
        }
      }),
      prisma.usersOnRoles.groupBy({
        by: ['roleId'],
        _count: true,
        orderBy: {
          roleId: 'asc'
        }
      }),
      prisma.user.count({
        where: {
          CreatedAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.user.count({
        where: {
          MicrosoftId: {
            not: null
          }
        }
      })
    ]);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    newUsersThisMonth,
    departmentDistribution: departmentStats,
    roleDistribution: roleStats,
    authenticationStats: {
      microsoftUsers
    },
    userGrowthRate: ((newUsersThisMonth / totalUsers) * 100).toFixed(2)
  };
}
