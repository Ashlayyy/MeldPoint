import prisma from '../../prismaClient';
import userSelect from '../helpFunctions/userSelect';

export async function getAllUsers(page: number = 1, limit: number = 10) {
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      orderBy: {
        Name: 'asc'
      },
      skip: (page - 1) * limit,
      take: limit,
      select: userSelect
    }),
    prisma.user.count()
  ]);

  return {
    users,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { Email: email },
    select: userSelect
  });
}

export async function updateUser(
  id: string,
  data: {
    Name?: string;
    Email?: string;
    MicrosoftId?: string;
    departmentId?: string;
  }
) {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.Name && { Name: data.Name }),
      ...(data.Email && { Email: data.Email }),
      ...(data.MicrosoftId && { MicrosoftId: data.MicrosoftId }),
      ...(data.departmentId && {
        Department: { connect: { id: data.departmentId } }
      })
    },
    select: userSelect
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id }
  });
}

export async function getUsersByRole(role: string, page: number = 1, limit: number = 10) {
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: {
                contains: role
              }
            }
          }
        }
      },
      orderBy: {
        Name: 'asc'
      },
      skip: (page - 1) * limit,
      take: limit,
      select: userSelect
    }),
    prisma.user.count({
      where: {
        userRoles: {
          some: {
            role: {
              name: {
                contains: role
              }
            }
          }
        }
      }
    })
  ]);

  return {
    users,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
}

export async function getUsersByDepartment(departmentId: string, page: number = 1, limit: number = 10) {
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: {
        Department: {
          id: departmentId
        }
      },
      orderBy: {
        Name: 'asc'
      },
      skip: (page - 1) * limit,
      take: limit,
      select: userSelect
    }),
    prisma.user.count({
      where: {
        Department: {
          id: departmentId
        }
      }
    })
  ]);

  return {
    users,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
}

export async function searchUsers(filters: { query?: string; role?: string; department?: string; status?: string }) {
  const where: any = {
    AND: []
  };

  if (filters.query) {
    where.AND.push({
      OR: [
        { Name: { contains: filters.query, mode: 'insensitive' } },
        { Email: { contains: filters.query, mode: 'insensitive' } }
      ]
    });
  }

  if (filters.role) {
    where.AND.push({
      userRoles: {
        some: {
          role: {
            name: {
              contains: filters.role
            }
          }
        }
      }
    });
  }

  if (filters.department) {
    where.AND.push({
      Department: {
        name: {
          contains: filters.department
        }
      }
    });
  }

  return prisma.user.findMany({
    where: where.AND.length > 0 ? where : undefined,
    include: {
      Department: true,
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });
}

export async function getActiveUsers(userId: string) {
  return prisma.user.findMany({
    where: {
      OR: [
        {
          Melding: {
            some: {
              UserID: userId
            }
          }
        },
        {
          PreventiefActiehouder: {
            some: {
              ActiehouderID: userId
            }
          }
        },
        {
          PreventiefBegeleider: {
            some: {
              BegeleiderID: userId
            }
          }
        },
        {
          Correctief: {
            some: {
              userId
            }
          }
        }
      ]
    },
    include: {
      Department: true,
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });
}

export async function getAllUsersForFilter() {
  return prisma.user.findMany({
    select: {
      id: true,
      Name: true,
      Email: true,
      Department: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      Name: 'asc'
    }
  });
}
