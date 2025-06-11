import prisma from '../../prismaClient';

export async function getTasks(filters?: any) {
  return prisma.task.findMany({
    where: filters || {},
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      preventief: true,
      correctief: true
    }
  });
}

export async function getTasksByUserId(userId: string) {
  return prisma.task.findMany({
    where: {
      userId
    },
    include: {
      user: {
        select: {
          id: true,
          Name: true,
          Email: true
          // Add any other user fields you need
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getTasksByDeadline(userId: string, date: Date) {
  return prisma.task.findMany({
    where: {
      userId,
      deadline: {
        lte: date
      },
      completedAt: null
    },
    orderBy: {
      deadline: 'asc'
    }
  });
}

export async function createTask(data: any) {
  return prisma.task.create({
    data: {
      ...data
    }
  });
}

export async function createBatchTasks(data: any) {
  return prisma.task.createMany({
    data: data
  });
}

export async function updateTask(id: string, data: any) {
  // Transform the data to handle relations correctly
  const transformedData = {
    ...data,
    // Handle each relation field if it's present in the data
    ...(data.user && {
      user: {
        connect: { id: data.user }
      }
    }),
    ...(data.preventiefId && {
      preventief: {
        connect: { id: data.preventiefId }
      }
    }),
    ...(data.correctiefId && {
      correctief: {
        connect: { id: data.correctiefId }
      }
    })
  };

  return prisma.task.update({
    where: { id },
    include: {
      correctief: true,
      preventief: true,
      user: true
    },
    data: transformedData
  });
}

export async function completeTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: {
      completedAt: new Date(),
      finished: true
    }
  });
}

export async function uncompleteTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: {
      completedAt: null,
      finished: false
    }
  });
}

export async function deleteTask(id: string) {
  try {
    console.log('[deleteTask] Starting deletion for id:', id);

    const task = await prisma.task.findUnique({
      where: { id }
    });

    console.log('[deleteTask] Found task:', task);

    if (!task) {
      console.log('[deleteTask] Task not found');
      throw new Error(`Task with ID ${id} not found`);
    }

    const result = await prisma.task.delete({
      where: { id }
    });

    console.log('[deleteTask] Successfully deleted task:', result);
    return result;
  } catch (error) {
    console.error('[deleteTask] Error occurred:', error);
    throw error;
  }
}

export const getTasksByCorrectiefQuery = async (correctiefId: string) => {
  const queryResult = await prisma.task.findMany({
    where: {
      correctiefId: correctiefId
    },
    include: {
      user: true,
      correctief: true
    }
  });
  return queryResult;
};

export const getTasksByPreventiefQuery = async (preventiefId: string) => {
  return await prisma.task.findMany({
    where: {
      preventiefId: preventiefId
    },
    include: {
      user: true,
      correctief: true
    }
  });
};

export const findById = async (data: { id: string; category: string }[]) => {
  const transaction = await prisma.$transaction(async (tx) => {
    const taken = await tx.task.findMany({
      where: {
        id: { in: data.map((item) => item.id) }
      },
      include: {
        correctief: {
          include: {
            Status: {
              select: {
                id: true,
                StatusNaam: true,
                StatusColor: true
              }
            },
            Melding: {
              select: {
                id: true,
                Deelorder: true,
                Project: {
                  select: {
                    NumberID: true
                  }
                }
              }
            }
          }
        },
        preventief: {
          include: {
            Status: {
              select: {
                id: true,
                StatusNaam: true,
                StatusColor: true
              }
            }
          }
        }
      }
    });

    // Transform the results
    return taken.map((task) => {
      const taskData = data.find((d) => d.id === task.id);
      if (!taskData) {
        return null;
      }
      if (taskData?.category === 'correctief') {
        return {
          id: task.id,
          category: 'correctief',
          StatusNaam: task.correctief?.Status?.StatusNaam,
          StatusColor: task.correctief?.Status?.StatusColor,
          Deelorder: task.correctief?.Melding?.Deelorder,
          ProjectNumberID: task.correctief?.Melding?.Project?.NumberID,
          correctiefId: task.correctief?.id
        };
      } else if (taskData?.category === 'preventief') {
        return {
          id: task.id,
          category: 'preventief',
          StatusNaam: task.preventief?.Status?.StatusNaam,
          StatusColor: task.preventief?.Status?.StatusColor,
          PDCATitel: task.preventief?.Title || 'N/A',
          preventiefId: task.preventief?.id,
          ProjectNumberID: 'N/A',
          Deelorder: 'N/A'
        };
      }
    });
  });

  return transaction;
};
