/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/return-await */
import prisma from '../prismaClient';
import userSelect from './helpFunctions/userSelect';

export async function getAllReports() {
  return await prisma.melding.findMany({
    include: {
      Status: true,
      User: {
        select: {
          Name: true,
          Email: true,
          id: true,
          Department: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      ChatRoom: {
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            },
            include: {
              user: {
                select: {
                  Name: true,
                  Email: true,
                  id: true,
                  Department: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      Project: {
        select: {
          id: true,
          ProjectNaam: true,
          NumberID: true,
          ProjectLeider: {
            select: {
              id: true,
              Name: true
            }
          }
        }
      },
      Preventief: {
        select: {
          VolgNummer: true,
          id: true,
          CorrespondenceIDs: true,
          Kernoorzaak: true,
          Why: true,
          rootCauseLevel: true,
          Deadline: true,
          Title: true,
          Smart: true,
          Steps: true,
          Strategie: true,
          Conclusie: true,
          TodoItems: true,
          PDCAStatus: true,
          ActJSON: true,
          Teamleden: {
            select: {
              IDs: true
            }
          },
          Status: {
            select: {
              id: true,
              StatusNaam: true,
              StatusColor: true,
              StatusType: true
            }
          },
          User: {
            select: {
              id: true,
              Name: true,
              Department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          Melding: {
            select: {
              id: true,
              VolgNummer: true
            }
          }
        }
      },
      Correctief: {
        select: {
          id: true,
          Deadline: true,
          Oplossing: true,
          Faalkosten: true,
          AkoordOPS: true,
          TIMER: true,
          Status: {
            select: {
              id: true,
              StatusNaam: true,
              StatusColor: true
            }
          },
          User: {
            select: {
              id: true,
              Name: true,
              Department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      VolgNummer: 'desc'
    }
  });
}

export async function getAllProjects() {
  return await prisma.project.findMany({
    include: {
      ProjectLeider: true
    },
    orderBy: {
      NumberID: 'desc'
    }
  });
}

export async function getAllProjectleiders() {
  return await prisma.projectleider.findMany({
    orderBy: {
      Name: 'asc'
    }
  });
}

export async function getAllUsers(page: number = 1, limit: number = 10) {
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      orderBy: {
        Name: 'asc'
      },
      select: userSelect,
      skip: (page - 1) * limit,
      take: limit
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

export async function getAllActiehouders() {
  const users = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: {
              contains: 'Actiehouder'
            }
          }
        }
      }
    },
    select: {
      id: true,
      Name: true,
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

  return users;
}

export async function getAllPreventief() {
  return await prisma.preventief.findMany({
    include: {
      User: true,
      Begeleider: true,
      Status: true,
      Melding: true
    },
    orderBy: {
      Deadline: 'desc'
    }
  });
}

export async function getAllCorrectief() {
  return await prisma.correctief.findMany({
    include: {
      User: true,
      Status: true
    }
  });
}
